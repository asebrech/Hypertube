import vine from '@vinejs/vine'
import langData from '@hypertube/shared/src/lang.json' with { type: 'json' }

export const SUPPORTED_LANGUAGES = Object.keys(langData)

export const multipleLanguagesValidator = vine.compile(
  vine.object({
    languages: vine.array(vine.string().in(SUPPORTED_LANGUAGES)).optional(),
    language: vine.string().in(SUPPORTED_LANGUAGES).optional(),
  })
)
