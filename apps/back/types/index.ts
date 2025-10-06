import SchedulerService from '#services/scheduler_service'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    scheduler: SchedulerService
  }
}
