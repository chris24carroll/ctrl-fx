import { manageApplication } from 'ctrl-fx'
import { makeDom } from 'ctrl-fx/dom'
import { makeEffects, openDatabase, runDbTransaction } from 'ctrl-fx/effects'
import type { DbEffect } from 'ctrl-fx/db'
import {
  add,
  autoIncrementPath,
  createObjectStore,
  dbName,
  dbVersion,
  dbNoop,
  deleteRecord,
  getAll,
  objectStore,
  put,
} from 'ctrl-fx/db'

// --- DB schema ---

// The database and store are branded strings, not raw strings, so the type
// system prevents passing them in the wrong order.
const DB = dbName('ctrl-fx-todos')
const VERSION = dbVersion(1)
const TODOS = objectStore('todos')

// --- Types ---

type TodoItem = {
  id: number
  text: string
  done: boolean
}

type State = {
  todos: TodoItem[]
  input: string
}

// --- DOM and effects ---

const { div, div_, ul_, li_, button_, span, input } = makeDom<State, never>()
const { updateState, noop } = makeEffects<State, never>()

// --- DB helpers ---

// Thin wrapper so callers don't repeat the DB name and store list
function tx(mode: 'readonly' | 'readwrite', effect: DbEffect<void>) {
  return runDbTransaction<State, never>(DB, [TODOS], mode, effect)
}

// Reads all rows from the todos store and returns them as typed items.
// Uses a captured variable to flow the result out of the DbEffect chain,
// since DbEffect operations must eventually resolve to void.
function fetchTodos() {
  let items: TodoItem[] = []
  return tx(
    'readonly',
    getAll(TODOS).flatMap(rows => {
      items = rows as unknown as TodoItem[]
      return dbNoop()
    }),
  ).map(() => items)
}

// --- Effects ---

function addTodo(text: string) {
  return tx('readwrite', add(TODOS, { text, done: false }))
    .flatMap(() => fetchTodos())
    .flatMap(todos => updateState(s => ({ ...s, todos, input: '' })))
}

function toggleDone(item: TodoItem) {
  return tx('readwrite', put(TODOS, { ...item, done: !item.done }))
    .flatMap(() => fetchTodos())
    .flatMap(todos => updateState(s => ({ ...s, todos })))
}

function removeTodo(id: number) {
  return tx('readwrite', deleteRecord(TODOS, id))
    .flatMap(() => fetchTodos())
    .flatMap(todos => updateState(s => ({ ...s, todos })))
}

// --- Views ---

function todoView(item: TodoItem) {
  return li_(
    button_(item.done ? '☑' : '☐').onClick(toggleDone(item)),
    span([
      'style',
      item.done
        ? 'text-decoration: line-through; opacity: 0.5; cursor: pointer'
        : 'cursor: pointer',
    ])(item.text).onClick(toggleDone(item)),
    button_('✕').onClick(removeTodo(item.id)),
  )
}

const application = (state: State) => {
  const text = state.input.trim()
  const addCurrent = text ? addTodo(text) : noop()

  return div_(
    div(['style', 'display: flex; gap: 0.75rem; margin-bottom: 1.25rem'])(
      input(['type', 'text'], ['placeholder', 'New todo...'])
        .prop('value', state.input)
        .onTextInput(ts => updateState(s => ({ ...s, input: ts.value })))
        .onKeyDown(k => (k.key === 'Enter' ? addCurrent : noop())),
      button_('Add').onClick(addCurrent),
    ),
    ul_(...state.todos.map(todoView)),
  )
}

// --- Mount ---

// Open the database (creating the todos store on first run), then load any
// existing todos to produce the initial state.
const initialState = openDatabase<State, never>(DB, VERSION, _v =>
  createObjectStore(TODOS, autoIncrementPath('id')),
)
  .flatMap(() => fetchTodos())
  .map(todos => ({ todos, input: '' }))

manageApplication(application, initialState)
