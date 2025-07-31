import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'movie_user'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('watch_progress_seconds').nullable().defaultTo(0)
      table.timestamp('last_watched_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('watch_progress_seconds')
      table.dropColumn('last_watched_at')
    })
  }
}

