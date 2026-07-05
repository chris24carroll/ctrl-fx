import type { Effect } from '../effects'
import type { TaskRegistry } from './taskreg'

export type Callbacks<State, Event, A> = {
  onComplete: (a: A) => void
  onFireEvent: (event: Event) => void
  getState: () => State
  setState: (state: State) => void
}

export type Interpreter = <State, Event, A>(
  effect: Effect<State, Event, A>,
  callbacks: Callbacks<State, Event, A>,
  taskRegistry: TaskRegistry,
) => void
