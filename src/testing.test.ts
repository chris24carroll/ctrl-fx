import { describe, expect, it } from 'vitest'
import { makeDom } from './dom'
import { getState, log, updateState } from './effects'
import {
  click,
  fireCustomEvent,
  newTestData,
  one,
  submit,
  testApplication,
} from './testing'

type ToggleState = { visible: boolean }

const toggleDom = makeDom<ToggleState, never>()

const toggleView = (state: ToggleState) =>
  toggleDom.div()(
    toggleDom
      .button()('Toggle')
      .onClick(updateState<ToggleState, never>(s => ({ visible: !s.visible }))),
    ...(state.visible ? [toggleDom.p()('Content')] : []),
  )

describe('testApplication — initial render', () => {
  it('renders a button', () => {
    const tc = testApplication(toggleView, { visible: false })
    expect(tc.find('button')).toHaveLength(1)
  })

  it('does not render paragraph when visible is false', () => {
    const tc = testApplication(toggleView, { visible: false })
    expect(tc.find('p')).toHaveLength(0)
  })

  it('renders paragraph when visible is true', () => {
    const tc = testApplication(toggleView, { visible: true })
    expect(tc.find('p')).toHaveLength(1)
  })
})

describe('testApplication — interactions', () => {
  it('clicking the button shows the paragraph', () => {
    const tc = testApplication(toggleView, { visible: false })
    const after = tc.run(click(one('button')))
    expect(after.find('p')).toHaveLength(1)
  })

  it('clicking twice restores initial state', () => {
    const tc = testApplication(toggleView, { visible: false })
    const after = tc.run(click(one('button')), click(one('button')))
    expect(after.find('p')).toHaveLength(0)
  })

  it('multiple run calls chain state', () => {
    const tc = testApplication(toggleView, { visible: false })
    const after = tc.run(click(one('button'))).run(click(one('button')))
    expect(after.find('p')).toHaveLength(0)
  })
})

describe('testApplication — findOne / findMaybeOne / findOneOrMore', () => {
  it('findOne returns the single element', () => {
    const tc = testApplication(toggleView, { visible: false })
    const btn = tc.findOne('button')
    expect(btn.tag.toLowerCase()).toBe('button')
  })

  it('findOne throws when element is absent', () => {
    const tc = testApplication(toggleView, { visible: false })
    expect(() => tc.findOne('p')).toThrow()
  })

  it('findMaybeOne returns undefined when absent', () => {
    const tc = testApplication(toggleView, { visible: false })
    expect(tc.findMaybeOne('p')).toBeUndefined()
  })

  it('findMaybeOne returns element when present', () => {
    const tc = testApplication(toggleView, { visible: true })
    const p = tc.findMaybeOne('p')
    expect(p).toBeDefined()
    expect(p?.tag.toLowerCase()).toBe('p')
  })

  it('findOneOrMore returns array when element exists', () => {
    const tc = testApplication(toggleView, { visible: false })
    const results = tc.findOneOrMore('button')
    expect(results).toHaveLength(1)
  })

  it('findOneOrMore throws when absent', () => {
    const tc = testApplication(toggleView, { visible: false })
    expect(() => tc.findOneOrMore('p')).toThrow()
  })
})

type LogState = { count: number }
const logDom = makeDom<LogState, never>()

const logView = (state: LogState) =>
  logDom
    .button()(`Count: ${state.count}`)
    .onClick(
      log<LogState, never>('click').and(
        updateState<LogState, never>(s => ({ count: s.count + 1 })),
      ),
    )

describe('testApplication — data tracking', () => {
  it('records log calls in data.console.logs', () => {
    const tc = testApplication(logView, { count: 0 })
    const after = tc.run(click(one('button')))
    expect(after.data.console.logs).toContain('click')
  })

  it('records two log calls after two clicks', () => {
    const tc = testApplication(logView, { count: 0 })
    const after = tc.run(click(one('button')), click(one('button')))
    expect(after.data.console.logs).toHaveLength(2)
  })
})

describe('testApplication — withData', () => {
  it('allows injecting pre-filled test data', () => {
    const data = newTestData()
    const tc = testApplication(toggleView, { visible: false }).withData(data)
    expect(tc.data.console.logs).toHaveLength(0)
  })
})

describe('onEvent / fireCustomEvent', () => {
  type PickerState = { selected: string }
  const dom = makeDom<PickerState, never>()

  const pickerView = (state: PickerState) =>
    dom.div()(
      dom
        .div(['class', 'picker'])()
        .onEvent('sl-change', detail => {
          const { value } = detail as { value: string }
          return updateState<PickerState, never>(() => ({ selected: value }))
        }),
      dom.p()(state.selected),
    )

  it('fires the handler when the named event is dispatched', () => {
    const tc = testApplication(pickerView, { selected: '' })
    const after = tc.run(
      fireCustomEvent(one('.picker'), 'sl-change', { value: 'hello' }),
    )
    const text = after.findOne('p').childNodes[0]
    expect(text).toBe('hello')
  })

  it('passes detail payload to the handler', () => {
    const tc = testApplication(pickerView, { selected: '' })
    const after = tc.run(
      fireCustomEvent(one('.picker'), 'sl-change', { value: 'world' }),
    )
    const text = after.findOne('p').childNodes[0]
    expect(text).toBe('world')
  })

  it('does not fire handler for a different event name', () => {
    const tc = testApplication(pickerView, { selected: 'initial' })
    const after = tc.run(
      fireCustomEvent(one('.picker'), 'other-event', { value: 'changed' }),
    )
    const text = after.findOne('p').childNodes[0]
    expect(text).toBe('initial')
  })

  it('fires multiple times and each update applies', () => {
    const tc = testApplication(pickerView, { selected: '' })
    const after = tc
      .run(fireCustomEvent(one('.picker'), 'sl-change', { value: 'first' }))
      .run(fireCustomEvent(one('.picker'), 'sl-change', { value: 'second' }))
    const text = after.findOne('p').childNodes[0]
    expect(text).toBe('second')
  })

  it('handles undefined detail', () => {
    type NullState = { fired: boolean }
    const nullDom = makeDom<NullState, never>()
    const nullView = (_state: NullState) =>
      nullDom.div(['class', 'target'])().onEvent('ping', (_detail: unknown) =>
        updateState<NullState, never>(() => ({ fired: true })),
      )
    const tc = testApplication(nullView, { fired: false })
    const after = tc.run(fireCustomEvent(one('.target'), 'ping'))
    expect(after.data).toBeDefined()
  })

  it('independent event names on same element fire separately', () => {
    type TwoState = { a: boolean; b: boolean }
    const twoDom = makeDom<TwoState, never>()
    const twoView = (state: TwoState) =>
      twoDom.div()(
        twoDom
          .div(['class', 'src'])()
          .onEvent('event-a', (_: unknown) =>
            updateState<TwoState, never>(s => ({ ...s, a: true })),
          )
          .onEvent('event-b', (_: unknown) =>
            updateState<TwoState, never>(s => ({ ...s, b: true })),
          ),
        ...(state.a ? [twoDom.span(['class', 'a'])()] : []),
        ...(state.b ? [twoDom.span(['class', 'b'])()] : []),
      )

    const tc = testApplication(twoView, { a: false, b: false })
    const afterA = tc.run(fireCustomEvent(one('.src'), 'event-a', null))
    expect(afterA.find('.a')).toHaveLength(1)
    expect(afterA.find('.b')).toHaveLength(0)
  })

  it('two onEvent handlers for same name on same element both fire', () => {
    type TwoHandlerState = { count: number }
    const twoHandlerDom = makeDom<TwoHandlerState, never>()
    const twoHandlerView = (state: TwoHandlerState) =>
      twoHandlerDom.div()(
        twoHandlerDom
          .div(['class', 'src'])()
          .onEvent('tick', (_: unknown) =>
            updateState<TwoHandlerState, never>(s => ({ count: s.count + 1 })),
          )
          .onEvent('tick', (_: unknown) =>
            updateState<TwoHandlerState, never>(s => ({ count: s.count + 1 })),
          ),
        twoHandlerDom.p()(`${state.count}`),
      )

    const tc = testApplication(twoHandlerView, { count: 0 })
    const after = tc.run(fireCustomEvent(one('.src'), 'tick', null))
    const text = after.findOne('p').childNodes[0]
    expect(text).toBe('2')
  })
})

describe('onSubmit / submit interaction', () => {
  type FormState = { submitted: boolean; value: string }
  const dom = makeDom<FormState, never>()

  const formView = (state: FormState) =>
    dom.form()(
      dom.input().onTextInput(t =>
        updateState<FormState, never>(s => ({ ...s, value: t.value })),
      ),
      dom.button()('Submit'),
      ...(state.submitted ? [dom.p()('done')] : []),
    )

  it('onSubmit fires and updates state', () => {
    const view = (_state: FormState) =>
      dom
        .form()()
        .onSubmit(updateState<FormState, never>(() => ({ submitted: true, value: '' })))
    const tc = testApplication(view, { submitted: false, value: '' })
    const after = tc.run(submit(one('form')))
    expect(after.find('p')).toHaveLength(0)
    const after2 = testApplication(
      (state: FormState) =>
        dom.div()(
          dom
            .form()()
            .onSubmit(
              updateState<FormState, never>(() => ({ submitted: true, value: '' })),
            ),
          ...(state.submitted ? [dom.p()('done')] : []),
        ),
      { submitted: false, value: '' },
    ).run(submit(one('form')))
    expect(after2.find('p')).toHaveLength(1)
  })

  it('submit without onSubmit handler does nothing', () => {
    const view = (_state: FormState) => dom.form()()
    const tc = testApplication(view, { submitted: false, value: '' })
    const after = tc.run(submit(one('form')))
    expect(after.find('p')).toHaveLength(0)
  })
})

describe('testApplication — getState effect', () => {
  type CountState = { n: number }
  const countDom = makeDom<CountState, never>()

  const countView = (state: CountState) =>
    countDom
      .button()(`n=${state.n}`)
      .onClick(
        getState<CountState, never>().flatMap(s =>
          updateState<CountState, never>(_ => ({ n: s.n + 10 })),
        ),
      )

  it('getState reads current state to drive update', () => {
    const tc = testApplication(countView, { n: 5 })
    const after = tc.run(click(one('button')))
    const btn = after.findOne('button')
    const text = btn.childNodes.find(c => typeof c === 'string') as
      | string
      | undefined
    expect(text).toBe('n=15')
  })
})
