import type { TaskId } from '../effects'

export class TaskRegistry {
  private tasks: { [key: string]: () => void } = {}

  set(taskId: TaskId, cleanup: () => void): void {
    this.tasks[taskId] = cleanup
  }

  cancel(taskId: TaskId): void {
    const cleanup = this.tasks[taskId]
    if (cleanup) cleanup()
    delete this.tasks[taskId]
  }

  remove(taskId: TaskId): void {
    delete this.tasks[taskId]
  }

  cancelAll(): void {
    for (const cleanup of Object.values(this.tasks)) {
      cleanup()
    }
    this.tasks = {}
  }
}
