import { makeDom } from 'ctrl-fx/dom'
import { makeEffects } from 'ctrl-fx/effects'

export type State = { rating: number }

const { div_, p_, element } = makeDom<State, never>()
const { updateState } = makeEffects<State, never>()

export const view = (state: State) =>
  div_(
    element('rating-stars')()()
      .prop('value', state.rating)
      .onEvent('rating-change', detail => {
        const { value } = detail as { value: number }
        return updateState(() => ({ rating: value }))
      }),
    p_(`Rating: ${state.rating === 0 ? '—' : `${state.rating} / 5`}`),
  )

export const initialState: State = { rating: 0 }
