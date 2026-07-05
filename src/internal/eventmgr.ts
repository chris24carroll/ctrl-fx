import {
  containerEventTypes,
  eventTypes,
  type ChangeData,
  type ContainerEventType,
  type CustomEventListener,
  type ScrollData,
  type ContainerListener,
  type EventListener,
  type EventListenerResult,
  type EventOptions,
  type EventType,
  type MouseMoveData,
  type TextState,
  type TouchData,
  type WheelData,
} from '../dom/events'
import type { Effect } from '../effects'
import { internalLocationFromLocation } from '../net/location'
import { exhaustivenessCheck } from '../utils'
import { currentLocation } from './locutils'
import type {
  RealEvent,
  RealKeyboardEvent,
  RealMouseMoveEvent,
  RealTouchEvent,
  RealWheelEvent,
  RealWindow,
} from './realdom'
import type { ComponentNode, InternalElementNode, ViewNode } from './vdom'

// The framework's internal name for text input events is 'textinput', but the
// DOM fires 'input'. Map before registering listeners and before comparing.
function toNativeEventType(type: string): string {
  return type === 'textinput' ? 'input' : type
}

function makeEventTypeKeyedRecord<EventTypes extends readonly string[], Value>(
  eventTypes: EventTypes,
  defaultValue: () => Value,
): Record<(typeof eventTypes)[number], Value> {
  const record = {} as Record<EventTypes[number], Value>

  for (const eventType of eventTypes) {
    record[eventType as EventTypes[number]] = defaultValue()
  }
  return record
}

type ListenerTotals = { regular: number; capture: number }

type ListenerCounts<EventType extends string> = Record<
  EventType,
  ListenerTotals
>

export function makeListenerCounts<EventTypes extends readonly string[]>(
  eventTypes: EventTypes,
): ListenerCounts<(typeof eventTypes)[number]> {
  return makeEventTypeKeyedRecord(eventTypes, () => ({
    regular: 0,
    capture: 0,
  }))
}

type ListenerChangeMap<EventType extends string> = Map<
  EventType,
  { regular: boolean; capture: boolean }
>

function updateListenerChangeMap<EventType extends string>(
  map: ListenerChangeMap<EventType>,
  eventType: EventType,
  capture: boolean,
): void {
  const existing = map.get(eventType)
  if (existing) {
    if (capture) {
      existing.capture = true
    } else {
      existing.regular = true
    }
  } else {
    map.set(eventType, {
      capture: capture,
      regular: !capture,
    })
  }
}

/** Given current counts of all listeners, adjust them for a specific node given
 * its old listeners and its new listeners. Return which listener counts have
 * dropped to zero and which listener counts have gone from zero to a positive
 * number. Also include a set of all the new event types.
 */
export function adjustCountsAndGetListenerTypesToRemoveAndAdd<
  K extends string,
  L extends { _type: K; options?: EventOptions },
>(
  counts: Record<K, ListenerTotals>,
  oldListeners: readonly L[],
  newListeners: readonly L[],
): {
  toRemove: Map<K, { regular: boolean; capture: boolean }>
  toAdd: Map<K, { regular: boolean; capture: boolean }>
  allNewEvents: Map<K, { regular: boolean; capture: boolean }>
} {
  // iterate through old and new listeners to calculate the change in listener
  // counts
  const countDiffs: Partial<Record<K, ListenerTotals>> = {}
  oldListeners.forEach(listener => {
    const capture = listener.options && listener.options.capture ? true : false

    const totals = countDiffs[listener._type]
    const currDiff = capture ? totals?.capture : totals?.regular

    const newDiff = currDiff ? currDiff - 1 : -1
    if (totals) {
      if (capture) {
        totals.capture = newDiff
      } else {
        totals.regular = newDiff
      }
    } else {
      countDiffs[listener._type] = {
        regular: capture ? 0 : newDiff,
        capture: capture ? newDiff : 0,
      }
    }
  })

  const allNewEvents = new Map<K, { regular: boolean; capture: boolean }>()

  newListeners.forEach(listener => {
    const capture = listener.options && listener.options.capture ? true : false

    const totals = countDiffs[listener._type]
    const currDiff = capture ? totals?.capture : totals?.regular

    const newDiff = currDiff ? currDiff + 1 : 1
    if (totals) {
      if (capture) {
        totals.capture = newDiff
      } else {
        totals.regular = newDiff
      }
    } else {
      countDiffs[listener._type] = {
        regular: capture ? 0 : newDiff,
        capture: capture ? newDiff : 0,
      }
    }

    updateListenerChangeMap(allNewEvents, listener._type, capture)
  })

  const toAdd = new Map<K, { regular: boolean; capture: boolean }>()
  const toRemove = new Map<K, { regular: boolean; capture: boolean }>()

  for (const [k, v] of Object.entries(countDiffs)) {
    const tpe = k as K
    const diffTotals = v as ListenerTotals

    const currCount = counts[tpe]
    currCount.capture = currCount.capture + diffTotals.capture
    currCount.regular = currCount.regular + diffTotals.regular

    // if currCount is now zero, and diff is negative, we no longer have any
    // listeners of that type
    if (currCount.capture === 0) {
      if (diffTotals.capture < 0) {
        updateListenerChangeMap(toRemove, tpe, true)
      }
    } else if (currCount.capture > 0) {
      if (diffTotals.capture === currCount.capture) {
        updateListenerChangeMap(toAdd, tpe, true)
      }
    } else {
      throw new Error(
        'EventListener counts out of sync (this indicates a ctrl-fx framework bug)',
      )
    }

    // repeat for regular listeners
    if (currCount.regular === 0) {
      if (diffTotals.regular < 0) {
        updateListenerChangeMap(toRemove, tpe, false)
      }
    } else if (currCount.regular > 0) {
      if (diffTotals.regular === currCount.regular) {
        updateListenerChangeMap(toAdd, tpe, false)
      }
    } else {
      throw new Error(
        'EventListener counts out of sync (this indicates a ctrl-fx framework bug)',
      )
    }
  }

  return { toRemove, toAdd, allNewEvents }
}

type ListenerAndNode = {
  readonly listener:
    | EventListener<unknown, unknown>
    | ContainerListener<unknown, unknown>
  readonly owningNode: InternalElementNode | ComponentNode | ViewNode
}

abstract class EventManagerDelegate {
  protected window: RealWindow

  protected runEffect: (
    effect: Effect<unknown, unknown, EventListenerResult>,
    node: InternalElementNode | ComponentNode | ViewNode,
    onResult: (result: EventListenerResult) => void,
  ) => void

  constructor(
    window: RealWindow,
    runEffect: (
      effect: Effect<unknown, unknown, EventListenerResult>,
      node: InternalElementNode | ComponentNode | ViewNode,
      onResult: (result: EventListenerResult) => void,
    ) => void,
  ) {
    this.window = window
    this.runEffect = runEffect
  }

  protected runListeners(
    ev: RealEvent,
    listeners: readonly ListenerAndNode[],
  ): void {
    if (listeners.length) {
      const listener = listeners[0]
      if (
        toNativeEventType(listener.listener._type) === ev.type.toLowerCase() &&
        (ev.eventPhase !== 1 || listener.listener.options.capture)
      ) {
        this.runListener(listener, ev, keepGoing => {
          if (keepGoing) {
            this.runListeners(ev, listeners.slice(1))
          } else {
            return
          }
        })
      } else {
        this.runListeners(ev, listeners.slice(1))
      }
    } else {
      return
    }
  }

  private runListener(
    listenerAndNode: ListenerAndNode,
    ev: RealEvent,
    onComplete: (keepGoing: boolean) => void,
  ): void {
    let effect: Effect<unknown, unknown, EventListenerResult>

    const listener = listenerAndNode.listener
    switch (listener._type) {
      case 'focus':
      case 'blur': {
        effect = listener.effect
        break
      }

      case 'change': {
        let value = ''
        let checked = false
        if (ev.target && 'tagName' in ev.target) {
          switch (ev.target.tagName) {
            case 'INPUT': {
              value = ev.target.value
              checked = ev.target.checked
              break
            }
            case 'SELECT':
            case 'TEXTAREA': {
              value = ev.target.value
              break
            }
          }
        }
        const changeData: ChangeData = { value, checked }
        effect = listener.effect(changeData)
        break
      }

      case 'click':
      case 'dblclick':
      case 'mouseenter':
      case 'mouseleave':
      case 'submit': {
        effect = listener.effect
        break
      }

      case 'mousemove': {
        assertMouseMoveEvent(ev)
        const mouseMoveData: MouseMoveData = {
          clientX: ev.clientX,
          clientY: ev.clientY,
          pageX: ev.pageX,
          pageY: ev.pageY,
          movementX: ev.movementX,
          movementY: ev.movementY,
        }
        effect = listener.effect(mouseMoveData)
        break
      }

      case 'wheel': {
        assertWheelEvent(ev)
        const wheelData: WheelData = {
          deltaX: ev.deltaX,
          deltaY: ev.deltaY,
          deltaZ: ev.deltaZ,
          deltaMode: ev.deltaMode,
        }
        effect = listener.effect(wheelData)
        break
      }

      case 'scroll':
      case 'scrollend': {
        const owningNode = listenerAndNode.owningNode
        const scrollData: ScrollData =
          owningNode._type === 'InternalElementNode'
            ? {
                scrollTop: owningNode.realNode.scrollTop,
                scrollLeft: owningNode.realNode.scrollLeft,
              }
            : { scrollTop: 0, scrollLeft: 0 }
        effect = listener.effect(scrollData)
        break
      }

      //console.log(ev.target && 'tagName' in ev.target && ev.target.tagName === 'INPUT')
      case 'textinput': {
        let textState: TextState
        if (ev.target && 'tagName' in ev.target) {
          switch (ev.target.tagName) {
            case 'INPUT':
            case 'TEXTAREA': {
              textState = {
                value: ev.target.value,
                selectionStart: ev.target.selectionStart,
                selectionEnd: ev.target.selectionEnd,
              }
              break
            }
            case 'DIV': {
              textState = {
                value: ev.target.innerText,
                selectionStart: 0,
                selectionEnd: 0,
              }
              break
            }
            default: {
              textState = {
                value: '',
                selectionStart: 0,
                selectionEnd: 0,
              }
            }
          }
        } else {
          textState = {
            value: '',
            selectionStart: 0,
            selectionEnd: 0,
          }
        }
        effect = listener.effect(textState)
        break
      }

      case 'touchmove':
      case 'touchstart':
      case 'touchend':
      case 'touchcancel': {
        assertTouchEvent(ev)
        const touchData: TouchData[] = []
        for (let i = 0; i < ev.touches.length; i++) {
          touchData.push({
            clientX: ev.touches[i].clientX,
            clientY: ev.touches[i].clientY,
            pageX: ev.touches[i].pageX,
            pageY: ev.touches[i].pageY,
          })
        }
        effect = listener.effect(touchData)
        break
      }

      case 'keydown':
      case 'keyup': {
        assertKeyEvent(ev)
        const keyData = { key: ev.key, code: ev.code }
        effect = listener.effect(keyData)
        break
      }

      case 'resize': {
        const dimensions = {
          width: this.window.innerWidth,
          height: this.window.innerHeight,
        }
        effect = listener.onChange(dimensions)
        break
      }

      case 'popstate':
      case 'locationchange': {
        const loc = internalLocationFromLocation(currentLocation(this.window))
        effect = listener.onChange(loc)
        break
      }

      case 'visibilitychange': {
        const state = this.window.document.visibilityState
        effect = listener.onChange(state)
        break
      }

      case 'online':
      case 'offline': {
        effect = listener.effect
        break
      }

      case 'custom': {
        effect = listener.effect((ev as unknown as CustomEvent).detail)
        break
      }

      default:
        exhaustivenessCheck(listener)
    }

    this.runEffect(effect, listenerAndNode.owningNode, result => {
      if (result !== undefined) {
        if (result.preventDefault) {
          ev.preventDefault()
        }
        if (result.stopPropagation) {
          ev.stopImmediatePropagation()
          onComplete(false)
        } else {
          onComplete(true)
        }
      } else {
        onComplete(true)
      }
    })
  }
}

function assertMouseMoveEvent(event: RealEvent): asserts event is RealMouseMoveEvent {
  if (!('clientX' in event)) {
    throw new Error('Event is not a mousemove event')
  }
}

function assertWheelEvent(event: RealEvent): asserts event is RealWheelEvent {
  if (!('deltaX' in event)) {
    throw new Error('Event is not a wheel event')
  }
}

function assertTouchEvent(event: RealEvent): asserts event is RealTouchEvent {
  if (!(event.type.toLowerCase().startsWith('touch') && 'touches' in event)) {
    throw new Error('Event is not a touch event')
  }
}

function assertKeyEvent(event: RealEvent): asserts event is RealKeyboardEvent {
  if (
    !(
      event.type.toLowerCase().startsWith('key') &&
      'key' in event &&
      'code' in event
    )
  ) {
    throw new Error('Event is not a key event')
  }
}

type ViewOrComponent = ViewNode | ComponentNode

class ContainerEventManagerDelegate extends EventManagerDelegate {
  private nodeLookupByEvent: Record<ContainerEventType, Set<ViewOrComponent>> =
    makeEventTypeKeyedRecord(
      containerEventTypes,
      () => new Set<ViewOrComponent>(),
    )

  private eventListeners: Map<
    ViewOrComponent,
    readonly ContainerListener<unknown, unknown>[]
  > = new Map()

  private windowEventListener = (event: RealEvent) => {
    this.onEvent(event)
  }

  private windowCaptureEventListener = (event: RealEvent) => {
    this.onEvent(event)
  }

  private documentEventListener = (event: RealEvent) => {
    this.onEvent(event)
  }

  private documentCaptureEventListener = (event: RealEvent) => {
    this.onEvent(event)
  }

  protected counts: ListenerCounts<ContainerEventType>

  constructor(
    window: RealWindow,
    runEffect: (
      effect: Effect<unknown, unknown, EventListenerResult>,
      node: InternalElementNode | ComponentNode | ViewNode,
      onResult: (result: EventListenerResult) => void,
    ) => void,
  ) {
    super(window, runEffect)
    this.counts = makeListenerCounts(containerEventTypes)
  }

  private onEvent(event: RealEvent) {
    const eventType = event.type as ContainerEventType

    const nodeSet = this.nodeLookupByEvent[eventType]
    if (!nodeSet) {
      return
    }

    const listenersToRun: ListenerAndNode[] = []
    for (const node of nodeSet) {
      const listeners = this.eventListeners.get(node)
      if (listeners) {
        listeners.forEach(listener => {
          if (
            listener._type === eventType &&
            (event.eventPhase !== 1 || listener.options.capture)
          ) {
            listenersToRun.push({ listener, owningNode: node })
          }
        })
      }
    }
    this.runListeners(event, listenersToRun)

    if (eventType === 'popstate') {
      this.window.dispatchEvent(new Event('locationchange'))
    }
  }

  setContainerListeners(node: ViewOrComponent): void {
    if (node.containerListeners.length === 0) {
      this.removeContainerListeners(node)
      return
    }

    const existingListeners = this.eventListeners.get(node)

    const passive = node.containerListeners.reduce(
      (acc, listener) => acc && (listener.options.passive ? true : false),
      true,
    )

    const adjustments = adjustCountsAndGetListenerTypesToRemoveAndAdd(
      this.counts,
      existingListeners || [],
      node.containerListeners,
    )

    containerEventTypes.forEach(ev => {
      if (adjustments.allNewEvents.has(ev)) {
        this.nodeLookupByEvent[ev].add(node)
      } else {
        this.nodeLookupByEvent[ev].delete(node)
      }
    })

    if (node.containerListeners.length > 0) {
      this.eventListeners.set(node, [...node.containerListeners])
    } else {
      this.eventListeners.delete(node)
    }

    this.processAdjustments(adjustments, passive)
  }

  private processAdjustments(
    adjustments: {
      toRemove: Map<ContainerEventType, { regular: boolean; capture: boolean }>
      toAdd: Map<ContainerEventType, { regular: boolean; capture: boolean }>
    },
    passive: boolean,
  ): void {
    for (const [ev, changes] of adjustments.toAdd) {
      switch (ev) {
        case 'resize':
        case 'popstate':
        case 'locationchange':
        case 'online':
        case 'offline': {
          if (changes.capture) {
            this.window.addEventListener(ev, this.windowCaptureEventListener, {
              capture: true,
              passive,
            })
          }
          if (changes.regular) {
            this.window.addEventListener(ev, this.windowEventListener, {
              capture: false,
              passive,
            })
          }
          break
        }
        case 'keydown':
        case 'keyup':
        case 'visibilitychange': {
          if (changes.capture) {
            this.window.document.addEventListener(
              ev,
              this.documentCaptureEventListener,
              { capture: true, passive },
            )
          }
          if (changes.regular) {
            this.window.document.addEventListener(
              ev,
              this.documentEventListener,
              { capture: false, passive },
            )
          }
          break
        }
        default: {
          exhaustivenessCheck(ev)
        }
      }
    }
  }

  private removeContainerListeners(node: ViewOrComponent): void {
    const existingListeners = this.eventListeners.get(node)
    if (!existingListeners) {
      return
    }

    const adjustments = adjustCountsAndGetListenerTypesToRemoveAndAdd(
      this.counts,
      existingListeners,
      [],
    )

    this.processAdjustments(adjustments, false)
    // there should be no "adds", so we don't really care about  the value of
    // passive

    existingListeners.forEach(listener => {
      this.nodeLookupByEvent[listener._type].delete(node)
    })

    this.eventListeners.delete(node)
  }
}

class ElementEventManagerDelegate extends EventManagerDelegate {
  private listeners: Map<
    InternalElementNode,
    {
      counts: ListenerCounts<EventType>
      listeners: readonly Exclude<EventListener<unknown, unknown>, CustomEventListener<unknown, unknown>>[]
      realListener(event: RealEvent): void
    }
  > = new Map()

  private customHandlers: Map<
    InternalElementNode,
    Map<string, { listeners: CustomEventListener<unknown, unknown>[]; realListener: (ev: RealEvent) => void }>
  > = new Map()

  constructor(
    window: RealWindow,
    runEffect: (
      effect: Effect<unknown, unknown, EventListenerResult>,
      node: InternalElementNode | ComponentNode | ViewNode,
      onResult: (result: EventListenerResult) => void,
    ) => void,
  ) {
    super(window, runEffect)
  }

  setElementListeners(node: InternalElementNode): void {
    const standardListeners = node.eventListeners.filter(
      (l): l is Exclude<EventListener<unknown, unknown>, CustomEventListener<unknown, unknown>> =>
        l._type !== 'custom',
    )
    const customListeners = node.eventListeners.filter(
      (l): l is CustomEventListener<unknown, unknown> => l._type === 'custom',
    )

    this.updateCustomListeners(node, customListeners)

    if (standardListeners.length === 0) {
      this.removeStandardListeners(node)
      return
    }

    let listenerInfo = this.listeners.get(node)
    if (!listenerInfo) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this

      listenerInfo = {
        counts: makeListenerCounts(eventTypes),
        listeners: [],
        realListener(event: RealEvent) {
          const listeners = that.listeners.get(node)?.listeners
          if (listeners) {
            that.runListeners(
              event,
              listeners.map(listener => ({
                listener,
                owningNode: node,
              })),
            )
          }
        },
      }
      this.listeners.set(node, listenerInfo)
    }

    const passive = standardListeners.reduce(
      (acc, listener) => acc && (listener.options.passive ? true : false),
      true,
    )

    const adjustments = adjustCountsAndGetListenerTypesToRemoveAndAdd(
      listenerInfo.counts,
      listenerInfo.listeners,
      standardListeners,
    )

    listenerInfo.listeners = [...standardListeners]

    for (const [tpe, info] of adjustments.toAdd) {
      const domType = toNativeEventType(tpe)
      if (info.regular) {
        node.realNode.addEventListener(domType, listenerInfo.realListener, {
          capture: false,
          passive,
        })
      }
      if (info.capture) {
        node.realNode.addEventListener(domType, listenerInfo.realListener, {
          capture: true,
          passive,
        })
      }
    }

    for (const [tpe, info] of adjustments.toRemove) {
      const domType = toNativeEventType(tpe)
      if (info.regular) {
        node.realNode.removeEventListener(domType, listenerInfo.realListener, false)
      }
      if (info.capture) {
        node.realNode.removeEventListener(domType, listenerInfo.realListener, true)
      }
    }
  }

  private updateCustomListeners(
    node: InternalElementNode,
    customListeners: CustomEventListener<unknown, unknown>[],
  ): void {
    const existingHandlers = this.customHandlers.get(node) ?? new Map()

    const byName = new Map<string, CustomEventListener<unknown, unknown>[]>()
    for (const l of customListeners) {
      const arr = byName.get(l.eventName) ?? []
      arr.push(l)
      byName.set(l.eventName, arr)
    }

    for (const [name, { realListener }] of existingHandlers) {
      if (!byName.has(name)) {
        node.realNode.removeEventListener(name, realListener, false)
        existingHandlers.delete(name)
      }
    }

    for (const [name, listeners] of byName) {
      const existing = existingHandlers.get(name)
      if (existing) {
        existing.listeners = listeners
      } else {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this
        const info: {
          listeners: CustomEventListener<unknown, unknown>[]
          realListener: (ev: RealEvent) => void
        } = { listeners, realListener: null! }
        info.realListener = (ev: RealEvent) => {
          const detail = (ev as unknown as CustomEvent).detail
          for (const l of info.listeners) {
            that.runEffect(l.effect(detail), node, result => {
              if (result?.stopPropagation) ev.stopImmediatePropagation()
              if (result?.preventDefault) ev.preventDefault()
            })
          }
        }
        existingHandlers.set(name, info)
        node.realNode.addEventListener(name, info.realListener, {
          capture: false,
          passive: false,
        })
      }
    }

    if (existingHandlers.size > 0) {
      this.customHandlers.set(node, existingHandlers)
    } else {
      this.customHandlers.delete(node)
    }
  }

  private removeStandardListeners(node: InternalElementNode): void {
    const listenerInfo = this.listeners.get(node)
    if (!listenerInfo) {
      return
    }

    for (const [eventType, info] of Object.entries(listenerInfo.counts)) {
      const domType = toNativeEventType(eventType)
      if (info.regular) {
        node.realNode.removeEventListener(
          domType,
          listenerInfo.realListener,
          false,
        )
      }
      if (info.capture) {
        node.realNode.removeEventListener(
          domType,
          listenerInfo.realListener,
          true,
        )
      }
    }

    this.listeners.delete(node)
  }

}

export class EventManager {
  private containerDelegate: ContainerEventManagerDelegate
  private elementDelegate: ElementEventManagerDelegate

  constructor(
    window: RealWindow,
    runEffect: (
      effect: Effect<unknown, unknown, EventListenerResult>,
      node: InternalElementNode | ComponentNode | ViewNode,
      onResult: (result: EventListenerResult) => void,
    ) => void,
  ) {
    this.containerDelegate = new ContainerEventManagerDelegate(
      window,
      runEffect,
    )
    this.elementDelegate = new ElementEventManagerDelegate(window, runEffect)
  }

  setContainerListeners(node: ComponentNode | ViewNode): void {
    this.containerDelegate.setContainerListeners(node)
  }

  setElementListeners(node: InternalElementNode): void {
    this.elementDelegate.setElementListeners(node)
  }
}
