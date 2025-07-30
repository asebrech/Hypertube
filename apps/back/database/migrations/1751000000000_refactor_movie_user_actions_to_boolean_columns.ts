import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'movie_user'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add new boolean columns
      table.boolean('is_watched').defaultTo(false).notNullable()
      table.boolean('is_bookmarked').defaultTo(false).notNullable()
      
      // Remove the old usersAction enum column
      table.dropColumn('usersAction')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Restore the old usersAction column
      table.string('usersAction').nullable()
      
      // Remove the new boolean columns
      table.dropColumn('is_watched')
      table.dropColumn('is_bookmarked')
    })
  }
}

