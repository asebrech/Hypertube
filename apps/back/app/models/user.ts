import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Movies from '#models/movies'
import Comment from '#models/comment'
import type { ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email', 'username'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare username: string | null

  @column({ columnName: 'last_name' })
  declare lastName: string | null

  @column({ columnName: 'first_name' })
  declare firstName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare isAdmin: boolean

  @column({ columnName: 'allow_adult_content' })
  declare allowAdultContent: boolean

  @column({ columnName: 'profile_picture' })
  declare profilePicture: string | null

  @manyToMany(() => Movies, {
    pivotTable: 'movie_user',
    pivotColumns: ['is_watched', 'is_bookmarked', 'watch_progress_seconds', 'last_watched_at'],
    pivotTimestamps: true,
  })
  declare movies: ManyToMany<typeof Movies>

  @hasMany(() => Comment, {
    foreignKey: 'userId',
  })
  declare comments: HasMany<typeof Comment>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
