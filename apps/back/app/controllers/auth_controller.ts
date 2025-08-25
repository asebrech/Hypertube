import type { HttpContext } from '@adonisjs/core/http'
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '#validators/auth'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import PasswordResetMail from '#mails/password_reset_mail'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
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
    try {
      const payload = await request.validateUsing(registerValidator)

      const user = await User.create(payload)

      return response.created(user)
    } catch (error) {
      // Handle Vine.js validation errors (including unique constraint violations)
      if (error.messages) {
        const formattedErrors: any[] = []

        // Vine.js errors can be structured differently
        if (Array.isArray(error.messages)) {
          // If messages is an array of error objects
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
          // If messages is an object with field keys
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

      // Generic error fallback
      return response.status(500).json({
        message: 'Internal server error',
        errors: [
          {
            field: 'general',
            message: 'An unexpected error occurred',
            rule: 'server_error',
          },
        ],
      })
    }
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

  async forgotPassword({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)

    const user = await User.findBy('email', email)
    if (!user) {
      // Don't reveal if email exists or not for security
      return response.ok({ message: 'If this email exists, a password reset link has been sent.' })
    }

    // Clean up old tokens for this email
    await PasswordResetToken.query().where('email', email).delete()

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    const expiresAt = DateTime.now().plus({ hours: 1 })

    // Save token to database
    await PasswordResetToken.create({
      email,
      token,
      expiresAt,
    })

    // Send email or log in development
    const frontUrl = env.get('FRONT_URL') || 'http://localhost:5173'
    const resetUrl = `${frontUrl}/reset-password?token=${token}`
    const userName = user.username || user.firstName || 'User'

    try {
      // Try to send email
      await mail.send(new PasswordResetMail(email, resetUrl, userName))

      return response.ok({
        message: 'If this email exists, a password reset link has been sent.',
      })
    } catch (error) {

      // In development, provide the reset URL directly
      if (env.get('NODE_ENV') === 'development') {
        return response.ok({
          message: 'Password reset token created (email failed in development).',
          resetUrl,
          token,
          devNote:
            'Email sending failed. Use the resetUrl above to reset your password in development',
        })
      }

      // In production, just log the error and return generic message
      return response.ok({ message: 'If this email exists, a password reset link has been sent.' })
    }
  }

  async resetPassword({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)

    const resetToken = await PasswordResetToken.query()
      .where('token', token)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!resetToken) {
      return response.badRequest({ message: 'Invalid or expired reset token.' })
    }

    const user = await User.findBy('email', resetToken.email)
    if (!user) {
      return response.badRequest({ message: 'User not found.' })
    }

    // Update password
    user.password = password
    await user.save()

    // Clean up used token
    await PasswordResetToken.query().where('id', resetToken.id).delete()

    return response.ok({ message: 'Password reset successfully.' })
  }
}
