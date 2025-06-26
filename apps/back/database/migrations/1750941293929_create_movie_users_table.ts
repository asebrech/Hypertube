import { BaseSchema } from '@adonisjs/lucid/schema'

enum UserMovieAction {
  WATCHED = 'watched',
  BOOKMARKED = 'bookmarked',
}

export default class extends BaseSchema {
  protected tableName = 'movie_user'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('movie_id')
        .unsigned()
        .references('id')
        .inTable('movies')
        .onDelete('CASCADE')

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // 👇 Add your pivot column
      table.enum('users_action', Object.values(UserMovieAction)).notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
