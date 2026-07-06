import { describe, expect, it } from 'vitest'
import {
  attr,
  newTestData,
  one,
  testApplication,
  textInput,
} from 'ctrl-fx/testing'
import { type SlugData, type State, initialState, view } from './app'

// Scripted slugs let tests verify UI behaviour without depending on what
// the slugify library actually does — swap libraries and tests stay green.
const withSlugs = (...slugs: string[]) =>
  testApplication<State, SlugData>(
    view,
    initialState,
    undefined,
    newTestData<SlugData>(slugs),
  )

describe('initial render', () => {
  it('shows a blank slug placeholder', () => {
    expect(withSlugs().findOne('code').childNodes[0]).toBe('—')
  })
})

describe('typing a title', () => {
  it('shows the slug returned by the library', () => {
    const after = withSlugs('hello-world').run(
      textInput(one('input'), 'Hello World'),
    )
    expect(after.findOne('code').childNodes[0]).toBe('hello-world')
  })

  it('updates the input value in state', () => {
    const after = withSlugs('my-post').run(textInput(one('input'), 'My Post'))
    expect(after.findOne('input').attrs).toContainEqual(
      attr('value', 'My Post'),
    )
  })

  it('each keystroke consumes the next scripted slug', () => {
    const after = withSlugs('hello', 'hello-world')
      .run(textInput(one('input'), 'Hello'))
      .run(textInput(one('input'), 'Hello World'))
    expect(after.findOne('code').childNodes[0]).toBe('hello-world')
  })
})
