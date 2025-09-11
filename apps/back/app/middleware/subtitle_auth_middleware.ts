import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Subtitle auth middleware that accepts token from Authorization header or query parameter
 */
export default class SubtitleAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, auth, response } = ctx
    
    const queryToken = request.input('token')
    
    if (queryToken) {
      try {
        request.request.headers.authorization = `Bearer ${queryToken}`
      } catch (error) {
        return response.unauthorized({
          error: 'Invalid authentication token',
        })
      }
    }
    
    try {
      await auth.authenticateUsing(['api'])
      return next()
    } catch (error) {
      return response.unauthorized({
        error: 'Authentication required',
      })
    }
  }
}
