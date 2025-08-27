import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

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
        createdAt: user.createdAt,
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
        // Don't expose email, password, or other sensitive data
      })
    } catch {
      return response.notFound({ message: 'User not found' })
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
}
