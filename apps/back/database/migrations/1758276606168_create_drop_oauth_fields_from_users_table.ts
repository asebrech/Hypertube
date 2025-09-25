import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    const hasOauthProvider = await this.schema.hasColumn(this.tableName, 'oauth_provider')
    const hasOauthId = await this.schema.hasColumn(this.tableName, 'oauth_id')
    const hasOauthAvatarUrl = await this.schema.hasColumn(this.tableName, 'oauth_avatar_url')

    if (hasOauthProvider || hasOauthId || hasOauthAvatarUrl) {
      this.schema.alterTable(this.tableName, (table) => {
        if (hasOauthProvider) table.dropColumn('oauth_provider')
        if (hasOauthId) table.dropColumn('oauth_id')
        if (hasOauthAvatarUrl) table.dropColumn('oauth_avatar_url')
      })
    }
  }

  async down() {
    const hasOauthProvider = await this.schema.hasColumn(this.tableName, 'oauth_provider')
    const hasOauthId = await this.schema.hasColumn(this.tableName, 'oauth_id')
    const hasOauthAvatarUrl = await this.schema.hasColumn(this.tableName, 'oauth_avatar_url')

    this.schema.alterTable(this.tableName, (table) => {
      if (!hasOauthProvider) table.string('oauth_provider').nullable()
      if (!hasOauthId) table.string('oauth_id').nullable()
      if (!hasOauthAvatarUrl) table.string('oauth_avatar_url').nullable()
    })
  }
}
