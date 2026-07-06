import { describe, expect, it } from 'vitest'
import { click, one, testComponent } from 'ctrl-fx/testing'
import { counter } from './component'

// The component is fully testable before it's ever registered as a web component.
const app = testComponent(counter)

describe('initial render', () => {
  it('starts at zero', () => {
    expect(app.findOne('p').childNodes[0]).toBe('0')
  })
})

describe('interactions', () => {
  it('+ increments the count', () => {
    const after = app.run(click(one('.inc')))
    expect(after.findOne('p').childNodes[0]).toBe('1')
  })

  it('− decrements but not below zero', () => {
    const after = app.run(click(one('.dec')))
    expect(after.findOne('p').childNodes[0]).toBe('0')
  })

  it('increments accumulate', () => {
    const after = app
      .run(click(one('.inc')))
      .run(click(one('.inc')))
      .run(click(one('.inc')))
    expect(after.findOne('p').childNodes[0]).toBe('3')
  })
})
