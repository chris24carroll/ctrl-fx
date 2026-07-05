import { toComponent } from '.'
import { type NonEmptyArray } from './utils'
import { type Attr } from './dom/attrs'
import type { Node } from './dom'
import type { Component } from './dom/components'
import { type NodeGroup } from './dom/views'
import { type Effect, type ScrollOptions } from './effects'
import { testComponent as internalTestcomponent } from './internal'
import {
  type HttpError,
  type HttpRequest,
  type HttpResponse,
  type RequestError,
} from './net'
import { type Result } from './utils/result'
import { TestDatabaseData } from './db/testdb'
import type { DbStoreSnapshot } from './db/testdb'
import type { InternalLocation } from './net/location'

export { TestDatabaseData }
export type { DbStoreSnapshot }
export type { InternalLocation }

export type { HttpRequest, HttpResponse, HttpError, RequestError }

export type DownloadRecord = {
  readonly filename: string
  readonly content: string
  readonly contentType: string
}

export type BroadcastSentRecord = {
  readonly channel: string
  readonly message: unknown
}

export type SetAppBadge = { _type: 'SetAppBadge'; count: number }
export type ClearAppBadge = { _type: 'ClearAppBadge' }

export type AppBadgeOperation = SetAppBadge | ClearAppBadge

export const clearAppBadge: ClearAppBadge = {
  _type: 'ClearAppBadge',
}

export function setAppBadge(count: number): SetAppBadge {
  return { _type: 'SetAppBadge', count }
}

export function appBadgeCount(
  operations: readonly AppBadgeOperation[],
): number {
  if (operations.length > 0) {
    const op = operations[operations.length - 1]
    switch (op._type) {
      case 'ClearAppBadge':
        return 0
      case 'SetAppBadge':
        return op.count
    }
  } else {
    return 0
  }
}

export type HttpInteraction = {
  readonly request: HttpRequest
  readonly response: Result<HttpResponse, RequestError | HttpError>
}

export type HttpHandler = (
  request: HttpRequest,
  prior: readonly HttpInteraction[],
) => Result<HttpResponse, RequestError | HttpError>

/** Configuration passed to `testApplication`/`testComponent` to control how side effects behave during tests. */
export type TestConfig = {
  readonly http: {
    /** Called for each HTTP request. Throw or return a failure Result to simulate errors. */
    readonly handler: HttpHandler
  }
  readonly clock: {
    /** Scripted return values for `getTime()`, consumed in order. When exhausted, returns `new Date(0)`. */
    readonly values: readonly Date[]
  }
  readonly random: {
    /** Scripted return values for `getRandom()`, consumed in order. When exhausted, uses a deterministic seeded PRNG. */
    readonly values: readonly number[]
  }
}

/** Creates a TestConfig that throws on any HTTP request. */
export function defaultTestConfig(): TestConfig {
  return {
    http: {
      handler: (_request, _prior) => {
        throw new Error('No HTTP handler configured in TestConfig.')
      },
    },
    clock: {
      values: [],
    },
    random: {
      values: [],
    },
  }
}

export type ConfirmInteraction = { message: string; response: boolean }
export type PromptInteraction = {
  message: string
  default: string | undefined
  response: string | null
}

/** Snapshot of every observable side effect that occurred during a test run. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TestData<Custom = {}> = {
  readonly window: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly alerts: readonly any[]
    readonly confirms: readonly ConfirmInteraction[]
    readonly confirmResponses: readonly boolean[]
    readonly prompts: readonly PromptInteraction[]
    readonly promptResponses: readonly (string | null)[]
  }
  readonly navigator: {
    readonly appBadgeOperations: readonly AppBadgeOperation[]
  }
  readonly clipboard: {
    readonly content: string
    readonly writes: readonly string[]
  }
  readonly document: {
    readonly title: string | null
  }
  readonly http: {
    readonly interactions: readonly HttpInteraction[]
  }
  readonly clock: {
    /** Values returned by each `getTime()` call, in order. */
    readonly calls: readonly Date[]
  }
  readonly random: {
    /** Values returned by each `getRandom()` call, in order. */
    readonly calls: readonly number[]
  }
  readonly console: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly logs: readonly any[]
  }
  readonly db: TestDatabaseData
  readonly storage: {
    readonly local: ReadonlyMap<string, string>
    readonly session: ReadonlyMap<string, string>
  }
  readonly navigation: {
    readonly locationHistory: readonly InternalLocation[]
  }
  readonly scroll: {
    readonly windowScrolls: readonly ScrollOptions[]
    readonly elementScrolls: readonly {
      selector: string
      options: ScrollOptions
    }[]
  }
  readonly downloads: readonly DownloadRecord[]
  readonly broadcasts: {
    readonly sent: readonly BroadcastSentRecord[]
  }
  readonly custom: Custom
}

/** Creates an empty TestData, optionally initialising the `custom` field. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function newTestData<Custom = {}>(custom?: Custom): TestData<Custom> {
  return {
    window: {
      alerts: [],
      confirms: [],
      confirmResponses: [],
      prompts: [],
      promptResponses: [],
    },
    navigator: {
      appBadgeOperations: [],
    },
    clipboard: {
      content: '',
      writes: [],
    },
    document: {
      title: null,
    },
    http: {
      interactions: [],
    },
    clock: {
      calls: [],
    },
    random: {
      calls: [],
    },
    console: {
      logs: [],
    },
    db: new TestDatabaseData(new Map()),
    storage: {
      local: new Map(),
      session: new Map(),
    },
    navigation: {
      locationHistory: [],
    },
    scroll: {
      windowScrolls: [],
      elementScrolls: [],
    },
    downloads: [],
    broadcasts: {
      sent: [],
    },
    custom: (custom ?? {}) as Custom,
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TestInput<State, Params, Custom = {}> = {
  state?: State
  params?: Params
  testData?: TestData<Custom>
}

export type Click = {
  type: 'Click'
  selector: QuerySelector
}

/** Simulates a click on the element(s) matching `selector`. */
export function click(selector: QuerySelector): Click {
  return {
    type: 'Click',
    selector,
  }
}

export type AdvanceTime = {
  _type: 'AdvanceTime'
  milliseconds: number
}

/** Advances the test scheduler clock by `milliseconds`, firing any scheduled tasks that come due. */
export function advanceTime(milliseconds: number): AdvanceTime {
  return {
    _type: 'AdvanceTime',
    milliseconds,
  }
}

export type ReceiveBroadcast = {
  _type: 'ReceiveBroadcast'
  channel: string
  message: unknown
}

/** Delivers a BroadcastChannel message to any active subscriber on `channel`. */
export function receiveBroadcast(
  channel: string,
  message: unknown,
): ReceiveBroadcast {
  return { _type: 'ReceiveBroadcast', channel, message }
}

export type FireCustomEvent = {
  _type: 'FireCustomEvent'
  selector: QuerySelector
  eventName: string
  detail: unknown
}

/** Dispatches a custom DOM event on the element matching `selector`, invoking any `onEvent` handler. */
export function fireCustomEvent(
  selector: QuerySelector,
  eventName: string,
  detail?: unknown,
): FireCustomEvent {
  return { _type: 'FireCustomEvent', selector, eventName, detail }
}

export type Submit = {
  _type: 'Submit'
  selector: QuerySelector
}

/** Simulates a form submit event on the element(s) matching `selector`. */
export function submit(selector: QuerySelector): Submit {
  return { _type: 'Submit', selector }
}

export type TextInput = {
  _type: 'TextInput'
  selector: QuerySelector
  value: string
}

/** Simulates an `input` event on the element(s) matching `selector`. */
export function textInput(selector: QuerySelector, value: string): TextInput {
  return { _type: 'TextInput', selector, value }
}

/** Creates an attribute object `{ name, value }` for use with `findOne(...).attrs.toContainEqual(attr(...))`. */
export function attr(name: string, value: string): { name: string; value: string } {
  return { name, value }
}

export type Interaction =
  | Click
  | AdvanceTime
  | ReceiveBroadcast
  | FireCustomEvent
  | Submit
  | TextInput

export type { NonEmptyArray }

export type DomElement = {
  readonly tag: string
  readonly attrs: readonly Attr[]
  readonly childNodes: readonly DomNode[]
}

export type DomNode = DomElement | string

export type TestableDom = {
  head: DomElement
  body: DomElement
}

/**
 * The result of mounting a component for testing. Supports running interactions
 * and querying the virtual DOM. Each call to `run` returns a new
 * `TestableComponent` reflecting the state after those interactions, so tests
 * can chain calls to build up complex scenarios step by step.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TestableComponent<State, Params, Event, Custom = {}> = {
  readonly config: TestConfig

  readonly state: State

  readonly data: TestData<Custom>

  /** Returns a copy with the given TestConfig. */
  withConfig(
    config: TestConfig,
  ): TestableComponent<State, Params, Event, Custom>

  /** Returns a copy with the given TestData as the starting data. */
  withData(
    data: TestData<Custom>,
  ): TestableComponent<State, Params, Event, Custom>

  readonly dom: TestableDom

  /**
   * Applies one or more interactions in order and returns a new
   * `TestableComponent` reflecting the resulting state and DOM. The original
   * instance is unchanged, so you can branch from the same starting point to
   * test different sequences.
   */
  run(
    ...interactions: Interaction[]
  ): TestableComponent<State, Params, Event, Custom>

  /** Returns all elements matching `selector`. */
  find(selector: string): readonly DomElement[]
  /** Returns the single element matching `selector`. Throws if not exactly one match. */
  findOne(selector: string): DomElement
  /** Returns all elements matching `selector`. Throws if no match. */
  findOneOrMore(selector: string): NonEmptyArray<DomElement>
  /** Returns the element matching `selector`, or undefined. */
  findMaybeOne(selector: string): DomElement | undefined
}

/**
 * Creates a testable wrapper around a `Component`. Use this when testing a
 * component that was created with `component()`. For testing a top-level view
 * function directly, use `testApplication` instead.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function testComponent<State, Params, Event, Custom = {}>(
  component: Component<State, Params, Event>,
  config?: TestConfig,
  data?: TestData<Custom>,
): TestableComponent<State, Params, Event, Custom> {
  return internalTestcomponent(component, config, data)
}

/**
 * The main entry point for testing a ctrl-fx application. Wraps a view
 * function and initial state into a `TestableComponent`. Call `.run(...)`
 * with interactions to simulate user actions, then inspect `.state`, `.data`,
 * and the `findOne`/`find` DOM query methods on the result.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function testApplication<State, Custom = {}>(
  app: (state: State) => NodeGroup<State, never> | Node<State, never>,
  initialState: State | Effect<State, never, State>,
  config?: TestConfig,
  data?: TestData<Custom>,
): TestableComponent<State, void, never, Custom> {
  const component = toComponent(app, initialState)
  return testComponent(component, config, data)
}

export type ExactlyOne = {
  _type: 'ExactlyOne'
  selector: string
}

export type ZeroOrMore = {
  _type: 'ZeroOrMore'
  selector: string
}

export type ZeroOrOne = {
  _type: 'ZeroOrOne'
  selector: string
}

export type OneOrMore = {
  _type: 'OneOrMore'
  selector: string
}

/** Selects elements matching `selector`; throws during `run` if none are found. */
export function one(selector: string): OneOrMore {
  return {
    _type: 'OneOrMore',
    selector,
  }
}

export type QuerySelector = ExactlyOne | OneOrMore | ZeroOrMore | ZeroOrOne
