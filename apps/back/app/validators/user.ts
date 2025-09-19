import vine from '@vinejs/vine'
import { passwordRules } from '#validators/auth'

export const updateUserValidator = vine.compile(
  vine.object({
    username: vine
      .string()
      .minLength(3)
      .maxLength(32)
      .unique(async (query, field, { meta }) => {
        // Skip uniqueness check if username hasn't changed
        const currentUser = await query.from('users').where('id', meta.userId).first()
        if (currentUser && currentUser.username === field) {
          return true
        }
        const user = await query.from('users').where('username', field).first()
        return !user
      })
      .optional(),
    email: vine
      .string()
      .email()
      .unique(async (query, field, { meta }) => {
        // Skip uniqueness check if email hasn't changed
        const currentUser = await query.from('users').where('id', meta.userId).first()
        if (currentUser && currentUser.email === field) {
          return true
        }
        const user = await query.from('users').where('email', field).first()
        return !user
      })
      .optional(),
    password: passwordRules.optional(),
    profilePicture: vine.string().url().optional(),
    firstName: vine.string().minLength(2).maxLength(32).optional(),
    lastName: vine.string().minLength(2).maxLength(32).optional(),
  })
)
