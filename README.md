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

## Installation

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
