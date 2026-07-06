import { describe, expect, it } from 'vitest'
import { advanceTime, attr, one, testApplication, textInput } from 'ctrl-fx/testing'
import { type State, DELAY, initialState, view } from './app'

const app = testApplication<State>(view, initialState)

describe('initial render', () => {
  it('shows placeholder when nothing committed', () => {
    expect(app.findOne('p').childNodes[0]).toBe('Committed: —')
  })
})

describe('debounced commit', () => {
  it('commits after the delay elapses', () => {
    const after = app.run(textInput(one('input'), 'hello'), advanceTime(DELAY))
    expect(after.findOne('p').childNodes[0]).toBe('Committed: hello')
  })

  it('does not commit before the delay elapses', () => {
    const after = app.run(textInput(one('input'), 'hello'), advanceTime(DELAY - 1))
    expect(after.findOne('p').childNodes[0]).toBe('Committed: —')
  })

  it('draft updates immediately on every keystroke', () => {
    const after = app.run(textInput(one('input'), 'hello'), advanceTime(DELAY - 1))
    expect(after.findOne('input').attrs).toContainEqual(attr('value', 'hello'))
  })

  it('only commits the last value when typing quickly', () => {
    const after = app.run(
      textInput(one('input'), 'h'),
      textInput(one('input'), 'he'),
      textInput(one('input'), 'hello'),
      advanceTime(DELAY),
    )
    expect(after.findOne('p').childNodes[0]).toBe('Committed: hello')
  })
})
