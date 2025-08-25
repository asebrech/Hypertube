import vine from '@vinejs/vine'

/**
 * Validator to validate the payload when creating a comment for a specific movie
 */
export const createMovieCommentValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(1000),
  })
)