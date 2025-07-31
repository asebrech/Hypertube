import cron from 'node-cron'
import { execSync } from 'node:child_process'

export interface ScheduledTask {
  name: string
  schedule: string
  command: string
  description?: string
  options?: cron.ScheduleOptions
}

export default class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map()
  private isStarted = false

  schedule(task: ScheduledTask): void {
    if (this.tasks.has(task.name)) {
      this.stop(task.name)
    }

    const scheduledTask = cron.schedule(
      task.schedule,
      () => {
        console.log(`[Scheduler] Running: ${task.name}`)
        try {
          execSync(task.command, { stdio: 'inherit' })
          console.log(`[Scheduler] Completed: ${task.name}`)
        } catch (error) {
          console.error(`[Scheduler] Failed: ${task.name}`, error)
        }
      },
      { scheduled: false, ...task.options }
    )

    this.tasks.set(task.name, scheduledTask)
    const timeDescription = task.description || this.getScheduleDescription(task.schedule)
    console.log(`[Scheduler] Scheduled "${task.name}" (${task.schedule}) → ${timeDescription}`)
    
    if (this.isStarted) {
      scheduledTask.start()
    }
  }

  start(): void {
    if (this.isStarted) return

    console.log(`[Scheduler] Starting ${this.tasks.size} scheduled tasks...`)
    this.tasks.forEach((task, name) => {
      task.start()
      console.log(`[Scheduler] → ${name}`)
    })
    this.isStarted = true
    console.log('[Scheduler] All tasks active')
  }

  stop(taskName?: string): void {
    if (taskName) {
      const task = this.tasks.get(taskName)
      if (task) {
        task.stop()
        this.tasks.delete(taskName)
      }
    } else {
      this.tasks.forEach((task) => task.stop())
      this.tasks.clear()
      this.isStarted = false
    }
  }

  hasTask(name: string): boolean {
    return this.tasks.has(name)
  }

  getTaskCount(): number {
    return this.tasks.size
  }

  private getScheduleDescription(schedule: string): string {
    const scheduleMap: Record<string, string> = {
      '0 2 * * *': 'Daily at 2:00 AM UTC',
      '0 1 * * 0': 'Sundays at 1:00 AM UTC',
      '0 0 * * *': 'Daily at midnight UTC',
      '0 12 * * *': 'Daily at noon UTC',
      '0 0 * * 1': 'Mondays at midnight UTC',
      '*/15 * * * *': 'Every 15 minutes',
      '0 */6 * * *': 'Every 6 hours',
    }

    return scheduleMap[schedule] || `Custom schedule: ${schedule}`
  }

  setupDefaultTasks(): void {
    this.schedule({
      name: 'movie-cleanup',
      schedule: '0 2 * * *',
      command: 'node ace movie:cleanup',
      description: 'Daily at 2:00 AM UTC',
      options: { timezone: 'UTC' },
    })
  }
}

