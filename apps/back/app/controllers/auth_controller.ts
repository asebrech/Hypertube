import type { HttpContext } from '@adonisjs/core/http'
import { registerValidator, loginValidator } from '#validators/auth'
import User from '#models/user'
import { Testos } from '@hypertube/shared'
import env from '#start/env'

export default class AuthController {
  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return response.ok({
      token: token,
      ...user.serialize(),
    })
  }

  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    const user = await User.create(payload)

    return response.created(user)
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const token = auth.user?.currentAccessToken.identifier
    if (!token) {
      return response.badRequest({ message: 'Token not found' })
    }
    await User.accessTokens.delete(user, token)
    return response.ok({ message: 'Logged out' })
  }

  async callback({ ally, params, response }: HttpContext) {
    const driverInstance = ally.use(params.provider)

    /**
     * User has denied access by canceling
     * the login flow
     */
    if (driverInstance.accessDenied()) {
      return 'You have cancelled the login process'
    }

    /**
     * OAuth state verification failed. This happens when the
     * CSRF cookie gets expired.
     */
    if (driverInstance.stateMisMatch()) {
      return 'We are unable to verify the request. Please try again'
    }

    /**
     * GitHub responded with some error
     */
    if (driverInstance.hasError()) {
      return driverInstance.getError()
    }

    /**
     * Access user info
     */
    const user = await driverInstance.user()

    let dbUser = await User.findBy('email', user.email)
    if (!dbUser) {
      dbUser = await User.create({
        email: user.email,
        username: user.name,
      })
    }

    const accessToken = await User.accessTokens.create(dbUser)
    const token = accessToken.toJSON().token

    response.plainCookie('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      encode: false,
    })

    return response.redirect(env.get('FRONT_URL') || 'http://localhost:5173')
  }
}
