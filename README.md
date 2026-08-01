# ctrl-fx

Ctrl-fx is a no-dependency, purely functional TypeScript framework for writing
web applications and web components. Like many front end frameworks, it is
inspired by [Elm](https://elm-lang.org).

All side effects are managed by the framework. Users of the framework specify
data structures that represent effects. These data structures are associated
with a DOM element's event types. At runtime, when an event occurs, an
interpreter reads these data structures and actually performs the effects. A
different interpreter is used for testing, where the state of the world can be
specified and inspected by the application author.

State is managed by the framework. Unlike Elm, there is no top-level update
function, updating state is itself an effect.

An application is a function that takes state and returns a virtual DOM.

## A very minimal example

```ts
import { manageApplication } from 'ctrl-fx'
import { makeDom } from 'ctrl-fx/dom'
import { makeEffects } from 'ctrl-fx/effects'

// This is a very simple example of a stateful application. The application
// state is of type `number`.

// We import the dom elements functions with `makeDom()`, passing it the
// application state type, and `never` for the Event type, since this is a top
// level application and won't be firing any events upward in the component
// tree.
const { button_, div_, p_ } = makeDom<number, never>()

// Same thing for the effects we'll use, we pass the application state type and
// event type to `makeEffects()` to import versions of the Effects that are
// typed correctly for this application.
const { updateState } = makeEffects<number, never>()

// The application itself is a function that takes the current count returns a
// view that displays it, and allows more clicks by attaching the `updateState`
// effect to the button.
const application = (count: number) =>
  div_(
    p_(`Click count: ${count}`),
    button_('Click Me').onClick(updateState(count => count + 1)),
  )

// The manageApplication() function creates a ComponentManager that will manage
//  application state. Whenever application state changes, the view is
// re-rendered application the DOM is updated.  This function takes our
// application and the initial state of 0.
manageApplication(application, 0)
```

## Testing

One of the main goals of Ctrl-fx is to facilitate comprehensive testing. Because
side effects are modeled with data structures, application logic can easily be
tested with a purely functional effect interpreter that is distinct from the
runtime effect interpreter.

Here's a quick example.

```typescript
import { describe, expect, it } from 'vitest'
import { makeDom, typeAttr } from 'ctrl-fx/dom'
import { makeEffects } from 'ctrl-fx/effects'
import { click, one, testApplication, textInput } from 'ctrl-fx/testing'

type State = string

// `_` is a fragment helper — it groups children without adding a DOM wrapper
// element.
const { _, button_, input, p_ } = makeDom<State, never>()

const { alert, getState, updateState } = makeEffects<State, never>()

// The application takes the user's name as state and says hello when the
// button is clicked. The text field updates state on each keystroke.
const application = (state: State) =>
  _(
    p_('Name'),
    input(typeAttr('text'))
      .prop('value', state)
      .onTextInput(textState => updateState(_prev => textState.value)),
    button_('Say Hello').onClick(
      getState().flatMap(state => alert(`Hello, ${state}`)),
    ),
  )

describe('shows alert', () => {
  it('says hello to user', () => {
    // `testApplication` runs the app with a simulated environment.
    // `one('selector')` queries the virtual DOM and asserts exactly one match.
    const app = testApplication(application, '')
      // type "world" into the text field
      .run(textInput(one('input'), 'world'))
      // click the button
      .run(click(one('button')))

    // `app.data` exposes the simulated environment — window, storage, etc.
    expect(app.data.window.alerts.length).toBe(1)
    expect(app.data.window.alerts[0]).toBe('Hello, world')
  })
})
```

## Quick start

Scaffold a new project with a single command:

```
npx tiged chris24carroll/ctrl-fx-template my-app
cd my-app
npm install
npm run dev
```

## Installation

To add ctrl-fx to an existing project:

```sh
npm install ctrl-fx
```

## Learn more

See the [guide](doc/guide.md) (which is currently a work in progress) for a more
in-depth view of the framework.

If you clone this repository, you can run examples:

```
npm install && npm run examples
```

## Roadmap

### A commit seam for the View Transitions API

ctrl-fx currently commits every render synchronously: a state update runs the
component's `view()` and mutates the real DOM in a single pass (see
`ComponentManager.renderComponent`). That synchronous commit is a load-bearing
invariant — event listener resolution and `getState` both assume the DOM and
the component state move in lockstep — but it is also a closed seam: the
browser's [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
requires the DOM mutation to happen *inside* a `document.startViewTransition`
callback, and only the owner of the commit can put it there. No application
using ctrl-fx can adopt view transitions from userland today; exit animations
have to be hand-built by keeping "the thing that is leaving" in application
state until a timer removes it.

The plan is to expose the commit as a seam rather than to grow an animation
system:

- A mount-time option on `manageApplication` — shape to be finalized, roughly
  `shouldTransitionRender?: (oldState, newState) => boolean` (or a more
  general `wrapCommit`) — consulted per render. When it returns true and
  `document.startViewTransition` exists, the render's diff-and-mutate pass
  runs inside the transition callback; otherwise the commit is unchanged.
  All animation styling stays in application CSS via the standard
  `::view-transition-old`/`::view-transition-new` pseudo-elements — the
  framework never learns what an animation is.
- A small commit queue for re-entrancy: a render arriving while a
  transition's callback is still pending must either chain behind
  `transition.updateCallbackDone` or force-flush the pending commit and skip
  the animation. This is the one place the synchronous-commit invariant
  bends, and it is where the design and test effort belongs.
- `RealDocument` (`src/internal/realdom.ts`) gains an optional
  `startViewTransition`, with the testing interpreter stubbing it as a
  passthrough so `ctrl-fx/testing` runs stay synchronous and deterministic.

Why it fits: ctrl-fx's stance is minimalism plus letting the platform do the
work (CSS handles mount animations, native drag-and-drop flows through the
generic `onEvent` escape hatch, `matchMedia` integrates via `dispatchEffect`).
View Transitions is the platform offering exit animations, snapshotting, and
crossfade orchestration for free — adopting it gives ctrl-fx a complete page
transition story without an animation API. The seam is also honest
architecture beyond this one feature: scroll-restoration timing and batched
flushes would use the same hook.

### Known wart: `onLocationChange` only covers popstate if `onPopState` is also subscribed

`onLocationChange` is documented as firing "on any location change, including
popstate" — but the `locationchange` re-dispatch for browser back/forward
lives inside the popstate container-event handler, and the native `popstate`
listener is only attached when some `onPopState` listener is registered
(`EventManager.processAdjustments`). An app subscribing only to
`onLocationChange` silently misses back/forward navigation; an app
subscribing to both gets its handler invoked twice per popstate. Either the
runtime should always listen for popstate and re-dispatch, or the docs should
state the pairing requirement and the double-fire.
