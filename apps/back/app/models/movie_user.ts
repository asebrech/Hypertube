import { BaseModel, column } from '@adonisjs/lucid/orm'
import { UserMovieAction } from '@hypertube/shared'
import { DateTime } from 'luxon'

export default class MovieUser extends BaseModel {
  public static table = 'movie_user'

  @column()
  declare user_id: number

  @column()
  declare movie_id: number

  @column()
  declare usersAction: UserMovieAction

  @column()
  declare watch_progress_seconds: number | null

  @column.dateTime()
  declare last_watched_at: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
