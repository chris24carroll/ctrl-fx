import { isEffect, pure, type Effect } from '../effects'
import type { NodeId } from './nodeid'
import { nodeGroup, type NodeGroup } from './views'
import { type Node } from './'

/** A self-contained UI unit with its own state, view, and optional scoped CSS. */
export type Component<State, Params, Event> = {
  readonly _type: 'Component'
  readonly params: Params
  readonly css?: string | ((params: Params) => string)
  readonly initialState: (params: Params) => Effect<State, Event, State>
  view(state: State, params: Params): NodeGroup<State, Event>
}

export type ComponentEventListener<State, Event, ComponentEvent> = (
  event: ComponentEvent,
) => Effect<State, Event, void>

/** A mounted instance of a Component inside a parent view. */
export type ComponentElement<
  State,
  Event,
  ComponentState,
  Params,
  ComponentEvent,
> = {
  readonly _type: 'Component'
  readonly nodeId: NodeId
  readonly component: Component<ComponentState, Params, ComponentEvent>
  readonly componentEventListeners: readonly ComponentEventListener<
    State,
    Event,
    ComponentEvent
  >[]
  /** Registers a listener for events fired by the component. */
  onEvent(
    eventListener: ComponentEventListener<State, Event, ComponentEvent>,
  ): ComponentElement<State, Event, ComponentState, Params, ComponentEvent>
}

export function componentElem<
  State,
  Event,
  ComponentState,
  Params,
  ComponentEvent,
>(
  component: Component<ComponentState, Params, ComponentEvent>,
  nodeId: NodeId,
  params?: Params,
): ComponentElement<State, Event, ComponentState, Params, ComponentEvent> {
  const resolvedComponent =
    params !== undefined ? { ...component, params } : component

  return {
    _type: 'Component',
    nodeId,
    component: resolvedComponent,
    componentEventListeners: [],
    onEvent(
      eventListener: ComponentEventListener<State, Event, ComponentEvent>,
    ) {
      const eventListeners = this.componentEventListeners
      return {
        ...this,
        componentEventListeners: [...eventListeners, eventListener],
      }
    },
  }
}

function toComponent<State, Params, Event>(
  view: (
    state: State,
    params: Params,
  ) => Node<State, Event> | NodeGroup<State, Event>,
  initialState: (params: Params) => State | Effect<State, Event, State>,
  params: Params,
  css?: string | ((params: Params) => string),
): Component<State, Params, Event> {
  return {
    _type: 'Component',
    params,
    css,
    initialState(params: Params) {
      const result = initialState(params)
      if (isEffect(result)) {
        return result
      } else {
        return pure(result as State)
      }
    },
    view(state: State, params: Params) {
      const result = view(state, params)
      if (typeof result === 'object' && result._type === 'NodeGroup') {
        return result
      } else {
        return nodeGroup(result)
      }
    },
  }
}

// no params component
function toSimpleComponent<State, Event>(
  view: (state: State) => Node<State, Event> | NodeGroup<State, Event>,
  initialState: State | Effect<State, Event, State>,
  css?: string,
): Component<State, void, Event> {
  return {
    _type: 'Component',
    css,
    initialState: () => {
      if (isEffect(initialState)) {
        return initialState
      } else {
        return pure<State, Event, State>(initialState as State)
      }
    },
    view: (state: State) => {
      const result = view(state)
      if (typeof result === 'object' && result['_type'] === 'NodeGroup') {
        return result
      } else {
        return nodeGroup(result)
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: undefined as any,
  }
}

/**
 * Creates a `Component` — a self-contained UI unit with its own managed state.
 *
 * The simple overload `component(view, initialState, css?)` is for components
 * that do not accept external configuration. The params overload
 * `component(view, initialStateFactory, params, css?)` is for components that
 * accept a `Params` value from their parent, which is passed to both `view` and
 * the initial-state factory on mount.
 *
 * The runtime calls `view(state, params)` whenever state changes and diffs the
 * result against the previous virtual DOM to update the browser.
 *
 * @param css Optional scoped CSS string (or a function of params returning one)
 *   that is injected into a `<style>` element inside the component's shadow root.
 */
export function component<State, Event>(
  view: (state: State) => Node<State, Event> | NodeGroup<State, Event>,
  initialState: State | Effect<State, Event, State>,
  css?: string,
): Component<State, void, Event>

export function component<State, Params, Event>(
  view: (
    state: State,
    params: Params,
  ) => Node<State, Event> | NodeGroup<State, Event>,
  initialState: (params: Params) => State | Effect<State, Event, State>,
  params: Params,
  css?: string | ((params: Params) => string),
): Component<State, Params, Event>

export function component<State, Params, Event>(
  ...args:
    | [
        view: (state: State) => Node<State, Event> | NodeGroup<State, Event>,
        initialState: State | Effect<State, Event, State>,
        css?: string,
      ]
    | [
        view: (
          state: State,
          params: Params,
        ) => Node<State, Event> | NodeGroup<State, Event>,
        initialState: (params: Params) => State | Effect<State, Event, State>,
        params: Params,
        css?: string | ((params: Params) => string),
      ]
): Component<State, Params extends undefined ? void : Params, Event> {
  if (
    args.length <= 3 &&
    (args.length < 3 || typeof args[2] === 'string' || args[2] === undefined)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [view, initialState, css] = args as [any, any, string?]
    return toSimpleComponent(view, initialState, css) as unknown as Component<
      State,
      Params extends undefined ? void : Params,
      Event
    >
  } else {
    const [view, initialState, params, css] = args as [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      Params,
      (string | ((p: Params) => string))?,
    ]
    return toComponent<State, Params, Event>(
      view,
      initialState,
      params,
      css,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any
  }
}

/** Creates a root-level Component with no params or events. Convenience wrapper for `component`. */
export function application<State>(
  view: (state: State) => Node<State, never> | NodeGroup<State, never>,
  initialState: State | Effect<State, never, State>,
): Component<State, void, never> {
  return toSimpleComponent<State, never>(view, initialState)
}
