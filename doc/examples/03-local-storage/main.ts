import { manageApplication } from 'ctrl-fx'
import { makeDom } from 'ctrl-fx/dom'
import { makeEffects } from 'ctrl-fx/effects'

// --- Types ---

type State = { text: string; savedText: string | null }

// --- DOM and effects ---

const { div_, p_, button_, textarea_, label_ } = makeDom<State, never>()
const { updateState, getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } =
  makeEffects<State, never>()

// --- Effects ---

const save = (text: string) =>
  setLocalStorageItem('note', text).and(
    updateState(() => ({ text: '', savedText: text })),
  )

const clear = removeLocalStorageItem('note').and(
  updateState(() => ({ text: '', savedText: null })),
)

// --- View ---

const view = (state: State) =>
  div_(
    label_('Note'),
    textarea_()
      .prop('value', state.text)
      .onTextInput(e => updateState(s => ({ ...s, text: e.value }))),
    div_(
      button_('Save').onClick(save(state.text)),
      button_('Clear').onClick(clear),
    ),
    label_('Saved value'),
    p_(state.savedText ?? '—'),
  )

// --- Mount ---

// Load any previously saved note from localStorage as the initial state.
const initialState = getLocalStorageItem('note').map(saved => ({
  text: '',
  savedText: saved,
}))

manageApplication(view, initialState)
