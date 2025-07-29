import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'movies'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Change duration from decimal(10,6) to integer to avoid overflow
      // Movie durations in seconds don't need decimal precision
      table.integer('duration').alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Revert back to decimal(10,6)
      table.decimal('duration', 10, 6).alter()
    })
  }
}
