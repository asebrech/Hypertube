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

  /**
   * Categorizes OAuth errors to provide consistent error types
   */
  private categorizeOAuthError(error: string | null): string {
    if (!error) {
      return 'unknown_error'
    }

    const errorLower = error.toLowerCase()

    if (errorLower.includes('access_denied') || errorLower.includes('cancelled')) {
      return 'access_denied'
    }

    if (errorLower.includes('invalid_request')) {
      return 'invalid_request'
    }

    if (errorLower.includes('invalid_client')) {
      return 'invalid_client'
    }

    if (errorLower.includes('invalid_scope')) {
      return 'invalid_scope'
    }

    if (errorLower.includes('server_error') || errorLower.includes('temporarily_unavailable')) {
      return 'server_error'
    }

    if (errorLower.includes('unauthorized')) {
      return 'unauthorized'
    }

    return 'oauth_error'
  }

  private cleanUsername(baseUsername: string): string {
    let cleanUsername = baseUsername
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    if (!cleanUsername || cleanUsername.length === 0) {
      cleanUsername = 'user'
    }
    if (cleanUsername.length < 3) {
      cleanUsername = `${cleanUsername}_user`.substring(0, 10)
    }
    if (cleanUsername.length > 20) {
      cleanUsername = cleanUsername.substring(0, 20)
    }

    return cleanUsername
  }

  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    const cleanUsername = this.cleanUsername(baseUsername)
    let uniqueUsername = cleanUsername
    let counter = 1

    while (await User.findBy('username', uniqueUsername)) {
      const counterStr = counter.toString()
      const maxBaseLength = 25 - counterStr.length

      const truncatedBase =
        cleanUsername.length > maxBaseLength
          ? cleanUsername.substring(0, maxBaseLength)
          : cleanUsername

      uniqueUsername = `${truncatedBase}${counter}`
      counter++

      if (counter > 5) {
        uniqueUsername = `user_${Date.now().toString().slice(-8)}`
        break
      }
    }

    return uniqueUsername
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
    const frontendUrl = env.get('FRONT_URL') || 'http://localhost:5173'

    if (driverInstance.accessDenied()) {
      return response.redirect(
        `${frontendUrl}/login?oauth_error=access_denied&provider=${params.provider}`
      )
    }

    if (driverInstance.stateMisMatch()) {
      return response.redirect(
        `${frontendUrl}/login?oauth_error=state_mismatch&provider=${params.provider}`
      )
    }

    if (driverInstance.hasError()) {
      const error = driverInstance.getError()
      const errorType = this.categorizeOAuthError(error)
      return response.redirect(
        `${frontendUrl}/login?oauth_error=${errorType}&provider=${params.provider}&details=${encodeURIComponent(error || 'unknown_error')}`
      )
    }

    try {
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
      } else if (params.provider === 'fortyTwo') {
        firstName = user.original?.first_name || ''
        lastName = user.original?.last_name || ''
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

      let baseUsername = user.name
      if (params.provider === 'fortyTwo') {
        baseUsername = user.original?.login || user.nickName || user.name
      } else if (params.provider === 'discord') {
        baseUsername = user.nickName || user.name
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
        // Get the desired username and clean it according to our policy
        const usernameSource = baseUsername || user.email?.split('@')[0] || 'oauthuser'
        const cleanedUsername = this.cleanUsername(usernameSource)

        // Check if the cleaned username is available
        const existingUser = await User.findBy('username', cleanedUsername)
        let finalUsername = cleanedUsername

        // Only generate a unique username if there's a conflict
        if (existingUser) {
          console.log(
            `OAuth username conflict: "${cleanedUsername}" already exists, generating unique version for ${params.provider}`
          )
          finalUsername = await this.generateUniqueUsername(usernameSource)
          console.log(`OAuth username resolved: "${cleanedUsername}" → "${finalUsername}"`)
        } else {
          console.log(`OAuth username "${cleanedUsername}" is available for ${params.provider}`)
        }

        dbUser = await User.create({
          email: user.email,
          username: finalUsername,
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

      return response.redirect(frontendUrl)
    } catch (error) {
      console.error(`OAuth ${params.provider} authentication error:`, error)

      // Handle specific error cases
      let errorType = 'processing_error'
      let errorDetails = 'An error occurred during authentication'

      if (error.message?.includes('email')) {
        errorType = 'email_error'
        errorDetails = 'Email processing failed'
      } else if (error.message?.includes('username') || error.message?.includes('unique')) {
        errorType = 'user_error'
        errorDetails = 'Username conflict during account creation'
      } else if (error.message?.includes('user')) {
        errorType = 'user_error'
        errorDetails = 'User creation or update failed'
      } else if (error.message?.includes('token')) {
        errorType = 'token_error'
        errorDetails = 'Token generation failed'
      }

      return response.redirect(
        `${frontendUrl}/login?oauth_error=${errorType}&provider=${params.provider}&details=${encodeURIComponent(errorDetails)}`
      )
    }
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
      if (payload.allowAdultContent !== undefined) user.allowAdultContent = payload.allowAdultContent

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
