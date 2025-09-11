import vine from '@vinejs/vine'

const SUPPORTED_LANGUAGES = [
  'en',
  'fr',
  'es',
  'de',
  'it',
  'pt',
  'ru',
  'ja',
  'ko',
  'zh',
  'ar',
  'hi',
  'nl',
  'sv',
  'no',
  'da',
]

export const multipleLanguagesValidator = vine.compile(
  vine.object({
    languages: vine.array(vine.string().in(SUPPORTED_LANGUAGES)).optional(),
    language: vine.string().in(SUPPORTED_LANGUAGES).optional(),
  })
)
