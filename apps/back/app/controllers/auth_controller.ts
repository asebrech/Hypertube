import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateUserValidator,
} from '#validators/auth'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import PasswordResetMail from '#mails/password_reset_mail'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import env from '#start/env'
import ProfilePictureService from '#services/profile_picture_service'

export default class AuthController {
  private formatValidationErrors(error: any): any[] {
    const formattedErrors: any[] = []

    if (!error.messages) {
      return formattedErrors
    }

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

    return formattedErrors
  }

  async login({ request, response }: HttpContext) {
    const { identifier, password } = await request.validateUsing(loginValidator)

    // Try to find user by email first
    const user = await User.query()
      .where('email', identifier)
      .orWhere('username', identifier)
      .first()

    if (!user) {
      return response.badRequest({
        error: 'IDENTIFIER_NOT_FOUND',
        message: 'No account found with this email or username',
      })
    }
    const isPasswordValid = await hash.verify(user.password!, password)
    if (!isPasswordValid) {
      return response.badRequest({
        error: 'INVALID_PASSWORD',
        message: 'Invalid password',
      })
    }
    const token = await User.accessTokens.create(user)

    return response.ok({
      token: token,
      ...user.serialize(),
    })
  }

  async register({ request, response }: HttpContext) {
    try {
      // Handle multipart form data for profile picture
      const profilePicture = request.file('profilePicture', {
        size: '5mb',
      })

      // Get other form fields and validate
      const payload = await registerValidator.validate(
        request.only(['email', 'password', 'username', 'firstName', 'lastName'])
      )

      // Create user
      const user = await User.create(payload)

      // Handle profile picture upload if provided
      if (profilePicture && profilePicture.isValid) {
        try {
          const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
          const fileExtension = profilePicture.extname?.toLowerCase()

          if (fileExtension && allowedExtensions.includes(fileExtension)) {
            const { cuid } = await import('@adonisjs/core/helpers')
            const ProfilePictureService = (await import('#services/profile_picture_service'))
              .default
            const env = (await import('#start/env')).default

            const profilePictureService = new ProfilePictureService()
            const uploadsPath = profilePictureService.getUploadsPath()
            const fileName = `${cuid()}.${fileExtension}`

            await profilePicture.move(uploadsPath, { name: fileName })

            const backUrl = env.get('BACK_URL') || 'http://localhost:3333'
            const profilePictureUrl = `${backUrl}/uploads/profiles/${fileName}`

            user.profilePicture = profilePictureUrl
            await user.save()
          }
        } catch (profileError) {
          // Log but don't fail registration if profile picture upload fails
          console.error('Profile picture upload failed during registration:', profileError)
        }
      }

      return response.created(user)
    } catch (error) {
      if (error.messages) {
        const formattedErrors = this.formatValidationErrors(error)

        return response.status(422).json({
          message: 'Validation failed',
          errors: formattedErrors,
        })
      }

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

    if (driverInstance.accessDenied()) {
      return 'You have cancelled the login process'
    }

    if (driverInstance.stateMisMatch()) {
      return 'We are unable to verify the request. Please try again'
    }

    if (driverInstance.hasError()) {
      return driverInstance.getError()
    }

    const user = await driverInstance.user()

    let firstName = ''
    let lastName = ''

    if (params.provider === 'github') {
      const fullName = user.name || user.nickName || ''
      const nameParts = fullName.trim().split(' ')
      firstName = nameParts[0] || ''
      lastName = nameParts.slice(1).join(' ') || ''
    } else if (params.provider === 'google') {
      firstName = user.original?.given_name || ''
      lastName = user.original?.family_name || ''
      if (!firstName && !lastName && user.name) {
        const nameParts = user.name.trim().split(' ')
        firstName = nameParts[0] || ''
        lastName = nameParts.slice(1).join(' ') || ''
      }
    } else if (params.provider === 'discord') {
      // Discord typically provides name as username, split if it contains spaces
      const fullName = user.name || user.nickName || ''
      const nameParts = fullName.trim().split(' ')
      firstName = nameParts[0] || ''
      lastName = nameParts.slice(1).join(' ') || ''
    } else if (params.provider === 'fortyTwo') {
      firstName = user.original?.first_name || ''
      lastName = user.original?.last_name || ''
      if (!firstName && !lastName && user.name) {
        const nameParts = user.name.trim().split(' ')
        firstName = nameParts[0] || ''
        lastName = nameParts.slice(1).join(' ') || ''
      }
    }

    let username = user.name
    if (params.provider === 'fortyTwo') {
      username = user.original?.login || user.nickName || user.name
    } else if (params.provider === 'discord') {
      username = user.nickName || user.name
    }

    let processedAvatarUrl = user.avatarUrl
    if (user.avatarUrl) {
      try {
        const profilePictureService = new ProfilePictureService()
        processedAvatarUrl = await profilePictureService.processProfilePictureUrl(user.avatarUrl)
      } catch (error) {
        console.error('Failed to process OAuth avatar URL:', error)
        processedAvatarUrl = user.avatarUrl
      }
    }

    let dbUser = await User.findBy('email', user.email)
    if (!dbUser) {
      dbUser = await User.create({
        email: user.email,
        username: username,
        firstName: firstName,
        lastName: lastName,
        profilePicture: processedAvatarUrl,
      })
    } else {
      let shouldSave = false

      if (!dbUser.profilePicture && processedAvatarUrl) {
        dbUser.profilePicture = processedAvatarUrl
        shouldSave = true
      }

      if (!dbUser.firstName && firstName) {
        dbUser.firstName = firstName
        shouldSave = true
      }

      if (!dbUser.lastName && lastName) {
        dbUser.lastName = lastName
        shouldSave = true
      }

      if (shouldSave) {
        await dbUser.save()
      }
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
      return response.ok({ message: 'If this email exists, a password reset link has been sent.' })
    }

    await PasswordResetToken.query().where('email', email).delete()

    const token = randomBytes(32).toString('hex')
    const expiresAt = DateTime.now().plus({ hours: 1 })

    await PasswordResetToken.create({
      email,
      token,
      expiresAt,
    })

    const frontUrl = env.get('FRONT_URL') || 'http://localhost:5173'
    const resetUrl = `${frontUrl}/reset-password?token=${token}`
    const userName = user.username || user.firstName || 'User'

    try {
      await mail.send(new PasswordResetMail(email, resetUrl, userName))

      return response.ok({
        message: 'If this email exists, a password reset link has been sent.',
      })
    } catch (error) {
      if (env.get('NODE_ENV') === 'development') {
        return response.ok({
          message: 'Password reset token created (email failed in development).',
          resetUrl,
          token,
          devNote:
            'Email sending failed. Use the resetUrl above to reset your password in development',
        })
      }

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

    user.password = password
    await user.save()

    await PasswordResetToken.query().where('id', resetToken.id).delete()

    return response.ok({ message: 'Password reset successfully.' })
  }

  async updateUser({ request, response, auth, params }: HttpContext) {
    try {
      const userId = params.id
      const authenticatedUser = auth.getUserOrFail()

      if (authenticatedUser.id !== parseInt(userId)) {
        return response.forbidden({ message: 'You can only update your own profile.' })
      }

      const user = await User.findOrFail(userId)

      const payload = await request.validateUsing(updateUserValidator, {
        meta: { userId: parseInt(userId) },
      })

      const isOAuthUser = !user.password
      if (payload.newPassword) {
        if (isOAuthUser) {
          return response.badRequest({
            message:
              'OAuth users cannot set passwords. Please continue using your OAuth provider to sign in.',
            errors: [
              {
                field: 'newPassword',
                message: 'Password changes not allowed for OAuth accounts',
                rule: 'oauth_restriction',
              },
            ],
          })
        }

        if (!payload.currentPassword) {
          return response.badRequest({
            message: 'Current password is required to set a new password.',
            errors: [
              {
                field: 'currentPassword',
                message: 'Current password is required',
                rule: 'required',
              },
            ],
          })
        }

        try {
          await User.verifyCredentials(user.email, payload.currentPassword)
        } catch {
          return response.badRequest({
            message: 'Current password is incorrect.',
            errors: [
              {
                field: 'currentPassword',
                message: 'Current password is incorrect',
                rule: 'invalid',
              },
            ],
          })
        }

        user.password = payload.newPassword
      }

      if (payload.email !== undefined) user.email = payload.email
      if (payload.username !== undefined) user.username = payload.username
      if (payload.firstName !== undefined) user.firstName = payload.firstName
      if (payload.lastName !== undefined) user.lastName = payload.lastName

      await user.save()

      return response.ok({
        message: 'Profile updated successfully.',
        user: user.serialize(),
      })
    } catch (error) {
      if (error.messages) {
        const formattedErrors = this.formatValidationErrors(error)

        return response.status(422).json({
          message: 'Validation failed',
          errors: formattedErrors,
        })
      }

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
}
