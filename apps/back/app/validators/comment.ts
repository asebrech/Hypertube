import vine from '@vinejs/vine'

/**
 * Validator to validate the payload when creating a comment
 */
export const createCommentValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(1000),
    movie_id: vine.number().min(1),
  })
)

/**
 * Validator to validate the payload when creating a comment for a specific movie
 */
export const createMovieCommentValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(1000),
  })
)