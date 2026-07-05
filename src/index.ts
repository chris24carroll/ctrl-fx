//import type { Component } from "./components";
//import { type NodeGroup } from "./dom/views";
import { isNodeGroup, nodeGroup, type NodeGroup } from './dom/views'
import type { Node } from './dom'
import {
  /*isEffect, makeEffects,*/ isEffect,
  makeEffects,
  type Effect,
} from './effects'
import type { Component } from './dom/components'
import { domInterpreter } from './internal/dominterpreter'
import { manageComponent } from './internal/cmpmgr'
import type { RealWindow } from './internal/realdom'
import { realStyleRegistry } from './internal/styleregistry'
//import { ComponentManager } from "./internal/cmpmgr";

/** Type guard that returns true when `effectOrState` is a plain state value rather than an `Effect`. */
export function isState<State>(
  effectOrState: Effect<State, never, State> | State,
): effectOrState is State {
  return !isEffect(effectOrState)
}

/** Converts a plain view function and initial state into a `Component`. Used internally by `manageApplication`; prefer `component()` from `ctrl-fx/dom` in application code. */
export function toComponent<State>(
  app: (state: State) => Node<State, never> | NodeGroup<State, never>,
  initialState: State | Effect<State, never, State>,
): Component<State, void, never> {
  const { pure } = makeEffects<State, never>()

  const initialStateEffect = isState(initialState)
    ? pure(initialState)
    : initialState

  const adjustedApp = (state: State) => {
    const nodeOrNodeGroup = app(state)
    if (isNodeGroup<State, never>(nodeOrNodeGroup)) {
      return nodeOrNodeGroup
    } else {
      return nodeGroup(nodeOrNodeGroup)
    }
  }

  return {
    _type: 'Component',
    params: undefined,
    view: adjustedApp,
    initialState() {
      return initialStateEffect
    },
  }
}

/**
 * Mounts a ctrl-fx application into the DOM element with id `mountId` and starts the runtime.
 * Returns a `dispatchEffect` handle for triggering effects from outside the framework
 * (e.g. from a service worker message).
 * @param mountId The id of the mount element. Defaults to `'app'`.
 */
export function manageApplication<State>(
  app: (state: State) => Node<State, never> | NodeGroup<State, never>,
  initialState: State | Effect<State, never, State>,
  mountId: string = 'app',
): { dispatchEffect: (effect: Effect<State, never, void>) => void } {
  const component = toComponent(app, initialState)

  return manageComponent<State, void, never>(
    component,
    mountId,
    globalThis.window as RealWindow,
    domInterpreter,
    realStyleRegistry(),
  )
}

// const component: Component<State, never, never> = {
//   view: adjustedApp,
//   initialState: initialStateEffect
// }

//return todo()
// new ComponentManager(
//   component,
//   nodeId("__ctrl-fx_root_component"),
//   mountId
// )
//}

/** Width and height in pixels, as reported by a resize observer. */
export type Dimensions = {
  width: number
  height: number
}

/** The browser permission state for a feature such as notifications. */
export interface Permission {
  value: 'default' | 'granted' | 'denied'
  /** Returns true when the permission has been explicitly granted. */
  isGranted(): boolean
  /** Returns true when the user has not yet been prompted. */
  isDefault(): boolean
  /** Returns true when the permission has been explicitly denied. */
  isDenied(): boolean
}

/** Constructs a `Permission` value from a raw browser permission string. */
export function permission(
  value: 'default' | 'granted' | 'denied',
): Permission {
  return {
    value,
    isGranted() {
      return value === 'granted'
    },
    isDefault() {
      return value === 'default'
    },
    isDenied() {
      return value === 'denied'
    },
  }
}

/** A branded string containing a UUID v4. */
export type Uuid = string & { __brand: 'Uuid' }

/** Deterministically derives a UUID-shaped string from `input` by hashing it. Useful for generating stable node identifiers from content. */
export function uuidFromString(input: string): Uuid {
  let hash = 0

  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0
  }

  const hex = (hash >>> 0).toString(16).padStart(8, '0')

  const repeated = hex.repeat(4)

  return [
    repeated.slice(0, 8),
    repeated.slice(8, 12),
    repeated.slice(12, 16),
    repeated.slice(16, 20),
    repeated.slice(20, 32),
  ].join('-') as Uuid
}
