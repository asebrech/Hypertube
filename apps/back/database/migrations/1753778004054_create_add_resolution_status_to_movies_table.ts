import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'movies'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('resolution_480p_ready').defaultTo(false)
      table.boolean('resolution_720p_ready').defaultTo(false)
      table.boolean('resolution_1080p_ready').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('resolution_480p_ready')
      table.dropColumn('resolution_720p_ready')
      table.dropColumn('resolution_1080p_ready')
    })
  }
}
