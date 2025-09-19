import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import env from '#start/env'

export default class UsersController {
  /**
   * Get current user's full profile (authenticated)
   */
  async me({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      return response.ok({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        isOAuthUser: !user.password, // Flag to indicate if user signed up via OAuth
      })
    } catch {
      return response.unauthorized({ error: 'User not found' })
    }
  }

  /**
   * Get user's public profile by ID
   */
  async show({ params, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id)

      // Return only public information
      return response.ok({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        // Don't expose email, password, or other sensitive data
      })
    } catch {
      return response.notFound({ message: 'User not found' })
    }
  }

  /**
   * Get user's profile by username (public information)
   */
  async profileByUsername({ params, response }: HttpContext) {
    try {
      // Decode the URL-encoded username parameter
      const username = decodeURIComponent(params.username)
      const user = await User.query()
        .whereRaw('LOWER(username) = LOWER(?)', [username])
        .firstOrFail()

      // Get statistics
      const moviesWatched = await db
        .from('movie_user')
        .where('user_id', user.id)
        .where('is_watched', true)
        .count('* as total')
        .first()

      const totalComments = await db
        .from('comments')
        .where('user_id', user.id)
        .count('* as total')
        .first()

      // Get actual watched movies (limit to recent 12 for performance)
      const watchedMoviesRaw = await db
        .from('movie_user')
        .join('movies', 'movie_user.movie_id', 'movies.id')
        .where('movie_user.user_id', user.id)
        .where('movie_user.is_watched', true)
        .select(
          'movies.id',
          'movies.title',
          'movies.imdbId',
          'movies.tmdbId',
          'movie_user.last_watched_at',
          'movie_user.watch_progress_seconds'
        )
        .orderBy('movie_user.last_watched_at', 'desc')
        .limit(12)

      // Add default type field for frontend compatibility
      const watchedMovies = watchedMoviesRaw.map((movie) => ({
        ...movie,
        type: 'movie' as const, // Default to 'movie' type
      }))

      // Return only public information
      return response.ok({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        moviesWatched: Number(moviesWatched?.total || 0),
        totalComments: Number(totalComments?.total || 0),
        watchedMoviesData: watchedMovies,
        // Don't expose email, password, or other sensitive data
      })
    } catch (error) {
      console.error('Profile lookup error:', error)
      return response.notFound({ message: 'User not found' })
    }
  }

  /**
   * Update user profile (only allow users to update their own profile)
   */
  async update({ request, response, auth, params }: HttpContext) {
    try {
      const authenticatedUser = auth.getUserOrFail()
      const userId = parseInt(params.id)

      // Users can only update their own profile
      if (authenticatedUser.id !== userId) {
        return response.forbidden({ message: 'You can only update your own profile' })
      }

      const user = await User.findOrFail(userId)

      // Get the update data from request body
      const updateData = request.only(['username', 'firstName', 'lastName'])

      // Validate username uniqueness if it's being changed
      if (updateData.username && updateData.username !== user.username) {
        const existingUser = await User.findBy('username', updateData.username)
        if (existingUser) {
          return response.badRequest({ message: 'Username already taken' })
        }
      }

      // Update the user
      user.merge(updateData)
      await user.save()

      return response.ok({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
      return response.badRequest({ message: 'Failed to update profile' })
    }
  }

  /**
   * Get multiple users by IDs (for example, for movie cast, friends, etc.)
   */
  async index({ request, response }: HttpContext) {
    const { ids } = request.qs()

    if (!ids) {
      return response.badRequest({ message: 'User IDs are required' })
    }

    try {
      const userIds = Array.isArray(ids) ? ids : [ids]
      const users = await User.query().whereIn('id', userIds)

      // Return only public information for all users
      const publicUsers = users.map((user) => ({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      }))

      return response.ok(publicUsers)
    } catch (error) {
      return response.badRequest({ message: 'Invalid user IDs' })
    }
  }

  /**
   * Upload profile picture for authenticated user
   */
  async uploadProfilePicture({ request, response, auth }: HttpContext) {
    try {
      const authenticatedUser = auth.getUserOrFail()
      
      const profilePicture = request.file('profilePicture', {
        size: '5mb',
      })

      if (!profilePicture) {
        return response.badRequest({ message: 'Profile picture file is required' })
      }

      // Custom case-insensitive file extension validation
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      const fileExtension = profilePicture.extname?.toLowerCase()
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return response.badRequest({ 
          message: `Invalid file type. Only JPG, JPEG, PNG, GIF, and WebP files are allowed.`,
        })
      }

      if (!profilePicture.isValid) {
        return response.badRequest({ 
          message: 'Invalid file', 
          errors: profilePicture.errors 
        })
      }

      // Create uploads directory if it doesn't exist
      const uploadsPath = app.makePath('public/uploads/profiles')
      
      // Generate unique filename
      const fileName = `${cuid()}.${profilePicture.extname?.toLowerCase()}`
      
      // Move file to uploads directory
      await profilePicture.move(uploadsPath, {
        name: fileName
      })

      // Update user with full profile picture URL
      const user = await User.findOrFail(authenticatedUser.id)
      const backUrl = env.get('BACK_URL') || 'http://localhost:3333'
      const profilePictureUrl = `${backUrl}/uploads/profiles/${fileName}`
      user.profilePicture = profilePictureUrl
      await user.save()

      return response.ok({
        message: 'Profile picture uploaded successfully',
        profilePicture: profilePictureUrl,
      })
    } catch (error) {
      console.error('Profile picture upload error:', error)
      return response.badRequest({ message: 'Failed to upload profile picture' })
    }
  }
}
