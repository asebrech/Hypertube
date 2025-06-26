import { BaseModel, column } from '@adonisjs/lucid/orm'
import { UserMovieAction } from '@hypertube/shared'

export default class MovieUser extends BaseModel {
  public static table = 'movie_user'

  @column()
  declare userId: number

  @column()
  declare movieId: number

  @column()
  declare usersAction: UserMovieAction
}
