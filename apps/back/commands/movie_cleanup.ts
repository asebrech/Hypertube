import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import MovieCleanupService from '#services/movie_cleanup_service'

export default class MovieCleanup extends BaseCommand {
  static commandName = 'movie:cleanup'
  static description = "Clean up movies that haven't been accessed for more than 30 days"
  static options: CommandOptions = { startApp: true }

  @flags.boolean({ description: 'Perform a dry run without actually deleting files' })
  declare dryRun: boolean

  @args.string({
    description: 'Number of days after which to clean movies (default: 30)',
    required: false,
  })
  declare days?: string

  async run() {
    const daysThreshold = this.days ? Number.parseInt(this.days, 10) : 30
    const cleanupService = new MovieCleanupService()

    try {
      const result = await cleanupService.cleanupOldMovies({
        dryRun: this.dryRun,
        daysThreshold,
        logProgress: (message: string) => {
          if (message.startsWith('✓')) {
            this.logger.success(message.substring(2))
          } else if (message.startsWith('✗')) {
            this.logger.error(message.substring(2))
          } else if (message.includes('DRY RUN')) {
            this.logger.warning(message)
          } else {
            this.logger.info(message)
          }
        },
      })

      if (!result) {
        this.logger.error(`Cleanup failed.`)
        process.exit(1)
      }

      if (result.errors > 0) {
        this.logger.warning(`Cleanup completed with ${result.errors} errors`)
        result.errorMessages.forEach((error) => this.logger.error(`  - ${error}`))
      } else {
        this.logger.success('Cleanup completed successfully!')
      }

      if (result.moviesCleaned.length > 0) {
        this.logger.info('Movies cleaned:')
        result.moviesCleaned.forEach((movie) => this.logger.info(`  - ${movie}`))
      }
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error}`)
      process.exit(1)
    }
  }
}
