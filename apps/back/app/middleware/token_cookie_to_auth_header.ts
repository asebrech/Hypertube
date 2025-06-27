import type { HttpContext } from '@adonisjs/core/http'

export default class TokenCookieToAuthHeaderMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const token = ctx.request.cookie('session')

    if (token) {
      ctx.request.request.headers['authorization'] = `Bearer ${token}`
    }

    await next()
  }
}