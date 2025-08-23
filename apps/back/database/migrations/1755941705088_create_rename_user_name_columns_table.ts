import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('firstName', 'first_name')
      table.renameColumn('lastName', 'last_name')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('first_name', 'firstName')
      table.renameColumn('last_name', 'lastName')
    })
  }
}