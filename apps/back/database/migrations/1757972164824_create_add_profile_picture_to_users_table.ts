import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'profile_picture')

    if (!hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.string('profile_picture').nullable()
      })
    }
  }

  async down() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'profile_picture')

    if (hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('profile_picture')
      })
    }
  }
}
