import { makeDom } from 'ctrl-fx/dom'
import { makeEffects } from 'ctrl-fx/effects'

export type State = number

const { div_, p_, button } = makeDom<State, never>()
const { getRandom, updateState } = makeEffects<State, never>()

const rollDie = getRandom().map(n => Math.floor(n * 6) + 1)

const rollDieAndUpdateState = rollDie.flatMap(n => updateState(() => n))

export const view = (state: State) =>
  div_(
    p_(`Die value: ${state}`),
    button(['class', 'roll'])('Roll').onClick(rollDieAndUpdateState),
  )

export const initialState = rollDie
