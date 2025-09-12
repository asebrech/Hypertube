import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class PasswordResetToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare token: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  public static async cleanup(): Promise<number> {
    const expiredTokens = await this.query().where('expires_at', '<', DateTime.now().toSQL())
    const count = expiredTokens.length
    await this.query().where('expires_at', '<', DateTime.now().toSQL()).delete()
    return count
  }
}
