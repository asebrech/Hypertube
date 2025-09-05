import vine from '@vinejs/vine'
import { isValidTmdbId } from '../utils/format.js'

export const tmdbIdValidator = vine.compile(
  vine.object({
    id: vine
      .string()
      .transform((value) => {
        const parsed = Number.parseInt(value)
        if (Number.isNaN(parsed)) {
          throw new Error('Invalid movie ID provided')
        }
        return parsed
      })
      .use((value, field, report) => {
        if (!isValidTmdbId(value)) {
          report(field, 'Invalid movie ID provided', 'tmdb_id', {})
        }
      }),
  })
)
