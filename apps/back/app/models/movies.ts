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

  @column({ columnName: 'resolution_480p_ready' })
  declare resolution480pReady: boolean

  @column({ columnName: 'resolution_720p_ready' })
  declare resolution720pReady: boolean

  @column({ columnName: 'resolution_1080p_ready' })
  declare resolution1080pReady: boolean

  @column({ columnName: 'download_status' })
  declare downloadStatus: string

  @column({ columnName: 'conversion_status' })
  declare conversionStatus: string

  @column({ columnName: 'duration' })
  declare duration: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => User, {
    pivotTable: 'movie_user',
    pivotColumns: ['is_watched', 'is_bookmarked', 'watch_progress_seconds', 'last_watched_at'],
  })
  declare users: ManyToMany<typeof User>
}
