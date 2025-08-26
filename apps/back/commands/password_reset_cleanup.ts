import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import PasswordResetToken from '#models/password_reset_token'

export default class PasswordResetCleanup extends BaseCommand {
  static commandName = 'password-reset:cleanup'
  static description = 'Clean up expired password reset tokens'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Starting password reset token cleanup...')

    const deletedCount = await PasswordResetToken.cleanup()

    this.logger.info(`Cleaned up ${deletedCount} expired password reset tokens`)
  }
}
