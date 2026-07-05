# `ctrl-fx`

## Table of contents

1. [Introduction](#introduction)
2. [Basics](#basics)
3. [Getting started](#getting-started)
4. [Core concepts](#core-concepts)

---

## Introduction

Ctrl-fx is a no-dependency, purely functional TypeScript framework for writing
web applications and web components. Like many front end frameworks, it is
inspired by [Elm](https://elm-lang.org).

All side effects are managed by the framework. Users of the framework specify
data structures that represent these side effects. These data structures are
associated with a DOM element's event types. At runtime, when an event occurs,
an interpreter looks up these data structures and performs the actual side
effect routines. A different interpreter is used during testing, where the state
of the world can be specified and inspected by the application writer.

---

## Basics

An application built with Ctrl-fx is a function that takes state and returns a
virtual DOM.

More specifically, this returns a `NodeGroup`. A `NodeGroup` is a sequence of
virtual DOM `Node`s and a sequence of `ContainerListener`s. (A
`ContainerListener`is an `EventListener` that isn't associated with an
individual`Node` and will be discussed later.)

A `Node` is a discriminated union of four types. One type is simply `string`,
which corresponds to a browser's Text node type.

Another type is `Element`. This type has a `tag` property that corresponds with
an HTML tag. `Element`s have `EventListener`s that can specify effects that
should be run when specific DOM events occur on the real DOM element represented
by a particular `Element`.

The other two `Node` types are `View` and `Component`. Both of these have a
function that return a `NodeGroup`. The significant difference between them is
that while both of these "view" functions take parameters, a `Component`'s view
function also takes a "state" argument. The initial instance of this state
parameter is specified by the `Component`, but state transitions are managed by
the Ctrl-fx runtime.

A `Component` can also fire events for which its parent `Node` can listen.

A Ctrl-fx application itself is just a `Component`. It wil typically not fire
events up the virtual DOM tree (since it doesn't have a parent `Node`), but
Ctrl-fx treats it like any other `Component`.

So an application is essentially a function that, when provided its current
state, returns a description of the DOM. The runtime will call this function
whenever the application's state changes and update the browser's DOM to match
the application's description of it.

How does the application's state change? The `Effect`s specified by
`EventListener`s attached to the virtual DOM can describe a state transition
with the `UpdateState` effect. It has a property that is a function that takes
the current state and returns a new state.

---

## Getting started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Create a new project

Ctrl-fx works with any bundler that supports TypeScript. These instructions use
[Vite](https://vite.dev), which requires no configuration to get started.

```sh
npm create vite@latest my-app -- --template vanilla-ts
cd my-app
npm install
```

### Install ctrl-fx

```sh
npm install ctrl-fx
```

### Configure TypeScript

Open `tsconfig.json` and make sure it includes at a minimum:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "strict": true
  }
}
```

`"moduleResolution": "bundler"` is required — it tells TypeScript how to resolve
ctrl-fx's package exports.

### Set up the HTML

Open `index.html`. Vite's template already includes `<div id="app"></div>`,
which is where ctrl-fx mounts your application by default. The file should look
similar to this:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### Write your first application

Replace the content of `src/main.ts` with this (this is the an example from the
project README file and the basic example under the doc/examples directory):

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

// This creates a ComponentManager, which manages application state and
// re-renders the view whenever state changes. We pass it our application and
// the initial state of 0
manageApplication(application, 0)
```

### Start the development server

```sh
npm run dev
```

Open the URL shown in your terminal. You should see a counter and a button with
which to increment it.

### Build for production

```sh
npm run build
```

Vite compiles and bundles your application into the `dist/` directory, ready to
deploy.

---

## Core concepts

### Effects

As stated above, an Effect is a data structure that describes a real world side
effect. Lets look at an example. The function `alert(messsage: any)` returns a
data structure that describes the effect of showing an information dialog to a
user. This corresponds with the JavaScript `alert` function implemented by
browsers. When we call `alert("Hello, world")` an object with a `_type` property
and an `operation` property (along with some function properties that are
omitted for now but will be discussed shortly) is returned:

```typescript
{
  _type: 'Suspend',
  operation: {
    _type: 'Alert',
    input: 'Hello, world'
  },
  ...
}
```

the `operation` property contains a `_type` that is a union type of all the
kinds of side effects, and an `input` property for the arguments needed to run
the effect.

The top level `_type` property is either `Suspend`, `Return`, or `FlatMap`. This
field discriminates among the three corresponding `Effect` union types.

`Suspend` effects have a corresponding operation, like the `alert()` effect
above.

A `Return` effect has no corresponding operation, but instead wraps a value of
some arbitrary type. One can be constructed with the `pure` function.

The final variant of `Effect`, `FlatMap`, combines another effect with a
function that takes the result of that effect and returns yet another effect.
When this effect is interpreted, the wrapped effect is interpreted, then passed
to the "next" function. The resulting effect is then interpreted.

`Effect` is an domain-specific implementation of the "free monad".

All `Effect` variants have the following methods:

- `flatMap`
- `map`
- `and`
- `as`
- `void`
- `apply`

`flatMap` takes a function that itself takes the result of this current effect
and returns a new effect. It is how the `FlatMap` variant gets constructed. It
allows effects to be chained together:

```typescript
getTime().flatMap(time => alert(`The time is ${time}`))
```

The important thing to remember that the result of the previous code is a data
structure that describes the idea of getting the current time and then
displaying it. No side effects actually occur when the that line of code is run.

`map` takes a function that, like `flatMap`, takes the result of the current
effect and returns a new value (not an effect):

```typescript
getTime().map(time => `The time is ${time}`)
```

In this case, the result type of the Effect is `string`, since we mapped the
getTime's `Date` type to string.

`and` is like `flatMap`, but the result of the first effect is thrown away:

`void` is like calling map but having the passed function return undefined. For
example, lets make an HTTP request where we don't care about the response at
all.

```typescript
makeHttpRequest(request).void()
```

Here `void` transforms an effect whose result type is `Result<HttpResponse,
RequestError | HttpError>` to an effect whose result type is `void`.

`apply` is in a different category. It follows a convention that Ctrl-fx uses.
An `apply` method on any object accepts a function that takes the object type as
a parameter. It will simply call the function with itself, returning the result.
This is just a convenience to support a form of left-to-right function chaining.

---

### Events

Virtual DOM elements map events to effects. The `Element` events correspond to
normal HTML element events. And the container events correspond to events that
would be normal attached to the window or document instance.

The `Event` type parameter is the type of the information that a component can
send to its parent DOM node. It is present on DOM nodes (because they define
effects) and on `Effect`s, since `FireEvent` is the effect that causes this to
happen.

---

### Testing

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
      .run(textInput(one('input'), 'world'))
      .run(click(one('button')))

    // `app.data` exposes the simulated environment — window, storage, etc.
    expect(app.data.window.alerts.length).toBe(1)
    expect(app.data.window.alerts[0]).toBe('Hello, world')
  })
})
```

---

### Web Components

Ctrl-fx attempts to integrate nicely with web components. It can consume third
party web components, and it tries to make it easy to write web components to be
used outside of the Ctrl-fx framework.

#### Consuming web components

Any custom HTML element can be used via the `element` builder, which accepts an
arbitrary tag name. Set properties with `.prop` and listen for custom events
with `.onEvent`:

```typescript
import { makeDom } from 'ctrl-fx/dom'
import { makeEffects } from 'ctrl-fx/effects'

type State = { rating: number }

const { div_, p_, element } = makeDom<State, never>()
const { updateState } = makeEffects<State, never>()

const app = (state: State) =>
  div_(
    element('rating-stars')()()
      .prop('value', state.rating)
      .onEvent('rating-change', detail => {
        const { value } = detail as { value: number }
        return updateState(() => ({ rating: value }))
      }),
    p_(`Rating: ${state.rating}`),
  )
```

Ctrl-fx treats the custom element as a black box: it sets properties on the DOM
node directly and listens for custom events dispatched by the element.

#### Exporting a ctrl-fx component as a web component

`defineWebComponent` from `ctrl-fx/webcomponent` wraps any ctrl-fx `Component`
as a custom element, making it consumable from plain HTML or any other
framework:

```typescript
import { defineWebComponent } from 'ctrl-fx/webcomponent'
import { counter } from './counter'

defineWebComponent('ctrl-counter', counter, {
  events: () => 'count-changed',
})
```

The `events` option maps the component's `Event` type to the custom event name
that the web component will dispatch on the DOM. Once registered, the element
can be used anywhere custom elements are supported:

```html
<ctrl-counter></ctrl-counter>
```

---
