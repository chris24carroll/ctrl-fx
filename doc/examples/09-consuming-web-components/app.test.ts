import { describe, expect, it } from 'vitest'
import { fireCustomEvent, one, testApplication } from 'ctrl-fx/testing'
import { type State, initialState, view } from './app'

// fireCustomEvent simulates the custom event a web component would dispatch.
// The test never touches the component's real DOM — only the event contract matters.
const app = testApplication<State>(view, initialState)

describe('initial render', () => {
  it('shows no rating', () => {
    expect(app.findOne('p').childNodes[0]).toBe('Rating: —')
  })
})

describe('receiving events from the web component', () => {
  it('updates state when rating-change fires', () => {
    const after = app.run(
      fireCustomEvent(one('rating-stars'), 'rating-change', { value: 4 }),
    )
    expect(after.findOne('p').childNodes[0]).toBe('Rating: 4 / 5')
  })

  it('the last event wins when fired in sequence', () => {
    const after = app
      .run(fireCustomEvent(one('rating-stars'), 'rating-change', { value: 3 }))
      .run(fireCustomEvent(one('rating-stars'), 'rating-change', { value: 5 }))
    expect(after.findOne('p').childNodes[0]).toBe('Rating: 5 / 5')
  })
})
