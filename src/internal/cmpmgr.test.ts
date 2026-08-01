import { describe, expect, it } from 'vitest'
import { component, makeDom, nodeId } from '../dom'
import { fixedView, view } from '../dom/views'
import { makeEffects } from '../effects'
import { click, one, testApplication } from '../testing'

type State = { mountCount: number; clicks: number; showChild: boolean }

const dom = makeDom<State, never>()
const fx = makeEffects<State, never>()
const { _, div, div_, section_, button_ } = dom

describe('onRender', () => {
  it('runs once at initial mount', () => {
    const app = (state: State) =>
      _(div_(`clicks: ${state.clicks}`)).onRender(
        fx.updateState(s => ({ ...s, mountCount: s.mountCount + 1 })),
      )

    const tc = testApplication(app, { mountCount: 0, clicks: 0, showChild: false })
    expect(tc.state.mountCount).toBe(1)
  })

  it('does not re-run on a subsequent re-render of the same component', () => {
    // Note: testApplication's .run() mounts a fresh ComponentManager from the
    // current state each call, but ComponentManager is told which component
    // paths were already mounted by a prior .run(), so onRender doesn't fire
    // again for them -- the point of this test is that neither the fresh
    // remount nor the two clicks' re-renders add extra mounts.
    const app = (state: State) =>
      _(
        div_(`clicks: ${state.clicks}`),
        button_('bump').onClick(fx.updateState(s => ({ ...s, clicks: s.clicks + 1 }))),
      ).onRender(fx.updateState(s => ({ ...s, mountCount: s.mountCount + 1 })))

    const tc = testApplication(app, { mountCount: 0, clicks: 0, showChild: false })
    expect(tc.state.mountCount).toBe(1)

    const after = tc.run(click(one('button')), click(one('button')))
    expect(after.state.clicks).toBe(2)
    expect(after.state.mountCount).toBe(1)
  })

  it('runs when a memoized view() subtree mounts, exactly once even if params are recomputed', () => {
    const childView = view<State, unknown, never>('child', () =>
      _(div_('child')).onRender(fx.updateState(s => ({ ...s, mountCount: s.mountCount + 1 }))),
    )

    const app = (state: State) =>
      _(
        div_(`clicks: ${state.clicks}`),
        childView(undefined),
        button_('bump').onClick(fx.updateState(s => ({ ...s, clicks: s.clicks + 1 }))),
      )

    const tc = testApplication(app, { mountCount: 0, clicks: 0, showChild: false })
    expect(tc.state.mountCount).toBe(1)

    const after = tc.run(click(one('button')), click(one('button')))
    expect(after.state.clicks).toBe(2)
    expect(after.state.mountCount).toBe(1)
  })

  it('runs when a view() subtree newly appears after being conditionally absent', () => {
    const childView = view<State, unknown, never>('child', () =>
      _(div_('child')).onRender(fx.updateState(s => ({ ...s, mountCount: s.mountCount + 1 }))),
    )

    const app = (state: State) =>
      _(
        button_('toggle').onClick(fx.updateState(s => ({ ...s, showChild: !s.showChild }))),
        ...(state.showChild ? [childView(undefined)] : []),
      )

    const tc = testApplication(app, { mountCount: 0, clicks: 0, showChild: false })
    expect(tc.state.mountCount).toBe(0)

    const after = tc.run(click(one('button')))
    expect(after.state.showChild).toBe(true)
    expect(after.state.mountCount).toBe(1)
  })

  it('runs for a fixedView() subtree on mount', () => {
    const fixed = fixedView<State, never>('fixed')(
      _(div_('fixed')).onRender(fx.updateState(s => ({ ...s, mountCount: s.mountCount + 1 }))),
    )

    const app = (state: State) => _(div_(`clicks: ${state.clicks}`), fixed)

    const tc = testApplication(app, { mountCount: 0, clicks: 0, showChild: false })
    expect(tc.state.mountCount).toBe(1)
  })
})

describe('element reuse across renders', () => {
  it('attaches listeners when a reused element goes from no listeners to some', () => {
    // Regression test: compareNodes reuses a same-tag element in place, but
    // onNonVoidElement only refreshed listeners when the OLD node already had
    // some -- an element gaining its first listener on a re-render (here the
    // second div, once showChild flips) stayed listener-less forever.
    const app = (state: State) =>
      _(
        button_('toggle').onClick(fx.updateState(s => ({ ...s, showChild: true }))),
        state.showChild
          ? div(['class', 'armed'])('target').onClick(fx.updateState(s => ({ ...s, clicks: s.clicks + 1 })))
          : div_('target'),
      )

    const tc = testApplication(app, { mountCount: 0, clicks: 0, showChild: false })
    const after = tc.run(click(one('button')), click(one('div.armed')))
    expect(after.state.showChild).toBe(true)
    expect(after.state.clicks).toBe(1)
  })
})

describe('view() identity tracking', () => {
  it('does not re-fire onRender when a wrapping element changes shape', () => {
    // Regression test for the registry fast-path itself: a plain sibling
    // reorder already found a moved view via the sibling walk before this
    // fix, so it wouldn't exercise the new code. This does, because the
    // wrapping element's tag change forces convertNodeToInternalNode to
    // recurse into the view directly, bypassing the sibling walk entirely --
    // previously that meant "not found", so it was removed and recreated.
    const childView = view<State, unknown, never>('child', () =>
      _(div_('child')).onRender(fx.updateState(s => ({ ...s, mountCount: s.mountCount + 1 }))),
    )

    const app = (state: State) =>
      _(
        state.showChild ? section_(childView(undefined)) : div_(childView(undefined)),
        button_('toggle').onClick(fx.updateState(s => ({ ...s, showChild: !s.showChild }))),
      )

    const tc = testApplication(app, { mountCount: 0, clicks: 0, showChild: false })
    expect(tc.state.mountCount).toBe(1)

    const after = tc.run(click(one('button')))
    expect(after.state.showChild).toBe(true)
    expect(after.state.mountCount).toBe(1)
  })

  it('does not re-fire onRender for a view that just changed position', () => {
    type AppState2 = { order: string[]; mountCounts: Record<string, number> }
    const dom2 = makeDom<AppState2, never>()
    const fx2 = makeEffects<AppState2, never>()
    const { div_: div2_, button_: button2_ } = dom2

    const childView = (id: string) =>
      view<AppState2, unknown, never>(id, () =>
        dom2._(div2_(`child:${id}`)).onRender(
          fx2.updateState(s => ({
            ...s,
            mountCounts: { ...s.mountCounts, [id]: (s.mountCounts[id] ?? 0) + 1 },
          })),
        ),
      )

    const app = (state: AppState2) =>
      div2_(
        button2_('reorder').onClick(fx2.updateState(s => ({ ...s, order: [...s.order].reverse() }))),
        ...state.order.map(id => childView(id)(undefined)),
      )

    const tc = testApplication<AppState2>(app, { order: ['a', 'b'], mountCounts: {} })
    expect(tc.state.mountCounts).toEqual({ a: 1, b: 1 })

    const after = tc.run(click(one('button')))
    expect(after.state.order).toEqual(['b', 'a'])
    expect(after.state.mountCounts).toEqual({ a: 1, b: 1 })
  })
})

describe('reordering a component with stable identity', () => {
  type ChildState = { id: string }
  type ChildEvent = { id: string }

  const cDom = makeDom<ChildState, ChildEvent>()
  const cFx = makeEffects<ChildState, ChildEvent>()

  const child = component<ChildState, { id: string }, ChildEvent>(
    state => cDom._(cDom.div_(`child:${state.id}`)).onRender(cFx.fireEvent({ id: state.id })),
    params => ({ id: params.id }),
    { id: '' },
  )

  type AppState = { order: string[]; mountCounts: Record<string, number> }

  const { div_, button_, componentElem } = makeDom<AppState, never>()
  const { updateState } = makeEffects<AppState, never>()

  const app = (state: AppState) =>
    div_(
      button_('reorder').onClick(updateState(s => ({ ...s, order: [...s.order].reverse() }))),
      ...state.order.map(id =>
        componentElem(child, nodeId(id), { id }).onEvent(e =>
          updateState(s => ({
            ...s,
            mountCounts: { ...s.mountCounts, [e.id]: (s.mountCounts[e.id] ?? 0) + 1 },
          })),
        ),
      ),
    )

  it('does not re-fire onRender for siblings that just changed position', () => {
    const tc = testApplication<AppState>(app, { order: ['a', 'b'], mountCounts: {} })
    expect(tc.state.mountCounts).toEqual({ a: 1, b: 1 })

    // Regression test: reordering used to corrupt the test DOM's sibling
    // linked list (a node moved earlier left a stale pointer at its old
    // position, forming a 2-node cycle), which hung/OOM'd on the next DOM
    // walk rather than failing an assertion. See Node.insertBefore/insertAfter
    // in testing.ts.
    const after = tc.run(click(one('button')))
    expect(after.state.order).toEqual(['b', 'a'])
    expect(after.state.mountCounts).toEqual({ a: 1, b: 1 })
  })
})
