import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Drop OAuth fields (if they were added by the previous migration)
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('oauth_provider')
      table.dropColumn('oauth_id') 
      table.dropColumn('oauth_avatar_url')
    })
  }

  async down() {
    // Recreate the fields in case we need to rollback
    this.schema.alterTable(this.tableName, (table) => {
      table.string('oauth_provider').nullable()
      table.string('oauth_id').nullable()
      table.string('oauth_avatar_url').nullable()
    })
  }
}