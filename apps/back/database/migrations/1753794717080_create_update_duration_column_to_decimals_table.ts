import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'movies'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Change duration from integer to decimal(10,6) to support precise durations
      table.decimal('duration', 10, 6).alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Revert back to integer
      table.integer('duration').alter()
    })
  }
}
