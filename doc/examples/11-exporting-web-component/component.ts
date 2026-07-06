import { component, makeDom } from 'ctrl-fx/dom'
import { makeEffects } from 'ctrl-fx/effects'

export type CounterState = { count: number }
export type CounterEvent = { count: number }

const { div_, p_, button } = makeDom<CounterState, CounterEvent>()
const { updateState, fireEvent } = makeEffects<CounterState, CounterEvent>()

export const counter = component<CounterState, CounterEvent>(
  state => {
    const decrement = updateState(s => ({ count: Math.max(0, s.count - 1) }))
      .flatMap(() => fireEvent({ count: Math.max(0, state.count - 1) }))
    const increment = updateState(s => ({ count: s.count + 1 }))
      .flatMap(() => fireEvent({ count: state.count + 1 }))

    return div_(
      button(['class', 'dec'])('−').onClick(decrement),
      p_(`${state.count}`),
      button(['class', 'inc'])('+').onClick(increment),
    )
  },
  { count: 0 },
)
