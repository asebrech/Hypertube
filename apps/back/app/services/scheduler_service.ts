import cron from 'node-cron'
import { execSync } from 'node:child_process'

export interface ScheduledTask {
  name: string
  schedule: string
  command: string
  options?: cron.ScheduleOptions
}

export default class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map()
  private isStarted = false

  /**
   * Schedule a new task
   */
  schedule(task: ScheduledTask): void {
    if (this.tasks.has(task.name)) {
      console.warn(`Task "${task.name}" already exists. Stopping existing task.`)
      this.stop(task.name)
    }

    const scheduledTask = cron.schedule(
      task.schedule,
      () => {
        console.log(`[Scheduler] Running scheduled task: ${task.name}`)
        try {
          execSync(task.command, { stdio: 'inherit' })
          console.log(`[Scheduler] Task "${task.name}" completed successfully`)
        } catch (error) {
          console.error(`[Scheduler] Task "${task.name}" failed:`, error)
        }
      },
      {
        scheduled: false,
        ...task.options,
      }
    )

    this.tasks.set(task.name, scheduledTask)
    console.log(`[Scheduler] Scheduled task "${task.name}" with cron pattern: ${task.schedule}`)

    // Start the task if the scheduler is already started
    if (this.isStarted) {
      scheduledTask.start()
    }
  }

  /**
   * Start all scheduled tasks
   */
  start(): void {
    if (this.isStarted) {
      console.warn('[Scheduler] Already started')
      return
    }

    console.log('[Scheduler] Starting all scheduled tasks...')
    this.tasks.forEach((task, name) => {
      task.start()
      console.log(`[Scheduler] Started task: ${name}`)
    })
    this.isStarted = true
    console.log(`[Scheduler] Started ${this.tasks.size} scheduled tasks`)
  }

  /**
   * Stop all scheduled tasks
   */
  stop(taskName?: string): void {
    if (taskName) {
      const task = this.tasks.get(taskName)
      if (task) {
        task.stop()
        this.tasks.delete(taskName)
        console.log(`[Scheduler] Stopped task: ${taskName}`)
      } else {
        console.warn(`[Scheduler] Task "${taskName}" not found`)
      }
    } else {
      console.log('[Scheduler] Stopping all scheduled tasks...')
      this.tasks.forEach((task, name) => {
        task.stop()
        console.log(`[Scheduler] Stopped task: ${name}`)
      })
      this.tasks.clear()
      this.isStarted = false
      console.log('[Scheduler] All scheduled tasks stopped')
    }
  }

  /**
   * Get information about all scheduled tasks
   */
  getTaskInfo(): Array<{ name: string; isRunning: boolean }> {
    return Array.from(this.tasks.entries()).map(([name, task]) => ({
      name,
      isRunning: task.getStatus() === 'scheduled',
    }))
  }

  /**
   * Check if a task exists
   */
  hasTask(name: string): boolean {
    return this.tasks.has(name)
  }

  /**
   * Get the number of scheduled tasks
   */
  getTaskCount(): number {
    return this.tasks.size
  }

  /**
   * Setup default scheduled tasks for the application
   */
  setupDefaultTasks(): void {
    // Daily movie cleanup at 2 AM
    this.schedule({
      name: 'movie-cleanup',
      schedule: '0 2 * * *', // Every day at 2:00 AM
      command: 'node ace movie:cleanup 30',
      options: {
        timezone: 'UTC',
      },
    })

    // Weekly dry-run cleanup for monitoring (every Sunday at 1 AM)
    this.schedule({
      name: 'movie-cleanup-dry-run',
      schedule: '0 1 * * 0', // Every Sunday at 1:00 AM
      command: 'node ace movie:cleanup 30 --dry-run',
      options: {
        timezone: 'UTC',
      },
    })
  }
}

