import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import User from '#models/user'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Movie extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'imdbId' })
  declare imdbId: string

  @column({ columnName: 'tmdbId' })
  declare tmdbId: number

  @column({ columnName: 'title' })
  declare title: string

  @column({ columnName: 'magicLink' })
  declare magicLink: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => User, {
    pivotTable: 'movie_user',
    pivotColumns: ['usersAction'],
  })
  declare users: ManyToMany<typeof User>
}
