import vine from '@vinejs/vine'

// Password security rules
const passwordRules = vine
  .string()
  .minLength(12)
  .maxLength(32)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[\w!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/
  )

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: passwordRules,
  })
)

export const registerValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (query, field) => {
        const user = await query.from('users').where('email', field).first()
        return !user
      }),
    password: passwordRules,
    username: vine
      .string()
      .minLength(3)
      .maxLength(32)
      .unique(async (query, field) => {
        const user = await query.from('users').where('username', field).first()
        return !user
      })
      .optional(),
    firstName: vine.string().minLength(2).maxLength(32).optional(),
    lastName: vine.string().minLength(2).maxLength(32).optional(),
  })
)

export const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string(),
    password: passwordRules,
  })
)
