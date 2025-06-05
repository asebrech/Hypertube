import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(8).maxLength(32),
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
    password: vine.string().minLength(8).maxLength(32),
    username: vine.string().minLength(3).maxLength(64).optional(),
    fisrtName: vine.string().minLength(3).maxLength(64).optional(),
    lastName: vine.string().minLength(3).maxLength(64).optional(),
  })
)
