import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Clean up old profile pictures with relative paths
    // Set them to NULL so users need to re-upload or use OAuth
    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .where('profile_picture', 'like', '/uploads/%')
        .update({ profile_picture: null })

      console.log('✅ Cleaned up old profile picture paths - users will need to re-upload')
    })
  }

  async down() {
    // No rollback needed - we're just cleaning up deprecated data
  }
}
