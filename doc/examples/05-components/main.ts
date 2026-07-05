import { manageApplication } from 'ctrl-fx'
import { component, makeDom, nodeId } from 'ctrl-fx/dom'
import { makeEffects } from 'ctrl-fx/effects'

// --- Child component ---

type CounterState = { count: number }
type CounterEvent = { count: number }
type CounterParams = { label: string }

const cDom = makeDom<CounterState, CounterEvent>()
const cFx = makeEffects<CounterState, CounterEvent>()

const counter = component<CounterState, CounterParams, CounterEvent>(
  (state, params) => {
    const inc = cFx.updateState(s => ({ count: s.count + 1 }))
      .flatMap(() => cFx.fireEvent({ count: state.count + 1 }))
    const dec = cFx.updateState(s => ({ count: Math.max(0, s.count - 1) }))
      .flatMap(() => cFx.fireEvent({ count: Math.max(0, state.count - 1) }))

    return cDom.div_(
      cDom.p_(`${params.label}: ${state.count}`),
      cDom.button_('+').onClick(inc),
      cDom.button_('−').onClick(dec),
    )
  },
  _params => ({ count: 0 }),
  { label: '' },
)

// --- Parent app ---

type AppState = { pages: number; breaks: number }

const { div_, h2_, p_, componentElem } = makeDom<AppState, never>()
const { updateState } = makeEffects<AppState, never>()

const view = (state: AppState) => {
  const efficiency =
    state.breaks === 0 ? '—' : (state.pages / state.breaks).toFixed(1)

  return div_(
    h2_('Reading Session'),
    componentElem(counter, nodeId('pages'), { label: 'Pages read' })
      .onEvent(e => updateState(s => ({ ...s, pages: e.count }))),
    componentElem(counter, nodeId('breaks'), { label: 'Breaks taken' })
      .onEvent(e => updateState(s => ({ ...s, breaks: e.count }))),
    p_(`Efficiency: ${efficiency} pages per break`),
  )
}

manageApplication(view, { pages: 0, breaks: 0 })
