import { describe, expect, it } from 'vitest'
import { click, defaultTestConfig, one, testApplication } from 'ctrl-fx/testing'
import { initialState, view } from './app'

const app = testApplication(view, initialState, {
  ...defaultTestConfig(),
  random: { values: [3 / 6] },
})

describe('initial render', () => {
  it('shows the scripted die face', () => {
    expect(app.findOne('p').childNodes[0]).toBe('Die value: 4')
  })

  it('renders the roll button', () => {
    expect(app.find('button')).toHaveLength(1)
  })
})

describe('built-in random effect', () => {
  it('roll updates the die value', () => {
    // First scripted value (3/6) consumed by initial state; second (5/6) consumed by roll
    const after = testApplication(view, initialState, {
      ...defaultTestConfig(),
      random: { values: [3 / 6, 5 / 6] },
    }).run(click(one('.roll')))
    expect(after.state).toBe(6)
    expect(after.findOne('p').childNodes[0]).toBe('Die value: 6')
  })
})
