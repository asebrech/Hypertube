import type { ApplicationService } from '@adonisjs/core/types'
import SchedulerService from '#services/scheduler_service'

export default class SchedulerProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('scheduler', () => new SchedulerService())
  }

  async boot() {}

  async start() {
    const scheduler = await this.app.container.make('scheduler')

    console.log('[App] Setting up scheduled tasks...')
    scheduler.setupDefaultTasks()
    scheduler.start()
    console.log('[App] Scheduler initialized and started')
  }

  async ready() {}

  async shutdown() {
    const scheduler = await this.app.container.make('scheduler')
    console.log('[App] Shutting down scheduler...')
    scheduler.stop()
    console.log('[App] Scheduler shutdown complete')
  }
}
