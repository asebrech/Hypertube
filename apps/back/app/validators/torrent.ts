import vine from '@vinejs/vine'
import { isValidTmdbId } from '../utils/format.js'

const tmdbIdRule = vine.createRule((value, options, field) => {
  const parsed = Number.parseInt(value)
  if (Number.isNaN(parsed)) {
    field.report('Invalid movie ID provided', 'tmdb_id', field)
    return
  }
  if (!isValidTmdbId(parsed)) {
    field.report('Invalid movie ID provided', 'tmdb_id', field)
  }
})

export const tmdbIdValidator = vine.compile(
  vine.object({
    id: vine
      .string()
      .use(tmdbIdRule())
      .transform((value) => {
        return Number.parseInt(value)
      }),
  })
)
