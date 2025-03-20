import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('full_name', 'firstName')
      table.string('lastName').nullable()
      table.string('username').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('firstName', 'full_name')
      table.dropColumn('lastName')
    })
  }
}
