import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'movies'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('download_status', ['pending', 'downloading', 'completed', 'failed']).defaultTo('pending')
      table.enum('conversion_status', ['pending', 'converting', 'completed', 'failed']).defaultTo('pending')
      table.integer('duration').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('download_status')
      table.dropColumn('conversion_status')
      table.dropColumn('duration')
    })
  }
}
