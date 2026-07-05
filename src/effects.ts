import type { ClipboardError } from './clipboard'
import type { ScrollElementError } from './scroll'
import type { DbEffect } from './db/effects'
import type { DbSetupEffect } from './db/setup'
import type { DbError } from './db/errors'
import type { DbName, DbVersion, ObjectStore } from './db/index'
import {
  getJson,
  type HttpError,
  type HttpRequest,
  type HttpResponse,
  type RequestError,
} from './net'
import { parseInternalLocation, type InternalLocation } from './net/location'
import { type Lens } from './utils/lens'
import { failure, success, type Result } from './utils/result'
import type { Permission, Uuid } from '.'

export type { ClipboardError } from './clipboard'
export type { ScrollElementError } from './scroll'
export type { DbEffect } from './db/effects'
export type { DbSetupEffect } from './db/setup'
export type {
  DbError,
  UnexpectedError,
  NotFoundError,
  ConstraintError,
} from './db/errors'
export type { DbName, DbVersion, ObjectStore } from './db/index'
export type {
  HttpError,
  HttpRequest,
  HttpResponse,
  RequestError,
  Json,
  DecodingError,
  Method,
  Headers,
  ResponseBody,
} from './net'
export type { InternalLocation } from './net/location'
export type { Path } from './net/path'
export type { QueryParam } from './net/queryparam'
export type { Fragment } from './net/fragment'
export type { Lens } from './utils/lens'
export type { Result } from './utils/result'

type Alert = {
  _type: 'Alert'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any
}

type Async<State, Event> = {
  _type: 'Async'
  input: { effect: Effect<State, Event, void>; delayInMillis: number }
}

type CancelTask = {
  _type: 'CancelTask'
  input: TaskId
}

type ClearAppBadge = {
  _type: 'ClearAppBadge'
  input: void
}

type ReadClipboard = {
  _type: 'ReadClipboard'
  input: void
}

type WriteClipboard = {
  _type: 'WriteClipboard'
  input: string
}

type SetAppBadge = {
  _type: 'SetAppBadge'
  input: number
}

type SetDocumentTitle = {
  _type: 'SetDocumentTitle'
  input: string
}

type Confirm = {
  _type: 'Confirm'
  input: string
}

type FireEvent<Event> = {
  _type: 'FireEvent'
  input: Event
}

type GenerateUuid = {
  _type: 'GenerateUuid'
  input: void
}

type GetNotificationPermission = {
  _type: 'GetNotificationPermission'
  input: void
}

type RequestNotificationPermission = {
  _type: 'RequestNotificationPermission'
  input: void
}

type GetLocation = {
  _type: 'GetLocation'
  input: void
}

type GetState = {
  _type: 'GetState'
  input: void
}

type GetTime = {
  _type: 'GetTime'
  input: void
}

type GetRandom = {
  _type: 'GetRandom'
  input: void
}

type Prompt = {
  _type: 'Prompt'
  input: { message: string; default: string | undefined }
}

type Log = {
  _type: 'Log'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any
}

type MakeHttpRequest = {
  _type: 'MakeHttpRequest'
  input: HttpRequest
}

type OpenDatabase = {
  _type: 'OpenDatabase'
  input: {
    db: DbName
    version: DbVersion
    setup: (oldVersion: DbVersion) => DbSetupEffect<void>
  }
}

type RunDbTransaction = {
  _type: 'RunDbTransaction'
  input: {
    db: DbName
    objectStores: readonly ObjectStore[]
    mode: 'readonly' | 'readwrite'
    effect: DbEffect<void>
  }
}

type Product<State, Event, A, B> = {
  _type: 'Product'
  input: [Effect<State, Event, A>, Effect<State, Event, B>]
}

/** A branded string that uniquely identifies a scheduled task. */
export type TaskId = string & { __brand: 'TaskId' }

/** Creates a typed TaskId from a plain string. */
export function taskId(id: string): TaskId {
  return id as TaskId
}

type ScheduleTask<State, Event> = {
  _type: 'ScheduleTask'
  input: {
    task: Effect<State, Event, void>
    initialDelayInMillis: number
    repeatIntervalInMillis: number | undefined
    taskId: TaskId | undefined
  }
}

type SetTimeout = {
  _type: 'SetTimeout'
  input: number
}

type UpdateState<State> = {
  _type: 'UpdateState'
  input: (state: State) => State
}

export type StorageTarget = 'local' | 'session'

type GetStorageItem = {
  _type: 'GetStorageItem'
  input: { storage: StorageTarget; key: string }
}

type Go = {
  _type: 'Go'
  input: number
}

type PushState = {
  _type: 'PushState'
  input: InternalLocation
}

type ReplaceState = {
  _type: 'ReplaceState'
  input: InternalLocation
}

type SetStorageItem = {
  _type: 'SetStorageItem'
  input: { storage: StorageTarget; key: string; value: string }
}

type RemoveStorageItem = {
  _type: 'RemoveStorageItem'
  input: { storage: StorageTarget; key: string }
}

type ClearStorage = {
  _type: 'ClearStorage'
  input: { storage: StorageTarget }
}

export type ScrollOptions = {
  top?: number
  left?: number
  behavior?: 'smooth' | 'instant' | 'auto'
}

type ScrollWindow = {
  _type: 'ScrollWindow'
  input: ScrollOptions
}

type ScrollElement = {
  _type: 'ScrollElement'
  input: { selector: string; options: ScrollOptions }
}

export type DownloadInput = {
  filename: string
  content: string
  contentType: string
}

type Download = {
  _type: 'Download'
  input: DownloadInput
}

type PostBroadcastMessage = {
  _type: 'PostBroadcastMessage'
  input: { channel: string; message: unknown }
}

type SubscribeToBroadcastChannel<State, Event> = {
  _type: 'SubscribeToBroadcastChannel'
  input: {
    channel: string
    handler: (message: unknown) => Effect<State, Event, void>
    taskId: TaskId | undefined
  }
}

type CustomEffect<In, Out, Custom> = {
  _type: 'CustomEffect'
  input: {
    args: In
    f: (args: In) => Out | Promise<Out>
    test: (args: In, data: Custom) => { out: Out; data: Custom }
  }
}

/**
 * Creates a factory for effects that call an external library function.
 * Use this when you want to call a library whose logic would be too cumbersome
 * to reimplement using built-in effects. In production `f` is called directly.
 * In tests the `test` callback receives the arguments and a queue of scripted
 * return values (`data`), and must return `{ out, data }` where `data` is the
 * remaining queue after consuming one entry.
 *
 * @param f Production implementation. May return a Promise.
 * @param test Test-time implementation. Receives the scripted data queue and
 *   returns `{ out, data }` — `out` is the value to return, `data` is the
 *   remaining queue. Provide scripted values via `newTestData(queue)`.
 */
export function customEffect<State, Event, In, Out, Custom>(
  f: (args: In) => Out | Promise<Out>,
  test: (args: In, data: Custom) => { out: Out; data: Custom },
): (args: In) => Effect<State, Event, Out> {
  return (args: In) => ({
    _type: 'Suspend',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operation: { _type: 'CustomEffect', input: { args, f, test } } as any,
    flatMap<B>(
      fn: (out: Out) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, fn)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(fn: (out: Out) => B): Effect<State, Event, B> {
      return flatMap(this, out => pure(fn(out)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, _ => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_out => {})
    },
    apply<B>(fn: (effect: Effect<State, Event, Out>) => B): B {
      return fn(this)
    },
  })
}

type Operation<State, Event> =
  | Alert
  | Async<State, Event>
  | CancelTask
  | ClearAppBadge
  | ClearStorage
  | Confirm
  | CustomEffect<unknown, unknown, unknown>
  | Download
  | FireEvent<Event>
  | GetLocation
  | GetNotificationPermission
  | RequestNotificationPermission
  | PostBroadcastMessage
  | ReadClipboard
  | WriteClipboard
  | GenerateUuid
  | GetState
  | GetStorageItem
  | GetTime
  | GetRandom
  | Log
  | MakeHttpRequest
  | Go
  | OpenDatabase
  | Product<State, Event, unknown, unknown>
  | Prompt
  | PushState
  | ReplaceState
  | RemoveStorageItem
  | RunDbTransaction
  | ScheduleTask<State, Event>
  | ScrollElement
  | ScrollWindow
  | SetAppBadge
  | SetDocumentTitle
  | SetStorageItem
  | SetTimeout
  | SubscribeToBroadcastChannel<State, Event>
  | UpdateState<State>

export type Suspend<State, Event, A> = {
  _type: 'Suspend'
  operation: Operation<State, Event>
  /**
   * Sequences this effect with another, passing its result to `f` to produce
   * the next effect. Use this when the second effect depends on the value
   * produced by the first. For independent sequencing use `and`.
   */
  flatMap<B>(f: (a: A) => Effect<State, Event, B>): Effect<State, Event, B>
  /**
   * Sequences this effect and `effect`, discarding this effect's result. Use
   * this when you want both effects to run but the first result is not needed.
   * For result-dependent sequencing use `flatMap`.
   */
  and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B>
  /** Transforms the result of this effect with `f`, without performing any additional effects. */
  map<B>(f: (a: A) => B): Effect<State, Event, B>
  /** Replaces the result of this effect with `b`, discarding the original result. */
  as<B>(b: B): Effect<State, Event, B>
  /** Discards the result, producing `Effect<State, Event, void>`. */
  void(): Effect<State, Event, void>
  /** Passes this effect to `f` and returns the result. Useful for applying a function that takes an effect without breaking a method chain. */
  apply<B>(f: (effect: Effect<State, Event, A>) => B): B
}

export type Return<State, Event, A> = {
  _type: 'Return'
  value: A
  /** @inheritDoc Suspend.flatMap */
  flatMap<B>(f: (a: A) => Effect<State, Event, B>): Effect<State, Event, B>
  /** @inheritDoc Suspend.and */
  and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B>
  /** @inheritDoc Suspend.map */
  map<B>(f: (a: A) => B): Effect<State, Event, B>
  /** @inheritDoc Suspend.as */
  as<B>(b: B): Effect<State, Event, B>
  /** @inheritDoc Suspend.void */
  void(): Effect<State, Event, void>
  /** @inheritDoc Suspend.apply */
  apply<B>(f: (effect: Effect<State, Event, A>) => B): B
}

export type FlatMap<State, Event, A, B> = {
  _type: 'FlatMap'
  effect: Effect<State, Event, A>
  next: (a: A) => Effect<State, Event, B>
  /** @inheritDoc Suspend.flatMap */
  flatMap<C>(f: (b: B) => Effect<State, Event, C>): Effect<State, Event, C>
  /** @inheritDoc Suspend.and */
  and<C>(effect: Effect<State, Event, C>): Effect<State, Event, C>
  /** @inheritDoc Suspend.map */
  map<C>(f: (b: B) => C): Effect<State, Event, C>
  /** @inheritDoc Suspend.as */
  as<C>(c: C): Effect<State, Event, C>
  /** @inheritDoc Suspend.void */
  void(): Effect<State, Event, void>
  /** @inheritDoc Suspend.apply */
  apply<C>(f: (effect: Effect<State, Event, B>) => C): C
}

/**
 * A lazy, pure description of a side effect to be performed by the framework.
 * An Effect is just a data structure — it does nothing until the framework
 * interprets it. This means effects can be composed, transformed, and tested
 * without executing any real side effects.
 *
 * `State` is the application state type the effect can read and update.
 * `Event` is the component event type the effect can fire.
 * `A` is the value the effect produces when it completes.
 */
export type Effect<State, Event, A> =
  | Suspend<State, Event, A>
  | Return<State, Event, A>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | FlatMap<State, Event, any, A>

function flatMap<State, Event, A, B>(
  effect: Effect<State, Event, A>,
  next: (a: A) => Effect<State, Event, B>,
): Effect<State, Event, B> {
  return {
    _type: 'FlatMap',
    effect,
    next,
    flatMap<C>(f: (b: B) => Effect<State, Event, C>): Effect<State, Event, C> {
      return flatMap(this, f)
    },
    and<C>(effect: Effect<State, Event, C>): Effect<State, Event, C> {
      return flatMap(this, _ => effect)
    },
    map<C>(f: (b: B) => C): Effect<State, Event, C> {
      return this.flatMap(b => pure(f(b)))
    },
    as<C>(c: C): Effect<State, Event, C> {
      return this.flatMap(_ => pure(c))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<C>(f: (effect: Effect<State, Event, B>) => C): C {
      return f(this)
    },
  }
}

/**
 * Wraps a plain value in an Effect that completes immediately without performing any operations.
 * Useful as a base case when building effects conditionally, or to lift a
 * computed value into the Effect chain.
 */
export function pure<State, Event, A>(value: A): Effect<State, Event, A> {
  return {
    _type: 'Return',
    value,
    flatMap<B>(f: (a: A) => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (a: A) => B): Effect<State, Event, B> {
      return flatMap(this, a => pure(f(a)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, _ => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, A>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a browser alert dialog. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function alert<State, Event>(message: any): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'Alert',
      input: message,
    },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}
/**
 * An effect describing a browser confirm dialog.
 * @returns true if confirmed
 */
export function confirm<State, Event>(
  message: string,
): Effect<State, Event, boolean> {
  return {
    _type: 'Suspend',
    operation: { _type: 'Confirm', input: message },
    flatMap<B>(
      f: (b: boolean) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (b: boolean) => B): Effect<State, Event, B> {
      return flatMap(this, b => pure(f(b)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, boolean>) => B): B {
      return f(this)
    },
  }
}

/**
 * An effect describing a browser prompt dialog.
 * @returns the entered string, or null if cancelled
 */
export function prompt<State, Event>(
  message: string,
  defaultValue?: string,
): Effect<State, Event, string | null> {
  return {
    _type: 'Suspend',
    operation: { _type: 'Prompt', input: { message, default: defaultValue } },
    flatMap<B>(
      f: (s: string | null) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (s: string | null) => B): Effect<State, Event, B> {
      return flatMap(this, s => pure(f(s)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, string | null>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a clear of the app badge on the browser/OS icon. */
export function clearAppBadge<State, Event>(): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: { _type: 'ClearAppBadge', input: undefined },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a clipboard text read. */
export function readClipboard<State, Event>(): Effect<
  State,
  Event,
  Result<string, ClipboardError>
> {
  return {
    _type: 'Suspend',
    operation: { _type: 'ReadClipboard', input: undefined },
    flatMap<B>(
      f: (result: Result<string, ClipboardError>) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(
      f: (result: Result<string, ClipboardError>) => B,
    ): Effect<State, Event, B> {
      return flatMap(this, result => pure(f(result)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(
      f: (effect: Effect<State, Event, Result<string, ClipboardError>>) => B,
    ): B {
      return f(this)
    },
  }
}

/** An effect describing a clipboard write of `text`. */
export function writeClipboard<State, Event>(
  text: string,
): Effect<State, Event, Result<void, ClipboardError>> {
  return {
    _type: 'Suspend',
    operation: { _type: 'WriteClipboard', input: text },
    flatMap<B>(
      f: (result: Result<void, ClipboardError>) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(
      f: (result: Result<void, ClipboardError>) => B,
    ): Effect<State, Event, B> {
      return flatMap(this, result => pure(f(result)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(
      f: (effect: Effect<State, Event, Result<void, ClipboardError>>) => B,
    ): B {
      return f(this)
    },
  }
}

/** An effect describing a `document.title` update. */
export function setDocumentTitle<State, Event>(
  title: string,
): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: { _type: 'SetDocumentTitle', input: title },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing an app badge count update on the browser/OS icon. */
export function setAppBadge<State, Event>(
  count: number,
): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: { _type: 'SetAppBadge', input: count },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/**
 * An effect describing fire-and-forget async dispatch of `effect`.
 * The chain continues without waiting for `effect` to complete.
 * Use `scheduleTask` instead if you need cancellation or debounce/repeat behaviour.
 */
export function async<State, Event>(
  effect: Effect<State, Event, void>,
  delayInMillis: number = 0,
): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'Async',
      input: { effect, delayInMillis },
    },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, _ => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, _ => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing the cancellation of a previously scheduled task. */
export function cancelTask<State, Event>(
  taskId: TaskId,
): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'CancelTask',
      input: taskId,
    },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/**
 * An effect describing a typed component event to be delivered to any `onEvent` listener
 * registered by the parent that mounted this component. Has no effect when
 * used in a top-level application (which has no parent).
 */
export function fireEvent<State, Event>(
  event: Event,
): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'FireEvent',
      input: event,
    },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a UUID v4 generation. */
export function generateUuid<State, Event>(): Effect<State, Event, Uuid> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'GenerateUuid',
      input: undefined,
    },
    flatMap<B>(
      f: (uuid: Uuid) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (uuid: Uuid) => B): Effect<State, Event, B> {
      return flatMap(this, (uuid: Uuid) => pure(f(uuid)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, Uuid>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a read of the current time. */
export function getTime<State, Event>(): Effect<State, Event, Date> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'GetTime',
      input: undefined,
    },
    flatMap<B>(
      f: (date: Date) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (date: Date) => B): Effect<State, Event, B> {
      return flatMap(this, (date: Date) => pure(f(date)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, Date>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a random number in [0, 1), equivalent to Math.random(). */
export function getRandom<State, Event>(): Effect<State, Event, number> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'GetRandom',
      input: undefined,
    },
    flatMap<B>(
      f: (n: number) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (n: number) => B): Effect<State, Event, B> {
      return flatMap(this, n => pure(f(n)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, number>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a console log of `message`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log<State, Event>(message: any): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'Log',
      input: message,
    },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing an HTTP request. */
export function makeHttpRequest<State, Event>(
  request: HttpRequest,
): Effect<State, Event, Result<HttpResponse, RequestError | HttpError>> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'MakeHttpRequest',
      input: request,
    },
    flatMap<B>(
      f: (
        result: Result<HttpResponse, RequestError | HttpError>,
      ) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(
      f: (result: Result<HttpResponse, RequestError | HttpError>) => B,
    ): Effect<State, Event, B> {
      return flatMap(this, result => pure(f(result)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(
      f: (
        effect: Effect<
          State,
          Event,
          Result<HttpResponse, RequestError | HttpError>
        >,
      ) => B,
    ): B {
      return f(this)
    },
  }
}

/** An effect describing a read of the current browser location. */
export function getLocation<State, Event>(): Effect<
  State,
  Event,
  InternalLocation
> {
  return {
    _type: 'Suspend',
    operation: { _type: 'GetLocation', input: undefined },
    flatMap<B>(
      f: (loc: InternalLocation) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (loc: InternalLocation) => B): Effect<State, Event, B> {
      return flatMap(this, loc => pure(f(loc)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, InternalLocation>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a read of the current notification permission state. */
export function getNotificationPermission<State, Event>(): Effect<
  State,
  Event,
  Permission
> {
  return {
    _type: 'Suspend',
    operation: { _type: 'GetNotificationPermission', input: undefined },
    flatMap<B>(
      f: (p: Permission) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (p: Permission) => B): Effect<State, Event, B> {
      return flatMap(this, p => pure(f(p)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, Permission>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a notification permission request. */
export function requestNotificationPermission<State, Event>(): Effect<
  State,
  Event,
  Permission
> {
  return {
    _type: 'Suspend',
    operation: { _type: 'RequestNotificationPermission', input: undefined },
    flatMap<B>(
      f: (p: Permission) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (p: Permission) => B): Effect<State, Event, B> {
      return flatMap(this, p => pure(f(p)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, Permission>) => B): B {
      return f(this)
    },
  }
}

/**
 * An effect describing a read of the current application state. Because state updates are
 * themselves effects sequenced in order, the value produced reflects all
 * `updateState` effects that appear earlier in the same effect chain.
 */
export function getState<State, Event>(): Effect<State, Event, State> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'GetState',
      input: undefined,
    },
    flatMap<B>(
      f: (state: State) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (state: State) => B): Effect<State, Event, B> {
      return flatMap(this, (state: State) => pure(f(state)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, State>) => B): B {
      return f(this)
    },
  }
}

/**
 * An effect describing two concurrent sub-effects, returning both results as a tuple `[A, B]`.
 * Both effects share the same initial state snapshot; neither sees state
 * changes made by the other. Use `flatMap` instead when the second effect
 * must observe state updates from the first.
 */
export function product<State, Event, A, B>(
  effectA: Effect<State, Event, A>,
  effectB: Effect<State, Event, B>,
): Effect<State, Event, [A, B]> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'Product',
      input: [effectA, effectB],
    },
    flatMap<C>(
      f: (aAndB: [A, B]) => Effect<State, Event, C>,
    ): Effect<State, Event, C> {
      return flatMap(this, f)
    },
    and<C>(effect: Effect<State, Event, C>): Effect<State, Event, C> {
      return flatMap(this, _ => effect)
    },
    map<C>(f: (aAndB: [A, B]) => C): Effect<State, Event, C> {
      return flatMap(this, aAndB => pure(f(aAndB)))
    },
    as<C>(c: C): Effect<State, Event, C> {
      return flatMap(this, _ => pure(c))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<C>(f: (effect: Effect<State, Event, [A, B]>) => C): C {
      return f(this)
    },
  }
}

/**
 * An effect describing the scheduling of `task` to run after `initialDelayInMillis` milliseconds.
 *
 * If `taskId` is provided and a task with that id is already pending, the
 * pending task is cancelled and replaced. This makes `scheduleTask` the
 * idiomatic way to implement debouncing: use the same `taskId` on
 * every keystroke and only the final one will fire.
 *
 * @param repeatIntervalInMillis If provided, the task repeats on this interval
 *   indefinitely after the initial delay. Cancel with `cancelTask`.
 * @param taskId Stable identifier used to cancel-and-reschedule. Create one
 *   with `taskId('name')` and store it as a module-level constant.
 * @returns The TaskId of the newly scheduled task.
 */
export function scheduleTask<State, Event>(
  task: Effect<State, Event, void>,
  initialDelayInMillis: number,
  repeatIntervalInMillis: number | undefined,
  taskId: TaskId | undefined,
): Effect<State, Event, TaskId> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'ScheduleTask',
      input: {
        task,
        initialDelayInMillis,
        repeatIntervalInMillis,
        taskId,
      },
    },
    flatMap<B>(
      f: (taskId: TaskId) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (taskId: TaskId) => B): Effect<State, Event, B> {
      return flatMap(this, (taskId: TaskId) => pure(f(taskId)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, TaskId>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a delay of `delayInMilliseconds` ms before continuing the chain. */
export function setTimeout<State, Event>(
  delayInMilliseconds: number,
): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'SetTimeout',
      input: delayInMilliseconds,
    },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a state update via `f`. */
export function updateState<State, Event>(
  f: (state: State) => State,
): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'UpdateState',
      input: f,
    },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing an IndexedDB database open (or create), with `setup` applied for schema migrations. */
export function openDatabase<State, Event>(
  db: DbName,
  version: DbVersion,
  setup: (oldVersion: DbVersion) => DbSetupEffect<void>,
): Effect<State, Event, Result<void, DbError>> {
  return {
    _type: 'Suspend',
    operation: { _type: 'OpenDatabase', input: { db, version, setup } },
    flatMap<B>(
      f: (result: Result<void, DbError>) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (result: Result<void, DbError>) => B): Effect<State, Event, B> {
      return flatMap(this, result => pure(f(result)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, _ => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, Result<void, DbError>>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing an IndexedDB transaction containing `effect`. */
export function runDbTransaction<State, Event>(
  db: DbName,
  objectStores: readonly ObjectStore[],
  mode: 'readonly' | 'readwrite',
  effect: DbEffect<void>,
): Effect<State, Event, Result<void, DbError>> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'RunDbTransaction',
      input: { db, objectStores, mode, effect },
    },
    flatMap<B>(
      f: (result: Result<void, DbError>) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (result: Result<void, DbError>) => B): Effect<State, Event, B> {
      return flatMap(this, result => pure(f(result)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, _ => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, Result<void, DbError>>) => B): B {
      return f(this)
    },
  }
}

function storageEffect<State, Event, A>(
  storage: StorageTarget,
  key: string,
  value: string | undefined,
  tag:
    | 'GetStorageItem'
    | 'SetStorageItem'
    | 'RemoveStorageItem'
    | 'ClearStorage',
): Effect<State, Event, A> {
  const input =
    tag === 'SetStorageItem'
      ? { storage, key, value: value! }
      : tag === 'ClearStorage'
        ? { storage }
        : { storage, key }
  return {
    _type: 'Suspend',
    operation: { _type: tag, input } as Operation<State, Event>,
    flatMap<B>(f: (a: A) => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(e: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => e)
    },
    map<B>(f: (a: A) => B): Effect<State, Event, B> {
      return flatMap(this, a => pure(f(a)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, _ => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, A>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a browser history navigation of `delta` steps. */
export function go<State, Event>(delta: number): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: { _type: 'Go', input: delta },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a `history.pushState` to `location`. */
export function pushState<State, Event>(
  location: InternalLocation | string,
): Effect<State, Event, void> {
  const loc =
    typeof location === 'string' ? parseInternalLocation(location) : location
  return {
    _type: 'Suspend',
    operation: { _type: 'PushState', input: loc },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a `history.replaceState` with `location`. */
export function replaceState<State, Event>(
  location: InternalLocation | string,
): Effect<State, Event, void> {
  const loc =
    typeof location === 'string' ? parseInternalLocation(location) : location
  return {
    _type: 'Suspend',
    operation: { _type: 'ReplaceState', input: loc },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a localStorage read for `key`. */
export function getLocalStorageItem<State, Event>(
  key: string,
): Effect<State, Event, string | null> {
  return storageEffect('local', key, undefined, 'GetStorageItem')
}

/** An effect describing a localStorage write of `value` for `key`. */
export function setLocalStorageItem<State, Event>(
  key: string,
  value: string,
): Effect<State, Event, void> {
  return storageEffect('local', key, value, 'SetStorageItem')
}

/** An effect describing the removal of `key` from localStorage. */
export function removeLocalStorageItem<State, Event>(
  key: string,
): Effect<State, Event, void> {
  return storageEffect('local', key, undefined, 'RemoveStorageItem')
}

/** An effect describing a localStorage clear. */
export function clearLocalStorage<State, Event>(): Effect<State, Event, void> {
  return storageEffect('local', '', undefined, 'ClearStorage')
}

/** An effect describing a sessionStorage read for `key`. */
export function getSessionStorageItem<State, Event>(
  key: string,
): Effect<State, Event, string | null> {
  return storageEffect('session', key, undefined, 'GetStorageItem')
}

/** An effect describing a sessionStorage write of `value` for `key`. */
export function setSessionStorageItem<State, Event>(
  key: string,
  value: string,
): Effect<State, Event, void> {
  return storageEffect('session', key, value, 'SetStorageItem')
}

/** An effect describing the removal of `key` from sessionStorage. */
export function removeSessionStorageItem<State, Event>(
  key: string,
): Effect<State, Event, void> {
  return storageEffect('session', key, undefined, 'RemoveStorageItem')
}

/** An effect describing a sessionStorage clear. */
export function clearSessionStorage<State, Event>(): Effect<
  State,
  Event,
  void
> {
  return storageEffect('session', '', undefined, 'ClearStorage')
}

/**
 * Transforms the `Event` type of an effect by mapping each fired event through `f`.
 * Used when composing components: a child component fires `EventA`, and the
 * parent needs to convert those into its own `EventB` before wiring them up.
 * You rarely need to call this directly — `ComponentElement.onEvent` handles it.
 */
export function mapEvent<State, EventA, EventB, R>(
  effect: Effect<State, EventA, R>,
  f: (eventA: EventA) => EventB,
): Effect<State, EventB, R> {
  switch (effect._type) {
    case 'Return': {
      return pure(effect.value)
    }

    case 'FlatMap': {
      return flatMap(mapEvent(effect.effect, f), x => {
        return mapEvent(effect.next(x), f)
      })
    }

    case 'Suspend': {
      switch (effect.operation._type) {
        case 'Alert':
        case 'CancelTask':
        case 'ClearAppBadge':
        case 'ClearStorage':
        case 'Confirm':
        case 'CustomEffect':
        case 'Download':
        case 'GenerateUuid':
        case 'GetLocation':
        case 'GetNotificationPermission':
        case 'RequestNotificationPermission':
        case 'GetState':
        case 'GetStorageItem':
        case 'GetTime':
        case 'GetRandom':
        case 'Log':
        case 'PostBroadcastMessage':
        case 'Prompt':
        case 'MakeHttpRequest':
        case 'Go':
        case 'OpenDatabase':
        case 'PushState':
        case 'ReplaceState':
        case 'RemoveStorageItem':
        case 'ReadClipboard':
        case 'RunDbTransaction':
        case 'ScrollElement':
        case 'ScrollWindow':
        case 'SetAppBadge':
        case 'SetDocumentTitle':
        case 'SetStorageItem':
        case 'SetTimeout':
        case 'UpdateState':
        case 'WriteClipboard': {
          return effect as Effect<State, EventB, R>
        }

        case 'SubscribeToBroadcastChannel': {
          return subscribeToBroadcastChannel(
            effect.operation.input.channel,
            msg => mapEvent(effect.operation.input.handler(msg), f),
            effect.operation.input.taskId,
          ) as Effect<State, EventB, R>
        }

        case 'ScheduleTask': {
          return scheduleTask(
            mapEvent(effect.operation.input.task, f),
            effect.operation.input.initialDelayInMillis,
            effect.operation.input.repeatIntervalInMillis,
            effect.operation.input.taskId,
          ) as Effect<State, EventB, R>
        }

        case 'Async': {
          return async(
            mapEvent(effect.operation.input.effect, f),
            effect.operation.input.delayInMillis,
          ) as Effect<State, EventB, R>
        }
        case 'Product': {
          return product(
            mapEvent(effect.operation.input[0], f),
            mapEvent(effect.operation.input[1], f),
          ) as Effect<State, EventB, R>
        }

        case 'FireEvent':
          return fireEvent(f(effect.operation.input)) as Effect<
            State,
            EventB,
            R
          >
      }
    }
  }
}

/**
 * Adapts an effect written against a sub-state `StateA` so it can run in a
 * parent context with state `StateB`. The lens provides the `get`/`set`
 * functions that translate between the two state shapes.
 * Used when composing components whose effects operate on a slice of a larger state.
 */
export function mapState<StateA, StateB, Event, R>(
  effect: Effect<StateA, Event, R>,
  lens: Lens<StateB, StateA>,
): Effect<StateB, Event, R> {
  switch (effect._type) {
    case 'Return': {
      return pure(effect.value)
    }
    case 'FlatMap': {
      return flatMap(mapState(effect.effect, lens), x => {
        return mapState(effect.next(x), lens)
      })
    }
    case 'Suspend': {
      switch (effect.operation._type) {
        case 'Alert':
        case 'CancelTask':
        case 'ClearAppBadge':
        case 'ClearStorage':
        case 'Confirm':
        case 'CustomEffect':
        case 'Download':
        case 'FireEvent':
        case 'GenerateUuid':
        case 'GetLocation':
        case 'GetNotificationPermission':
        case 'RequestNotificationPermission':
        case 'PostBroadcastMessage':
        case 'Prompt':
        case 'GetStorageItem':
        case 'GetTime':
        case 'GetRandom':
        case 'Log':
        case 'MakeHttpRequest':
        case 'Go':
        case 'OpenDatabase':
        case 'PushState':
        case 'ReplaceState':
        case 'RemoveStorageItem':
        case 'ReadClipboard':
        case 'RunDbTransaction':
        case 'ScrollElement':
        case 'ScrollWindow':
        case 'SetAppBadge':
        case 'SetDocumentTitle':
        case 'SetStorageItem':
        case 'SetTimeout':
        case 'WriteClipboard': {
          return effect as Effect<StateB, Event, R>
        }

        case 'SubscribeToBroadcastChannel': {
          return subscribeToBroadcastChannel(
            effect.operation.input.channel,
            msg => mapState(effect.operation.input.handler(msg), lens),
            effect.operation.input.taskId,
          ) as Effect<StateB, Event, R>
        }

        case 'Async': {
          return async(
            mapState(effect.operation.input.effect, lens),
            effect.operation.input.delayInMillis,
          ) as Effect<StateB, Event, R>
        }

        case 'ScheduleTask': {
          return scheduleTask(
            mapState(effect.operation.input.task, lens),
            effect.operation.input.initialDelayInMillis,
            effect.operation.input.repeatIntervalInMillis,
            effect.operation.input.taskId,
          ) as Effect<StateB, Event, R>
        }

        case 'Product': {
          return product(
            mapState(effect.operation.input[0], lens),
            mapState(effect.operation.input[1], lens),
          ) as Effect<StateB, Event, R>
        }

        case 'UpdateState': {
          return updateState((stateB: StateB) => {
            const stateAUpdate = effect.operation.input as (
              stateA: StateA,
            ) => StateA
            const stateA = lens.get(stateB)
            const updatedStateA = stateAUpdate(stateA)
            return lens.set(stateB, updatedStateA)
          }) as Effect<StateB, Event, R>
        }
        case 'GetState':
          return getState<StateB, Event>().map(b => {
            return lens.get(b)
          }) as unknown as Effect<StateB, Event, R>
      }
    }
  }
}

/** Returns true if `value` is an Effect. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isEffect(value: any): value is Effect<any, any, any> {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value !== 'object') {
    return false
  }

  if (value['_type'] === 'Return') {
    return Object.prototype.hasOwnProperty.call(value, 'value')
  } else if (value['_type'] === 'Suspend') {
    return Object.prototype.hasOwnProperty.call(value, 'operation')
  } else if (value['_type'] === 'FlatMap') {
    return Object.prototype.hasOwnProperty.call(value, 'effect')
  } else {
    return false
  }
}

/*
function interpreter<State, Event, A>(
  state: State,
  effect: Effect<State, Event, A>
): [State, A] {
  switch (effect._type) {
    case 'Return':
      return [state, effect.value]
    case 'FlatMap':
      const [state2, result] = interpreter(state, effect.effect)
      return interpreter(state2, effect.next(result))
    case 'Suspend':
      switch (effect.operation._type) {
        case 'Alert':
          console.log("ALERT: " + effect.operation.input)
          return [state, undefined as A]
        case 'Async': {
          return todo()
        }
        case 'ClearAppBadge': {
          return todo()
        }
        case 'GetState':
          return [state, state as unknown as A]
        case 'GetTime':
          return [state, new Date() as A]
        case 'FireEvent':
          console.log("FIRING EVENT " + effect.operation.input)
          return [state, undefined as A]
        case 'Log':
          console.log(effect.operation.input)
          return [state, undefined as A]
        case 'MakeHttpRequest': {
          return todo()
        }
        case 'UpdateState':
          const state2 = effect.operation.input(state)
          return [state2, undefined as A]
      }
  }
}

export function run<State, Event, A>(
  state: State,
  effect: Effect<State, Event, A>
): A {
  const [_, a] = interpreter(state, effect)
  return a
}

type AppState = {
  count: number
}

export const prog1 =
  getState<AppState, unknown>()
    .flatMap(state => {
      const msg = "The count is " + state.count
      return log(msg)
    })
    .and(updateState(s => ({ count: s.count + 1 })))
    .and(getState())
    .flatMap(state => {
      const msg = "The count is now " + state.count
      return log(msg)
    })

export const prog2 =
  getState<AppState, unknown>()
    .flatMap(state => {
      const msg = "The count is " + state.count
      return log(msg)
    })


type OuterState = {
  newField: boolean
  appState: AppState
}

const lens = lensFromProp<OuterState>()('appState')

const changedProg = mapState(prog1, lens)


run({ newField: true, appState: { count: 2 } }, changedProg)
*/

/** An effect describing a window scroll. */
export function scrollWindow<State, Event>(
  options: ScrollOptions,
): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: { _type: 'ScrollWindow', input: options },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a scroll of the element matching `selector`. */
export function scrollElement<State, Event>(
  selector: string,
  options: ScrollOptions,
): Effect<State, Event, Result<void, ScrollElementError>> {
  return {
    _type: 'Suspend',
    operation: { _type: 'ScrollElement', input: { selector, options } },
    flatMap<B>(
      f: (result: Result<void, ScrollElementError>) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(
      f: (result: Result<void, ScrollElementError>) => B,
    ): Effect<State, Event, B> {
      return flatMap(this, result => pure(f(result)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(
      f: (effect: Effect<State, Event, Result<void, ScrollElementError>>) => B,
    ): B {
      return f(this)
    },
  }
}

/** An effect describing a file download. */
export function download<State, Event>(
  filename: string,
  content: string,
  contentType: string = 'text/plain',
): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: { _type: 'Download', input: { filename, content, contentType } },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/** An effect describing a BroadcastChannel message post. */
export function postBroadcastMessage<State, Event>(
  channel: string,
  message: unknown,
): Effect<State, Event, void> {
  return {
    _type: 'Suspend',
    operation: { _type: 'PostBroadcastMessage', input: { channel, message } },
    flatMap<B>(f: () => Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: () => B): Effect<State, Event, B> {
      return flatMap(this, () => pure(f()))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_b => {})
    },
    apply<B>(f: (effect: Effect<State, Event, void>) => B): B {
      return f(this)
    },
  }
}

/**
 * An effect describing a BroadcastChannel subscription, with `handler` called for each message received.
 * @returns a TaskId that can be used to cancel the subscription
 */
export function subscribeToBroadcastChannel<State, Event>(
  channel: string,
  handler: (message: unknown) => Effect<State, Event, void>,
  taskId: TaskId | undefined = undefined,
): Effect<State, Event, TaskId> {
  return {
    _type: 'Suspend',
    operation: {
      _type: 'SubscribeToBroadcastChannel',
      input: { channel, handler, taskId },
    },
    flatMap<B>(
      f: (id: TaskId) => Effect<State, Event, B>,
    ): Effect<State, Event, B> {
      return flatMap(this, f)
    },
    and<B>(effect: Effect<State, Event, B>): Effect<State, Event, B> {
      return flatMap(this, _ => effect)
    },
    map<B>(f: (id: TaskId) => B): Effect<State, Event, B> {
      return flatMap(this, id => pure(f(id)))
    },
    as<B>(b: B): Effect<State, Event, B> {
      return flatMap(this, () => pure(b))
    },
    void(): Effect<State, Event, void> {
      return this.map(_id => {})
    },
    apply<B>(f: (effect: Effect<State, Event, TaskId>) => B): B {
      return f(this)
    },
  }
}

/** An Effect that does nothing. */
export function noop<State, Event>(): Effect<State, Event, void> {
  return pure(undefined)
}

/**
 * Returns all built-in effect constructors with `State` and `Event` pre-applied.
 * Call this once per module, passing your application's state and event types,
 * and destructure the effects you need. This removes the need to repeat the
 * type parameters at every call site.
 *
 * ```ts
 * const { updateState, getTime, scheduleTask } = makeEffects<MyState, MyEvent>()
 * ```
 */
export function makeEffects<State, Event>() {
  return {
    alert: alert<State, Event>,
    confirm: confirm<State, Event>,
    prompt: prompt<State, Event>,
    cancelTask: cancelTask<State, Event>,
    getLocation: getLocation<State, Event>,
    getNotificationPermission: getNotificationPermission<State, Event>,
    requestNotificationPermission: requestNotificationPermission<State, Event>,
    clearAppBadge: clearAppBadge<State, Event>,
    readClipboard: readClipboard<State, Event>,
    setAppBadge: setAppBadge<State, Event>,
    setDocumentTitle: setDocumentTitle<State, Event>,
    writeClipboard: writeClipboard<State, Event>,
    fireEvent: fireEvent<State, Event>,
    getState: getState<State, Event>,
    getTime: getTime<State, Event>,
    getRandom: getRandom<State, Event>,
    log: log<State, Event>,
    makeHttpRequest: makeHttpRequest<State, Event>,
    scheduleTask: scheduleTask<State, Event>,
    setTimeout: setTimeout<State, Event>,
    updateState: updateState<State, Event>,
    pure<A>(a: A): Effect<State, Event, A> {
      return pure(a)
    },
    noop: noop<State, Event>,
    generateUuid: generateUuid<State, Event>,
    getJson: getJson<State, Event>,
    go: go<State, Event>,
    scrollWindow: scrollWindow<State, Event>,
    scrollElement: scrollElement<State, Event>,
    download: download<State, Event>,
    postBroadcastMessage: postBroadcastMessage<State, Event>,
    subscribeToBroadcastChannel: subscribeToBroadcastChannel<State, Event>,
    pushState: pushState<State, Event>,
    replaceState: replaceState<State, Event>,
    getLocalStorageItem: getLocalStorageItem<State, Event>,
    setLocalStorageItem: setLocalStorageItem<State, Event>,
    removeLocalStorageItem: removeLocalStorageItem<State, Event>,
    clearLocalStorage: clearLocalStorage<State, Event>,
    getSessionStorageItem: getSessionStorageItem<State, Event>,
    setSessionStorageItem: setSessionStorageItem<State, Event>,
    removeSessionStorageItem: removeSessionStorageItem<State, Event>,
    clearSessionStorage: clearSessionStorage<State, Event>,
    resultT<A, E>(
      effect: Effect<State, Event, Result<A, E>>,
    ): ResultTransformer<State, Event, A, E> {
      return resultT<State, Event, A, E>(effect)
    },
  }
}

/**
 * Maps each element of `as` to an effect and runs them in sequence, collecting
 * all results into an array. Each effect runs after the previous one completes,
 * so state changes from earlier effects are visible to later ones.
 */
export function traverse<State, Event, A, B>(
  as: readonly A[],
  f: (a: A) => Effect<State, Event, B>,
): Effect<State, Event, readonly B[]> {
  const effects = as.map(f)
  if (effects.length === 0) {
    return pure([])
  }

  return effects.reduce(
    (acc, effect) => {
      return product(acc, effect).map(bsAndB => {
        return [...bsAndB[0], bsAndB[1]]
      })
    },
    pure([] as B[]),
  )
}

/**
 * Wraps an `Effect<State, Event, Result<A, E>>` to allow chaining on the
 * success and error branches without manually unwrapping the `Result` at each
 * step. Methods like `flatMap` and `errorFlatMap` short-circuit on the other
 * branch. Call `.value` to get the underlying effect back.
 */
export class ResultTransformer<State, Event, A, E> {
  /** The underlying wrapped effect. */
  readonly value: Effect<State, Event, Result<A, E>>

  constructor(value: Effect<State, Event, Result<A, E>>) {
    this.value = value
  }

  /** Transforms the success value. */
  map<B>(f: (a: A) => B): ResultTransformer<State, Event, B, E> {
    return new ResultTransformer(
      this.value.map(res => {
        return res.map(f)
      }),
    )
  }

  /** Replaces the success value with `b`. */
  as<B>(b: B): ResultTransformer<State, Event, B, E> {
    return new ResultTransformer(
      this.value.map(res => {
        return res.map(_ => b)
      }),
    )
  }

  /** Discards the success value. */
  void(): ResultTransformer<State, Event, void, E> {
    return new ResultTransformer(
      this.value.map(res => {
        return res.map(_ => {})
      }),
    )
  }

  /** Discards the error value. */
  errorVoid(): ResultTransformer<State, Event, A, void> {
    return this.errorMap(_ => {})
  }

  /** Chains on success, short-circuits on failure. */
  flatMap<B>(
    f: (a: A) => Effect<State, Event, Result<B, E>>,
  ): ResultTransformer<State, Event, B, E> {
    return new ResultTransformer<State, Event, B, E>(
      this.value.flatMap<Result<B, E>>(res => {
        switch (res._tag) {
          case 'failure':
            return pure(failure(res.error))

          case 'success':
            return f(res.value)
        }
      }),
    )
  }

  /** Like `flatMap` but `f` returns an unwrapped Effect rather than an Effect of Result. */
  semiFlatMap<B>(
    f: (a: A) => Effect<State, Event, B>,
  ): ResultTransformer<State, Event, B, E> {
    return new ResultTransformer<State, Event, B, E>(
      this.value.flatMap<Result<B, E>>(res => {
        switch (res._tag) {
          case 'failure':
            return pure(failure(res.error))

          case 'success':
            return f(res.value).map(b => success<B, E>(b))
        }
      }),
    )
  }

  /** Sequences on success, short-circuits on failure. */
  and<B>(
    effect: Effect<State, Event, Result<B, E>>,
  ): ResultTransformer<State, Event, B, E> {
    return new ResultTransformer<State, Event, B, E>(
      this.value.flatMap<Result<B, E>>(res => {
        switch (res._tag) {
          case 'failure':
            return pure(failure(res.error))

          case 'success':
            return effect
        }
      }),
    )
  }

  /** Unwraps the Result, returning either the success value or the error. */
  merge(): Effect<State, Event, A | E> {
    return this.value.map(res => res.merge())
  }

  /** Logs the error to the console without changing the Result. */
  logError(): ResultTransformer<State, Event, A, E> {
    return this.errorFlatMap<E>(e => log<State, Event>(e).map(_ => e))
  }

  /** Logs the error and converts it to void. */
  logAndDropError(): ResultTransformer<State, Event, A, void> {
    return this.logError().errorVoid()
  }

  /** Transforms the error value. */
  errorMap<EE>(f: (error: E) => EE): ResultTransformer<State, Event, A, EE> {
    return new ResultTransformer(this.value.map(res => res.errorMap(f)))
  }

  /** Chains on failure, short-circuits on success. */
  errorFlatMap<EE>(
    f: (error: E) => Effect<State, Event, EE>,
  ): ResultTransformer<State, Event, A, EE> {
    return new ResultTransformer<State, Event, A, EE>(
      this.value.flatMap<Result<A, EE>>(res => {
        switch (res._tag) {
          case 'failure':
            return f(res.error).map(e => failure<A, EE>(e))
          case 'success':
            return pure(success(res.value))
        }
      }),
    )
  }
}

/**
 * Lifts an `Effect<State, Event, Result<A, E>>` into a `ResultTransformer` for
 * chaining. Equivalent to `new ResultTransformer(effect)`.
 */
export function resultT<State, Event, A, E>(
  effect: Effect<State, Event, Result<A, E>>,
): ResultTransformer<State, Event, A, E> {
  return new ResultTransformer(effect)
}
