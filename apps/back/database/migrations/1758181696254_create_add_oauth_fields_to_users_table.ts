import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('oauth_provider').nullable() // 'google', 'github', 'fortytwo'
      table.string('oauth_id').nullable() // OAuth provider user ID
      table.string('oauth_avatar_url').nullable() // OAuth profile picture URL
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('oauth_provider')
      table.dropColumn('oauth_id')  
      table.dropColumn('oauth_avatar_url')
    })
  }
}