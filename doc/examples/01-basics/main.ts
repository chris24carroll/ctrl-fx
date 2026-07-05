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

// This creates a ComopnentManager, which manages application state and
// re-renders the view whenever state changes. We pass it our application and
// the initial state of 0
manageApplication(application, 0)
