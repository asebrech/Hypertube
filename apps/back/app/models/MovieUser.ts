import { BaseModel, column } from '@adonisjs/lucid/orm'
import { UserMovieAction } from '@hypertube/shared'

export default class MovieUser extends BaseModel {
  public static table = 'movie_user'

  @column()
  declare user_id: number

  @column()
  declare movie_id: number

  @column()
  declare usersAction: UserMovieAction
}
