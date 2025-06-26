import env from '#start/env'
import { defineConfig, services } from '@adonisjs/ally'
import { intra } from '@gmehdevi/ally-intra'

const allyConfig = defineConfig({
  github: services.github({
    clientId: env.get('GITHUB_CLIENT_ID'),
    clientSecret: env.get('GITHUB_CLIENT_SECRET'),
    callbackUrl: `${env.get('BACK_URL')}/github/callback`,
  }),
  google: services.google({
    clientId: env.get('GOOGLE_CLIENT_ID'),
    clientSecret: env.get('GOOGLE_CLIENT_SECRET'),
    callbackUrl: `${env.get('BACK_URL')}/google/callback`,
  }),
  fortyTwo: intra({
    clientId:     env.get('INTRA_CLIENT_ID')!,
    clientSecret: env.get('INTRA_CLIENT_SECRET')!,
    callbackUrl:  `${env.get('BACK_URL')}/fortyTwo/callback`,
  }),

})

export default allyConfig

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
