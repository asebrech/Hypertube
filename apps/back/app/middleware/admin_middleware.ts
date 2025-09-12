import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Admin middleware is used to check if the authenticated user
 * has administrator privileges.
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Ensure user is authenticated first
    const user = ctx.auth.getUserOrFail()
    
    // Check if user has admin privileges
    if (!user.isAdmin) {
      return ctx.response.forbidden({
        error: 'Access denied. Administrator privileges required.',
        message: 'You do not have permission to perform this action.',
      })
    }

    return next()
  }
}

