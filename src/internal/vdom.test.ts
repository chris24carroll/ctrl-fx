import { describe, expect, it } from 'vitest'
import { makeDom } from '../dom'
import { makeEffects } from '../effects'
import { click, one, testApplication } from '../testing'

type State = { hasClass: boolean }

const dom = makeDom<State, never>()
const fx = makeEffects<State, never>()
const { div, button_ } = dom

describe('updateAttrs', () => {
  it('adds an attribute on re-render that was absent from the initial render', () => {
    // Regression test: updateAttrs used to only walk the OLD attrs list, so
    // it could update or remove an existing attribute name but had no path
    // to add a brand-new one that wasn't present at the element's initial
    // render. An attribute that first appears on a later render (e.g. a
    // conditional `class`) was silently dropped.
    const app = (state: State) =>
      div(...(state.hasClass ? ([['class', 'on']] as const) : []))(
        button_('toggle').onClick(fx.updateState(s => ({ hasClass: !s.hasClass }))),
      )

    const tc = testApplication(app, { hasClass: false })
    expect(tc.findOne('div').attrs).toEqual([])

    const after = tc.run(click(one('button')))
    expect(after.findOne('div').attrs).toEqual([{ name: 'class', value: 'on' }])
  })

  it('removes an attribute on re-render that is no longer present', () => {
    const app = (state: State) =>
      div(...(state.hasClass ? ([['class', 'on']] as const) : []))(
        button_('toggle').onClick(fx.updateState(s => ({ hasClass: !s.hasClass }))),
      )

    const tc = testApplication(app, { hasClass: true })
    expect(tc.findOne('div').attrs).toEqual([{ name: 'class', value: 'on' }])

    const after = tc.run(click(one('button')))
    expect(after.findOne('div').attrs).toEqual([])
  })
})
