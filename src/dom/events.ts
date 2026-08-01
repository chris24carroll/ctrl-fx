import type { Dimensions } from '..'
import { async, type Effect } from '../effects'
import type { InternalLocation } from '../net/location'

export const eventTypes = [
  'blur',
  'change',
  'click',
  'dblclick',
  'focus',
  'keydown',
  'keyup',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'scroll',
  'scrollend',
  'submit',
  'textinput',
  'touchstart',
  'touchmove',
  'touchend',
  'touchcancel',
  'wheel',
] as const

export type EventType = (typeof eventTypes)[number]

/** Current value and cursor position of a text input, passed to `onTextInput` handlers. */
export type TextState = {
  value: string
  selectionStart: number | null
  selectionEnd: number | null
}

export type TextInputListener<State, Event> = {
  _type: 'textinput'
  effect: (textState: TextState) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

/** Key name and code from a keyboard event, passed to `onKeyDown`/`onKeyUp` handlers. */
export type KeyData = {
  key: string
  code: string
  /** Modifier state at the moment of the keystroke -- e.g. distinguishing Enter (send) from Shift+Enter (newline) in chat composers. */
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
}

export type KeyDownListener<State, Event> = {
  _type: 'keydown'
  effect: (key: KeyData) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type KeyUpListener<State, Event> = {
  _type: 'keyup'
  effect: (key: KeyData) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

/** Touch-point coordinates from a touch event, passed to `onTouchStart`/`onTouchMove`/`onTouchEnd` handlers. */
export type TouchData = {
  clientX: number
  clientY: number
  pageX: number
  pageY: number
}

export type TouchStartListener<State, Event> = {
  _type: 'touchstart'
  effect: (
    touches: readonly TouchData[],
  ) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type TouchMoveListener<State, Event> = {
  _type: 'touchmove'
  effect: (
    touches: readonly TouchData[],
  ) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type TouchCancelListener<State, Event> = {
  _type: 'touchcancel'
  effect: (
    touches: readonly TouchData[],
  ) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type TouchEndListener<State, Event> = {
  _type: 'touchend'
  effect: (
    touches: readonly TouchData[],
  ) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

/** Options forwarded to `addEventListener`. */
export type EventOptions = {
  capture?: boolean
  passive?: boolean
}

/** Browser event modifiers an event handler can request. Return from a handler to call `preventDefault` or `stopPropagation`. */
export type EventActions = {
  stopPropagation?: boolean
  preventDefault?: boolean
}

/** Return type of event handlers: `void` or an `EventActions` object to modify browser behavior. */
export type EventListenerResult = void | EventActions

export type BlurListener<State, Event> = {
  _type: 'blur'
  effect: Effect<State, Event, EventListenerResult>
  options: EventOptions
}

/** Current value and checked state of a form element, passed to `onChange` handlers. */
export type ChangeData = {
  value: string
  checked: boolean
}

export type ChangeListener<State, Event> = {
  _type: 'change'
  effect: (data: ChangeData) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type ClickListener<State, Event> = {
  _type: 'click'
  effect: Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type DblClickListener<State, Event> = {
  _type: 'dblclick'
  effect: Effect<State, Event, EventListenerResult>
  options: EventOptions
}

/** Mouse position and movement delta, passed to `onMouseMove` handlers. */
export type MouseMoveData = {
  clientX: number
  clientY: number
  pageX: number
  pageY: number
  movementX: number
  movementY: number
}

export type MouseMoveListener<State, Event> = {
  _type: 'mousemove'
  effect: (data: MouseMoveData) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

/** Scroll deltas from a wheel event, passed to `onWheel` handlers. */
export type WheelData = {
  deltaX: number
  deltaY: number
  deltaZ: number
  deltaMode: number
}

export type WheelListener<State, Event> = {
  _type: 'wheel'
  effect: (data: WheelData) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type FocusListener<State, Event> = {
  _type: 'focus'
  effect: Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type MouseEnterListener<State, Event> = {
  _type: 'mouseenter'
  effect: Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type MouseLeaveListener<State, Event> = {
  _type: 'mouseleave'
  effect: Effect<State, Event, EventListenerResult>
  options: EventOptions
}

/** Scroll offset of the element, passed to `onScroll`/`onScrollEnd` handlers. */
export type ScrollData = {
  scrollTop: number
  scrollLeft: number
}

export type ScrollListener<State, Event> = {
  _type: 'scroll'
  effect: (data: ScrollData) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type ScrollEndListener<State, Event> = {
  _type: 'scrollend'
  effect: (data: ScrollData) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type SubmitListener<State, Event> = {
  _type: 'submit'
  effect: Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type SupportsEvents<State, Event> = {
  readonly eventListeners: readonly EventListener<State, Event>[]
}

export type CustomEventListener<State, Event> = {
  _type: 'custom'
  eventName: string
  effect: (detail: unknown) => Effect<State, Event, EventListenerResult>
  options: EventOptions
}

export type EventListener<State, Event> =
  | BlurListener<State, Event>
  | ChangeListener<State, Event>
  | ClickListener<State, Event>
  | CustomEventListener<State, Event>
  | SubmitListener<State, Event>
  | DblClickListener<State, Event>
  | FocusListener<State, Event>
  | KeyDownListener<State, Event>
  | KeyUpListener<State, Event>
  | MouseEnterListener<State, Event>
  | MouseLeaveListener<State, Event>
  | MouseMoveListener<State, Event>
  | ScrollListener<State, Event>
  | ScrollEndListener<State, Event>
  | TextInputListener<State, Event>
  | TouchCancelListener<State, Event>
  | TouchEndListener<State, Event>
  | TouchMoveListener<State, Event>
  | TouchStartListener<State, Event>
  | WheelListener<State, Event>

export function eventSupport<
  State,
  Event,
  Elem extends SupportsEvents<State, Event>,
>() {
  return {
    ...blurFocusSupport<State, Event, Elem>(),
    ...changeSupport<State, Event, Elem>(),
    ...clickSupport<State, Event, Elem>(),
    ...customEventSupport<State, Event, Elem>(),
    ...keySupport<State, Event, Elem>(),
    ...dblClickSupport<State, Event, Elem>(),
    ...mouseSupport<State, Event, Elem>(),
    ...mouseMoveSupport<State, Event, Elem>(),
    ...scrollSupport<State, Event, Elem>(),
    ...submitSupport<State, Event, Elem>(),
    ...wheelSupport<State, Event, Elem>(),
    ...textInputSupport<State, Event, Elem>(),
    ...touchSupport<State, Event, Elem>(),
  }
}

function customEventSupport<
  State,
  Event,
  T extends SupportsEvents<State, Event>,
>() {
  return {
    onEvent(
      this: T,
      eventName: string,
      effect: (detail: unknown) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'custom' as const, eventName, effect, options: options || {} },
        ],
      }
    },
  }
}

function blurFocusSupport<
  State,
  Event,
  T extends SupportsEvents<State, Event>,
>() {
  return {
    onFocus(
      this: T,
      effect: Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'focus', effect, options: options || {} },
        ],
      }
    },
    onBlur(
      this: T,
      effect: Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'blur', effect, options: options || {} },
        ],
      }
    },
  }
}

function changeSupport<
  State,
  Event,
  T extends SupportsEvents<State, Event>,
>() {
  return {
    onChange(
      this: T,
      effect: (data: ChangeData) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'change', effect, options: options || {} },
        ],
      }
    },
  }
}

function clickSupport<State, Event, T extends SupportsEvents<State, Event>>() {
  return {
    onClick(
      this: T,
      effect: Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'click', effect, options: options || {} },
        ],
      }
    },
  }
}

function dblClickSupport<State, Event, T extends SupportsEvents<State, Event>>() {
  return {
    onDblClick(
      this: T,
      effect: Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'dblclick', effect, options: options || {} },
        ],
      }
    },
  }
}

function mouseMoveSupport<State, Event, T extends SupportsEvents<State, Event>>() {
  return {
    onMouseMove(
      this: T,
      effect: (data: MouseMoveData) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'mousemove', effect, options: options || {} },
        ],
      }
    },
  }
}

function wheelSupport<State, Event, T extends SupportsEvents<State, Event>>() {
  return {
    onWheel(
      this: T,
      effect: (data: WheelData) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'wheel', effect, options: options || {} },
        ],
      }
    },
  }
}

function mouseSupport<State, Event, T extends SupportsEvents<State, Event>>() {
  return {
    onMouseEnter(
      this: T,
      effect: Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'mouseenter', effect, options: options || {} },
        ],
      }
    },
    onMouseLeave(
      this: T,
      effect: Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'mouseleave', effect, options: options || {} },
        ],
      }
    },
  }
}

function submitSupport<State, Event, T extends SupportsEvents<State, Event>>() {
  return {
    onSubmit(
      this: T,
      effect: Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'submit' as const, effect, options: options || {} },
        ],
      }
    },
  }
}

function scrollSupport<State, Event, T extends SupportsEvents<State, Event>>() {
  return {
    onScroll(
      this: T,
      effect: (data: ScrollData) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'scroll', effect, options: options || {} },
        ],
      }
    },
    onScrollEnd(
      this: T,
      effect: (data: ScrollData) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'scrollend', effect, options: options || {} },
        ],
      }
    },
  }
}

function touchSupport<State, Event, T extends SupportsEvents<State, Event>>() {
  return {
    onTouchStart(
      this: T,
      effect: (
        touchData: readonly TouchData[],
      ) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'touchstart', effect, options: options || {} },
        ],
      }
    },

    onTouchMove(
      this: T,
      effect: (
        touchData: readonly TouchData[],
      ) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'touchmove', effect, options: options || {} },
        ],
      }
    },

    onTouchEnd(
      this: T,
      effect: (
        touchData: readonly TouchData[],
      ) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'touchend', effect, options: options || {} },
        ],
      }
    },

    onTouchCancel(
      this: T,
      effect: (
        touchData: readonly TouchData[],
      ) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'touchcancel', effect, options: options || {} },
        ],
      }
    },
  }
}

function keySupport<State, Event, T extends SupportsEvents<State, Event>>() {
  return {
    onKeyDown(
      this: T,
      effect: (key: KeyData) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'keydown', effect, options: options || {} },
        ],
      }
    },
    onKeyUp(
      this: T,
      effect: (key: KeyData) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'keyup', effect, options: options || {} },
        ],
      }
    },
  }
}

function textInputSupport<
  State,
  Event,
  T extends SupportsEvents<State, Event>,
>() {
  return {
    onTextInput(
      this: T,
      effect: (
        textState: TextState,
      ) => Effect<State, Event, EventListenerResult>,
      options?: EventOptions,
    ): T {
      return {
        ...this,
        eventListeners: [
          ...this.eventListeners,
          { _type: 'textinput', effect, options: options || {} },
        ],
      }
    },
  }
}

/** Wraps `effect` and instructs the runtime to call `event.preventDefault()` after it runs. */
export function preventDefault<State, Event>(
  effect: Effect<State, Event, void>,
): Effect<State, Event, EventActions> {
  return async(effect, 0).as({ preventDefault: true })
}

/** Wraps `effect` and instructs the runtime to call `event.stopPropagation()` after it runs. */
export function stopPropagation<State, Event>(
  effect: Effect<State, Event, void>,
): Effect<State, Event, EventActions> {
  return async(effect, 0).as({ stopPropagation: true })
}

/** Wraps `effect` and instructs the runtime to call both `event.stopPropagation()` and `event.preventDefault()`. */
export function stopPropagationAndPreventDefault<State, Event>(
  effect: Effect<State, Event, void>,
): Effect<State, Event, EventActions> {
  return async(effect, 0).as({ stopPropagation: true, preventDefault: true })
}

export type ResizeListener<State, Event> = {
  _type: 'resize'
  onChange: (dimensions: Dimensions) => Effect<State, Event, void>
  options: EventOptions
}

export type PopStateListener<State, Event> = {
  _type: 'popstate'
  onChange: (location: InternalLocation) => Effect<State, Event, void>
  options: EventOptions
}

export type LocationChangeListener<State, Event> = {
  _type: 'locationchange'
  onChange: (location: InternalLocation) => Effect<State, Event, void>
  options: EventOptions
}

export type VisibilityChangeListener<State, Event> = {
  _type: 'visibilitychange'
  onChange: (state: 'visible' | 'hidden') => Effect<State, Event, void>
  options: EventOptions
}

export type OnlineListener<State, Event> = {
  _type: 'online'
  effect: Effect<State, Event, void>
  options: EventOptions
}

export type OfflineListener<State, Event> = {
  _type: 'offline'
  effect: Effect<State, Event, void>
  options: EventOptions
}

export type ContainerListener<State, Event> =
  | ResizeListener<State, Event>
  | PopStateListener<State, Event>
  | LocationChangeListener<State, Event>
  | KeyDownListener<State, Event>
  | KeyUpListener<State, Event>
  | VisibilityChangeListener<State, Event>
  | OnlineListener<State, Event>
  | OfflineListener<State, Event>

export const windowContainerEventTypes = ['resize', 'popstate', 'locationchange', 'online', 'offline'] as const
export const documentContainerEventTypes = ['keydown', 'keyup', 'visibilitychange'] as const

export const containerEventTypes = [
  ...windowContainerEventTypes,
  ...documentContainerEventTypes,
]

export type WindowContainerEventType =
  (typeof windowContainerEventTypes)[number]
export type DocumentContainerEventType =
  (typeof documentContainerEventTypes)[number]

export type ContainerEventType =
  | WindowContainerEventType
  | DocumentContainerEventType
