import { makeDom } from 'ctrl-fx/dom'
import { makeEffects, taskId } from 'ctrl-fx/effects'

export type State = { draft: string; committed: string }

const { div_, label_, input, p_ } = makeDom<State, never>()
const { scheduleTask, updateState } = makeEffects<State, never>()

// Stable id means calling scheduleTask again cancels the pending task and
// reschedules — giving us debounce behaviour without any extra logic.
const DEBOUNCE_ID = taskId('commit')
export const DELAY = 400

const onInput = (draft: string) =>
  updateState(s => ({ ...s, draft })).and(
    scheduleTask(
      updateState(s => ({ ...s, committed: s.draft })),
      DELAY,
      undefined,
      DEBOUNCE_ID,
    ).void(),
  )

export const view = (state: State) =>
  div_(
    label_('Search'),
    input(['type', 'text'], ['value', state.draft])
      .onTextInput(({ value }) => onInput(value)),
    p_(`Committed: ${state.committed || '—'}`),
  )

export const initialState: State = { draft: '', committed: '' }
