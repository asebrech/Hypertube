import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import env from '#start/env'
import { updateUserValidator } from '#validators/user'
import { join } from 'node:path'
import ProfilePictureService from '#services/profile_picture_service'

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
   * Update user profile (authenticated users can update any profile)
   */
  async update({ request, response, auth, params }: HttpContext) {
    try {
      // Ensure user is authenticated (but can update any profile)
      auth.getUserOrFail()
      const userId = parseInt(params.id)

      const user = await User.findOrFail(userId)

      // Validate the request data
      const payload = await updateUserValidator.validate(request.all(), {
        meta: { userId: userId },
      })

      // Update fields if provided
      if (payload.username !== undefined) user.username = payload.username
      if (payload.email !== undefined) user.email = payload.email
      if (payload.firstName !== undefined) user.firstName = payload.firstName
      if (payload.lastName !== undefined) user.lastName = payload.lastName
      if (payload.password !== undefined) user.password = payload.password
      
      // Handle profile picture - download external images to avoid TTL issues
      if (payload.profilePicture !== undefined) {
        try {
          const profilePictureService = new ProfilePictureService()
          user.profilePicture = await profilePictureService.processProfilePictureUrl(payload.profilePicture)
        } catch (error) {
          console.error('Profile picture processing error:', error)
          // If download fails, still save the original URL as fallback
          user.profilePicture = payload.profilePicture
        }
      }

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
      // Handle validation errors
      if (error.messages) {
        const formattedErrors: any[] = []
        
        if (Array.isArray(error.messages)) {
          for (const errorObj of error.messages) {
            let rule = 'validation'
            if (errorObj.rule === 'database.unique') {
              rule = 'unique'
            } else if (errorObj.rule && errorObj.rule.includes('email')) {
              rule = 'email'
            } else if (errorObj.rule && errorObj.rule.includes('password')) {
              rule = 'password'
            }

            formattedErrors.push({
              field: errorObj.field,
              message: errorObj.message,
              rule: rule,
            })
          }
        } else if (typeof error.messages === 'object') {
          for (const [field, fieldErrors] of Object.entries(error.messages)) {
            if (Array.isArray(fieldErrors)) {
              for (const fieldError of fieldErrors) {
                let rule = 'validation'
                if (typeof fieldError === 'string') {
                  if (fieldError.includes('unique') || fieldError.includes('already')) {
                    rule = 'unique'
                  } else if (fieldError.includes('email')) {
                    rule = 'email'
                  } else if (fieldError.includes('password')) {
                    rule = 'password'
                  }
                } else if (fieldError.rule === 'database.unique') {
                  rule = 'unique'
                }

                formattedErrors.push({
                  field: field,
                  message: typeof fieldError === 'string' ? fieldError : fieldError.message,
                  rule: rule,
                })
              }
            }
          }
        }

        return response.status(422).json({
          message: 'Validation failed',
          errors: formattedErrors,
        })
      }

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
          errors: profilePicture.errors,
        })
      }

      // Create uploads directory if it doesn't exist
      const profilePictureService = new ProfilePictureService()
      const uploadsPath = profilePictureService.getUploadsPath()

      // Generate unique filename
      const fileName = `${cuid()}.${profilePicture.extname?.toLowerCase()}`

      // Move file to uploads directory
      await profilePicture.move(uploadsPath, {
        name: fileName,
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
