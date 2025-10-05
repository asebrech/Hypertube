import cron from 'node-cron'
import { spawn } from 'node:child_process'
import path from 'node:path'

export interface ScheduledTask {
  name: string
  schedule: string
  command: string
  description?: string
  options?: any
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
        this.executeCommand(task.command)
          .then(() => console.log(`[Scheduler] Completed: ${task.name}`))
          .catch(() => {})
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

  private async executeCommand(command: string): Promise<void> {
    const allowedCommands = [this.getMovieCleanupCommand(), this.getPasswordResetCleanupCommand()]
    if (!allowedCommands.includes(command)) {
      throw new Error(`Command not allowed: ${command}`)
    }

    const parts = command.split(' ')
    const executable = parts[0]
    const args = parts.slice(1)

    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, {
        stdio: 'inherit',
        cwd: process.cwd(),
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Command exited with code ${code}`))
        }
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  private getMovieCleanupCommand(): string {
    const nodeExe = process.execPath
    const aceScript = path.resolve(process.cwd(), 'ace')
    return `${nodeExe} ${aceScript} movie:cleanup`
  }

  private getPasswordResetCleanupCommand(): string {
    const nodeExe = process.execPath
    const aceScript = path.resolve(process.cwd(), 'ace')
    return `${nodeExe} ${aceScript} password-reset:cleanup`
  }

  setupDefaultTasks(): void {
    this.schedule({
      name: 'movie-cleanup',
      schedule: '0 2 * * *', // Daily at 2:00 AM UTC
      //schedule: '*/2 * * * *', // Every 2 minutes for testing
      command: this.getMovieCleanupCommand(),
      description: 'Daily at 2:00 AM UTC',
      options: { timezone: 'UTC' },
    })

    this.schedule({
      name: 'password-reset-cleanup',
      schedule: '0 */6 * * *', // Every 6 hours
      command: this.getPasswordResetCleanupCommand(),
      description: 'Every 6 hours',
      options: { timezone: 'UTC' },
    })
  }
}
