import { type Node } from '.'
import type { Dimensions } from '..'
import type { Effect } from '../effects'
import type { InternalLocation } from '../net/location'
import type {
  ContainerListener,
  EventListenerResult,
  EventOptions,
  KeyData,
} from './events'
import { nodeId, type NodeId } from './nodeid'

/**
 * The return type of a view function: a list of virtual DOM nodes plus optional
 * container-level event listeners. Create one with `nodeGroup(...)` or the `_` shorthand.
 */
export type NodeGroup<State, Event> = {
  _type: 'NodeGroup'

  nodes: Node<State, Event>[]

  containerListeners: ContainerListener<State, Event>[]

  /** Runs `effect` whenever the component's container is resized, receiving the new dimensions. */
  onResize(
    effect: (dimensions: Dimensions) => Effect<State, Event, void>,
  ): NodeGroup<State, Event>

  /** Runs `effect` when the browser back/forward buttons are used. */
  onPopState(
    effect: (location: InternalLocation) => Effect<State, Event, void>,
  ): NodeGroup<State, Event>

  /** Runs `effect` on any location change, including `pushState` and `replaceState` as well as `popstate`. */
  onLocationChange(
    effect: (location: InternalLocation) => Effect<State, Event, void>,
  ): NodeGroup<State, Event>

  /** Runs `effect` on document-level keyup events. */
  onKeyUp(
    effect: (key: KeyData) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): NodeGroup<State, Event>

  /** Runs `effect` on document-level keydown events. */
  onKeyDown(
    effect: (key: KeyData) => Effect<State, Event, EventListenerResult>,
    options?: EventOptions,
  ): NodeGroup<State, Event>

  /** Runs `effect` when the page becomes visible or hidden (e.g. user switches tabs). */
  onVisibilityChange(
    effect: (state: 'visible' | 'hidden') => Effect<State, Event, void>,
  ): NodeGroup<State, Event>

  /** Runs `effect` when the browser comes online. */
  onOnline(effect: Effect<State, Event, void>): NodeGroup<State, Event>

  /** Runs `effect` when the browser goes offline. */
  onOffline(effect: Effect<State, Event, void>): NodeGroup<State, Event>

  renderEffects: Effect<State, Event, void>[]

  /** Runs `effects` once immediately after the component mounts. Use this for initial data loading or setup that requires the DOM to exist. */
  onRender(...effects: Effect<State, Event, void>[]): NodeGroup<State, Event>
}

/** Creates a `NodeGroup` from zero or more nodes. This is what view functions return. */
export function nodeGroup<State, Event>(
  ...nodes: Node<State, Event>[]
): NodeGroup<State, Event> {
  return {
    _type: 'NodeGroup',
    nodes,
    containerListeners: [],

    onResize(
      effect: (dimensions: Dimensions) => Effect<State, Event, void>,
    ): NodeGroup<State, Event> {
      return {
        ...this,
        containerListeners: [
          ...this.containerListeners,
          {
            _type: 'resize',
            onChange: effect,
            options: {},
          },
        ],
      }
    },

    onPopState(
      effect: (location: InternalLocation) => Effect<State, Event, void>,
    ): NodeGroup<State, Event> {
      return {
        ...this,
        containerListeners: [
          ...this.containerListeners,
          {
            _type: 'popstate',
            onChange: effect,
            options: {},
          },
        ],
      }
    },

    onLocationChange(
      effect: (location: InternalLocation) => Effect<State, Event, void>,
    ): NodeGroup<State, Event> {
      return {
        ...this,
        containerListeners: [
          ...this.containerListeners,
          {
            _type: 'locationchange',
            onChange: effect,
            options: {},
          },
        ],
      }
    },

    onKeyDown(
      effect: (key: KeyData) => Effect<State, Event, EventListenerResult>,
    ): NodeGroup<State, Event> {
      return {
        ...this,
        containerListeners: [
          ...this.containerListeners,
          {
            _type: 'keydown',
            effect,
            options: {},
          },
        ],
      }
    },

    onKeyUp(
      effect: (key: KeyData) => Effect<State, Event, EventListenerResult>,
    ): NodeGroup<State, Event> {
      return {
        ...this,
        containerListeners: [
          ...this.containerListeners,
          { _type: 'keyup', effect, options: {} },
        ],
      }
    },

    onVisibilityChange(
      effect: (state: 'visible' | 'hidden') => Effect<State, Event, void>,
    ): NodeGroup<State, Event> {
      return {
        ...this,
        containerListeners: [
          ...this.containerListeners,
          { _type: 'visibilitychange', onChange: effect, options: {} },
        ],
      }
    },

    onOnline(effect: Effect<State, Event, void>): NodeGroup<State, Event> {
      return {
        ...this,
        containerListeners: [
          ...this.containerListeners,
          { _type: 'online', effect, options: {} },
        ],
      }
    },

    onOffline(effect: Effect<State, Event, void>): NodeGroup<State, Event> {
      return {
        ...this,
        containerListeners: [
          ...this.containerListeners,
          { _type: 'offline', effect, options: {} },
        ],
      }
    },

    renderEffects: [],

    onRender(
      ...effects: Effect<State, Event, void>[]
    ): NodeGroup<State, Event> {
      return {
        ...this,
        renderEffects: effects,
      }
    },
  }
}

/** Shorthand alias for `nodeGroup`. Useful for grouping nodes without extra verbosity: `_(div_('a'), div_('b'))`. */
export function _<State, Event>(
  ...nodes: Node<State, Event>[]
): NodeGroup<State, Event> {
  return nodeGroup(...nodes)
}

/** A memoized subtree node produced by `view` or `fixedView`. */
export type View<State, Params, Event> = {
  _type: 'View'
  nodeId: NodeId
  params: Params
  nodes: (params: Params) => NodeGroup<State, Event>
}

/**
 * Creates a memoized subtree. The `nodes` function is only re-called when `params` changes
 * (by reference). Use this to avoid re-rendering expensive subtrees that don't depend on
 * frequently-changing state.
 * @param id A stable identifier used to track this view across re-renders. Must be unique among siblings.
 */
export function view<State, Params, Event>(
  id: NodeId | string,
  nodes: (params: Params) => NodeGroup<State, Event> | Node<State, Event>,
): (params: Params) => View<State, Params, Event> {
  return (params: Params) => ({
    _type: 'View',
    nodeId: typeof id === 'string' ? nodeId(id) : id,
    params,
    nodes: (params: Params) => {
      const nodeOrNodeGroup = nodes(params)
      return isNodeGroup<State, Event>(nodeOrNodeGroup)
        ? nodeOrNodeGroup
        : _(nodeOrNodeGroup)
    },
  })
}

/**
 * Creates a memoized subtree that never re-renders after mount. The `nodes` function is
 * called once; subsequent renders reuse the result.
 * @param id A stable identifier used to track this view across re-renders.
 */
export function fixedView<State, Event>(
  id: NodeId | string,
): (
  nodes: NodeGroup<State, Event> | Node<State, Event>,
) => View<State, void, Event> {
  return nodes => ({
    _type: 'View',
    nodeId: typeof id === 'string' ? nodeId(id) : id,
    params: undefined,
    nodes: () => (isNodeGroup<State, Event>(nodes) ? nodes : _(nodes)),
  })
}

export function isNodeGroup<State, Event>(
  value: unknown,
): value is NodeGroup<State, Event> {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value !== 'object') {
    return false
  }

  return (
    Object.prototype.hasOwnProperty.call(value, '_type') &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value as any)['_type'] === 'NodeGroup' &&
    Object.prototype.hasOwnProperty.call(value, 'nodes') &&
    Object.prototype.hasOwnProperty.call(value, 'containerListeners')
  )
}
