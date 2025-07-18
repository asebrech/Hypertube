import { BaseModel, column, manyToMany } from "@adonisjs/lucid/orm"
import User from "#models/user"
import type { ManyToMany } from "@adonisjs/lucid/types/relations"

export default class Movie extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare imdbId: string

  @column()
  declare tmdbId: number

  @column()
  declare title: string

  @column()
  declare magicLink: string

  @manyToMany(() => User, {
    pivotTable: 'movie_user',
    pivotColumns: ['usersAction'],
  })
  declare users: ManyToMany<typeof User>
}
