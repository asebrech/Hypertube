import type { ApplicationService } from '@adonisjs/core/types'
import SchedulerService from '#services/scheduler_service'

export default class SchedulerProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton('scheduler', () => {
      return new SchedulerService()
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    // Nothing to do
  }

  /**
   * The application has been booted
   */
  async start() {
    const scheduler = await this.app.container.make('scheduler')
    
    console.log('[App] Setting up scheduled tasks...')
    
    // Setup default scheduled tasks
    scheduler.setupDefaultTasks()
    
    // Start the scheduler
    scheduler.start()
    
    console.log('[App] Scheduler initialized and started')
  }

  /**
   * The process has been started
   */
  async ready() {
    // Nothing to do
  }

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {
    const scheduler = await this.app.container.make('scheduler')
    console.log('[App] Shutting down scheduler...')
    scheduler.stop()
    console.log('[App] Scheduler shutdown complete')
  }
}

