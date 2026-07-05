// Deterministic hash-based PRNG for test fallback — never uses Math.random().
// Uses the 32-bit finalizer from MurmurHash3; distributes evenly over [0, 1).
function seededRandom(callIndex: number): number {
  let h = (callIndex + 1) | 0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  h ^= h >>> 16
  return (h >>> 0) / 0x100000000
}

import { generateUuid } from '.'
import { permission, uuidFromString, type Uuid } from '..'
import { dbVersion } from '../db'
import type { DbOperation } from '../db/effects'
import type { KeyPath } from '../db/keypath'
import type { DbSetupOperation } from '../db/setup'
import {
  serializeIdbKey,
  TestDatabaseData,
  type DbStoreSnapshot,
} from '../db/testdb'
import {
  taskId,
  type Effect,
  type ScrollOptions,
  type TaskId,
} from '../effects'
import { scrollElementError } from '../scroll'
import type { JsonValue } from '../json'
import { emptyLocation, type InternalLocation } from '../net/location'
import { type TestConfig, type TestData } from '../testing'
import { exhaustivenessCheck } from '../utils'
import { run as runDbEffect } from '../db/effects'
import { run as runDbSetupEffect } from '../db/setup'
import { failure, success } from '../utils/result'
import type { Callbacks, Interpreter } from './interpreter'
import type { RealWindow } from './realdom'
import { TaskRegistry } from './taskreg'

/* eslint-disable @typescript-eslint/no-explicit-any */
type MutableTestObjectStore = {
  keyPath: KeyPath
  records: Map<string, JsonValue>
  autoIncrementCounter: number
}

type MutableTestDb = {
  stores: Map<string, MutableTestObjectStore>
}

type MutableTestData<Custom> = {
  window: {
    alerts: any[]
    confirms: { message: string; response: boolean }[]
    confirmResponses: boolean[]
    prompts: {
      message: string
      default: string | undefined
      response: string | null
    }[]
    promptResponses: (string | null)[]
  }
  navigator: { appBadgeOperations: any[] }
  clipboard: { content: string; writes: string[] }
  document: { title: string | null }
  http: { interactions: any[] }
  clock: { calls: Date[] }
  random: { calls: number[] }
  console: { logs: any[] }
  db: { databases: Map<string, MutableTestDb> }
  storage: { local: Map<string, string>; session: Map<string, string> }
  navigation: {
    locationHistory: InternalLocation[]
  }
  scroll: {
    windowScrolls: ScrollOptions[]
    elementScrolls: { selector: string; options: ScrollOptions }[]
  }
  downloads: { filename: string; content: string; contentType: string }[]
  broadcasts: {
    sent: { channel: string; message: unknown }[]
  }
  uuidSequence: Uuid[]
  custom: Custom
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function snapshotTestData<Custom>(
  acc: MutableTestData<Custom>,
): TestData<Custom> {
  return {
    window: {
      alerts: [...acc.window.alerts],
      confirms: [...acc.window.confirms],
      confirmResponses: [...acc.window.confirmResponses],
      prompts: [...acc.window.prompts],
      promptResponses: [...acc.window.promptResponses],
    },
    navigator: { appBadgeOperations: [...acc.navigator.appBadgeOperations] },
    clipboard: {
      content: acc.clipboard.content,
      writes: [...acc.clipboard.writes],
    },
    document: { title: acc.document.title },
    http: { interactions: [...acc.http.interactions] },
    clock: { calls: [...acc.clock.calls] },
    random: { calls: [...acc.random.calls] },
    console: { logs: [...acc.console.logs] },
    db: new TestDatabaseData(
      new Map(
        [...acc.db.databases.entries()].map(([dbName, db]) => [
          dbName,
          new Map(
            [...db.stores.entries()].map(([storeName, store]) => [
              storeName,
              {
                keyPath: store.keyPath,
                records: new Map(store.records),
                autoIncrementCounter: store.autoIncrementCounter,
              } satisfies DbStoreSnapshot,
            ]),
          ),
        ]),
      ),
    ),
    storage: {
      local: new Map(acc.storage.local),
      session: new Map(acc.storage.session),
    },
    navigation: {
      locationHistory: [...acc.navigation.locationHistory],
    },
    scroll: {
      windowScrolls: [...acc.scroll.windowScrolls],
      elementScrolls: [...acc.scroll.elementScrolls],
    },
    downloads: [...acc.downloads],
    broadcasts: {
      sent: [...acc.broadcasts.sent],
    },
    custom: acc.custom,
  }
}

type ScheduledTask = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly task: Effect<any, any, void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly taskCallbacks: Callbacks<any, any, void>
  readonly taskId: TaskId
  nextFireAtMillis: number
  readonly repeatIntervalInMillis: number | undefined
}

class TestScheduler {
  private virtualNow = 0
  private pending: ScheduledTask[] = []

  schedule(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: Effect<any, any, void>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    taskCallbacks: Callbacks<any, any, void>,
    tskId: TaskId,
    initialDelayInMillis: number,
    repeatIntervalInMillis: number | undefined,
  ): void {
    this.pending.push({
      task,
      taskCallbacks,
      taskId: tskId,
      nextFireAtMillis: this.virtualNow + initialDelayInMillis,
      repeatIntervalInMillis,
    })
  }

  cancel(tskId: TaskId): void {
    this.pending = this.pending.filter(t => t.taskId !== tskId)
  }

  advance<Custom>(
    ms: number,
    acc: MutableTestData<Custom>,
    broadcastReg: BroadcastChannelRegistry,
    window: RealWindow,
  ): void {
    const targetTime = this.virtualNow + ms

    while (true) {
      const next = this.pending
        .filter(t => t.nextFireAtMillis <= targetTime)
        .sort((a, b) => a.nextFireAtMillis - b.nextFireAtMillis)[0]

      if (!next) break

      this.virtualNow = next.nextFireAtMillis

      if (next.repeatIntervalInMillis !== undefined) {
        next.nextFireAtMillis = this.virtualNow + next.repeatIntervalInMillis
      } else {
        this.pending = this.pending.filter(t => t !== next)
      }

      testingInterpreter(
        next.task,
        next.taskCallbacks,
        new TaskRegistry(),
        acc,
        broadcastReg,
        this,
        window,
      )
    }

    this.virtualNow = targetTime
  }
}

class BroadcastChannelRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private channels: Map<string, { handler: (msg: unknown) => Effect<any, any, void>; taskId: TaskId }[]> = new Map()

  subscribe(
    channel: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (msg: unknown) => Effect<any, any, void>,
    tskId: TaskId,
  ): void {
    if (!this.channels.has(channel)) this.channels.set(channel, [])
    this.channels.get(channel)!.push({ handler, taskId: tskId })
  }

  unsubscribe(tskId: TaskId): void {
    for (const [ch, subs] of this.channels) {
      this.channels.set(ch, subs.filter(s => s.taskId !== tskId))
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deliver<Custom>(
    channel: string,
    message: unknown,
    acc: MutableTestData<Custom>,
    broadcastReg: BroadcastChannelRegistry,
    scheduler: TestScheduler,
    window: RealWindow,
  ): void {
    const subs = this.channels.get(channel) ?? []
    for (const sub of subs) {
      testingInterpreter(
        sub.handler(message),
        {
          onComplete() {},
          onFireEvent() {},
          getState() { return undefined as unknown },
          setState() {},
        },
        new TaskRegistry(),
        acc,
        broadcastReg,
        scheduler,
        window,
      )
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function makeTestingInterpreter<Custom = {}>(
  initialData: TestData<Custom>,
  window: RealWindow,
  config?: TestConfig,
): {
  interpreter: Interpreter
  getData: () => TestData<Custom>
  advanceTime: (ms: number) => void
  fireBroadcast: (channel: string, message: unknown) => void
} {
  const acc: MutableTestData<Custom> = {
    window: {
      alerts: [...initialData.window.alerts],
      confirms: [...initialData.window.confirms],
      confirmResponses: [...initialData.window.confirmResponses],
      prompts: [...initialData.window.prompts],
      promptResponses: [...initialData.window.promptResponses],
    },
    navigator: {
      appBadgeOperations: [...initialData.navigator.appBadgeOperations],
    },
    clipboard: {
      content: initialData.clipboard.content,
      writes: [...initialData.clipboard.writes],
    },
    document: { title: initialData.document.title },
    http: { interactions: [...initialData.http.interactions] },
    clock: { calls: [...initialData.clock.calls] },
    random: { calls: [...initialData.random.calls] },
    console: { logs: [...initialData.console.logs] },
    storage: {
      local: new Map(initialData.storage.local),
      session: new Map(initialData.storage.session),
    },
    navigation: {
      locationHistory: [...initialData.navigation.locationHistory],
    },
    scroll: {
      windowScrolls: [...initialData.scroll.windowScrolls],
      elementScrolls: [...initialData.scroll.elementScrolls],
    },
    downloads: [...initialData.downloads],
    broadcasts: {
      sent: [...initialData.broadcasts.sent],
    },
    db: {
      databases: new Map(
        [...initialData.db._databases.entries()].map(([dbName, dbSnap]) => [
          dbName,
          {
            stores: new Map(
              [...dbSnap.entries()].map(([storeName, storeSnap]) => [
                storeName,
                {
                  keyPath: storeSnap.keyPath,
                  records: new Map(storeSnap.records),
                  autoIncrementCounter: storeSnap.autoIncrementCounter,
                },
              ]),
            ),
          },
        ]),
      ),
    },
    uuidSequence: [],
    custom: initialData.custom,
  }

  const scheduler = new TestScheduler()
  const broadcastReg = new BroadcastChannelRegistry()

  const interpreter: Interpreter = (effect, callbacks, taskRegistry) => {
    testingInterpreter(effect, callbacks, taskRegistry, acc, broadcastReg, scheduler, window, config)
  }

  return {
    interpreter,
    getData: () => snapshotTestData(acc),
    advanceTime: (ms: number) => scheduler.advance(ms, acc, broadcastReg, window),
    fireBroadcast: (channel: string, message: unknown) =>
      broadcastReg.deliver(channel, message, acc, broadcastReg, scheduler, window),
  }
}

function testingInterpreter<State, Event, A, Custom>(
  effect: Effect<State, Event, A>,
  callbacks: Callbacks<State, Event, A>,
  taskRegistry: TaskRegistry,
  acc: MutableTestData<Custom>,
  broadcastReg: BroadcastChannelRegistry,
  scheduler: TestScheduler,
  window: RealWindow,
  config?: TestConfig,
): void {
  switch (effect._type) {
    case 'Return': {
      callbacks.onComplete(effect.value)
      return
    }
    case 'FlatMap': {
      testingInterpreter(
        effect.effect,
        {
          ...callbacks,
          onComplete(result) {
            testingInterpreter(
              effect.next(result),
              callbacks,
              taskRegistry,
              acc,
              broadcastReg,
              scheduler,
              window,
              config,
            )
          },
        },
        taskRegistry,
        acc,
        broadcastReg,
        scheduler,
        window,
        config,
      )
      return
    }
    case 'Suspend': {
      switch (effect.operation._type) {
        case 'Alert': {
          acc.window.alerts.push(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }
        case 'Confirm': {
          const response = acc.window.confirmResponses.shift() ?? false
          acc.window.confirms.push({
            message: effect.operation.input,
            response,
          })
          callbacks.onComplete(response as A)
          return
        }
        case 'Prompt': {
          const response = acc.window.promptResponses.shift() ?? null
          acc.window.prompts.push({
            message: effect.operation.input.message,
            default: effect.operation.input.default,
            response,
          })
          callbacks.onComplete(response as A)
          return
        }
        case 'GetNotificationPermission': {
          callbacks.onComplete(permission('default') as A)
          return
        }
        case 'RequestNotificationPermission': {
          callbacks.onComplete(permission('granted') as A)
          return
        }
        case 'GetLocation': {
          const history = acc.navigation.locationHistory
          callbacks.onComplete(
            (history.length > 0
              ? history[history.length - 1]
              : emptyLocation) as A,
          )
          return
        }
        case 'Async': {
          // run the inner effect synchronously, ignoring the delay
          testingInterpreter(
            effect.operation.input.effect,
            {
              ...callbacks,
              onComplete() {
                callbacks.onComplete(undefined as A)
              },
            },
            taskRegistry,
            acc,
            broadcastReg,
            scheduler,
            window,
            config,
          )
          return
        }
        case 'CancelTask': {
          scheduler.cancel(effect.operation.input)
          broadcastReg.unsubscribe(effect.operation.input)
          taskRegistry.remove(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }
        case 'ClearAppBadge': {
          acc.navigator.appBadgeOperations.push({ _type: 'ClearAppBadge' })
          callbacks.onComplete(undefined as A)
          return
        }
        case 'SetAppBadge': {
          acc.navigator.appBadgeOperations.push({
            _type: 'SetAppBadge',
            count: effect.operation.input,
          })
          callbacks.onComplete(undefined as A)
          return
        }
        case 'SetDocumentTitle': {
          acc.document.title = effect.operation.input
          callbacks.onComplete(undefined as A)
          return
        }
        case 'ReadClipboard': {
          callbacks.onComplete(success(acc.clipboard.content) as A)
          return
        }
        case 'WriteClipboard': {
          acc.clipboard.content = effect.operation.input
          acc.clipboard.writes.push(effect.operation.input)
          callbacks.onComplete(success(undefined) as A)
          return
        }
        case 'Download': {
          acc.downloads.push(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }

        case 'PostBroadcastMessage': {
          acc.broadcasts.sent.push(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }

        case 'SubscribeToBroadcastChannel': {
          const { channel, handler, taskId: tskIdInput } = effect.operation.input
          const tskId = tskIdInput ?? taskId(generateUuid())
          if (tskIdInput) {
            broadcastReg.unsubscribe(tskIdInput)
          }
          broadcastReg.subscribe(channel, handler, tskId)
          callbacks.onComplete(tskId as A)
          return
        }

        case 'ScrollWindow': {
          acc.scroll.windowScrolls.push(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }
        case 'ScrollElement': {
          const { selector, options } = effect.operation.input
          const el = window.document.querySelector(selector)
          if (el === null) {
            callbacks.onComplete(failure(scrollElementError(selector)) as A)
          } else {
            el.scrollTo(options)
            acc.scroll.elementScrolls.push({ selector, options })
            callbacks.onComplete(success(undefined) as A)
          }
          return
        }
        case 'FireEvent': {
          callbacks.onFireEvent(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }
        case 'GetState': {
          callbacks.onComplete(callbacks.getState() as unknown as A)
          return
        }
        case 'GetTime': {
          const callIndex = acc.clock.calls.length
          const scripted = config?.clock.values ?? []
          const value = callIndex < scripted.length ? scripted[callIndex] : new Date(0)
          acc.clock.calls.push(value)
          callbacks.onComplete(value as A)
          return
        }
        case 'GetRandom': {
          const callIndex = acc.random.calls.length
          const scripted = config?.random.values ?? []
          const value = callIndex < scripted.length
            ? scripted[callIndex]
            : seededRandom(callIndex)
          acc.random.calls.push(value)
          callbacks.onComplete(value as A)
          return
        }
        case 'Log': {
          acc.console.logs.push(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }
        case 'MakeHttpRequest': {
          // TODO: add HTTP mock support for testing
          callbacks.onComplete(undefined as A)
          return
        }
        case 'Product': {
          let resultA: '__ctrl_fx_unset_result' | unknown =
            '__ctrl_fx_unset_result'
          let resultB: '__ctrl_fx_unset_result' | unknown =
            '__ctrl_fx_unset_result'

          testingInterpreter<State, Event, unknown, Custom>(
            effect.operation.input[0],
            {
              ...callbacks,
              onComplete(a) {
                resultA = a
                if (resultB !== '__ctrl_fx_unset_result') {
                  callbacks.onComplete([resultA, resultB] as A)
                }
              },
            },
            taskRegistry,
            acc,
            broadcastReg,
            scheduler,
            window,
            config,
          )
          testingInterpreter<State, Event, unknown, Custom>(
            effect.operation.input[1],
            {
              ...callbacks,
              onComplete(b) {
                resultB = b
                if (resultA !== '__ctrl_fx_unset_result') {
                  callbacks.onComplete([resultA, resultB] as A)
                }
              },
            },
            taskRegistry,
            acc,
            broadcastReg,
            scheduler,
            window,
            config,
          )
          return
        }
        case 'ScheduleTask': {
          const tskId = effect.operation.input.taskId ?? taskId(generateUuid())

          // rescheduling: cancel any existing task with this id
          if (effect.operation.input.taskId) {
            scheduler.cancel(effect.operation.input.taskId)
          }

          scheduler.schedule(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            effect.operation.input.task as Effect<any, any, void>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { ...callbacks, onComplete() {} } as Callbacks<any, any, void>,
            tskId,
            effect.operation.input.initialDelayInMillis,
            effect.operation.input.repeatIntervalInMillis,
          )

          callbacks.onComplete(tskId as A)
          return
        }
        case 'SetTimeout': {
          callbacks.onComplete(undefined as A)
          return
        }
        case 'PushState': {
          acc.navigation.locationHistory.push(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }
        case 'ReplaceState': {
          if (acc.navigation.locationHistory.length > 0) {
            acc.navigation.locationHistory[
              acc.navigation.locationHistory.length - 1
            ] = effect.operation.input
          } else {
            acc.navigation.locationHistory.push(effect.operation.input)
          }
          callbacks.onComplete(undefined as A)
          return
        }
        case 'Go': {
          const delta = effect.operation.input
          const newLen = acc.navigation.locationHistory.length + delta
          if (newLen > 0) {
            acc.navigation.locationHistory.length = newLen
          }
          callbacks.onComplete(undefined as A)
          return
        }
        case 'GenerateUuid': {
          const uuidLen = acc.uuidSequence.length
          const nextUuid = uuidFromString(`${uuidLen}`)
          acc.uuidSequence.push(nextUuid)
          callbacks.onComplete(nextUuid as A)
          return
        }
        case 'GetStorageItem': {
          const store = acc.storage[effect.operation.input.storage]
          callbacks.onComplete(
            (store.get(effect.operation.input.key) ?? null) as A,
          )
          return
        }
        case 'SetStorageItem': {
          acc.storage[effect.operation.input.storage].set(
            effect.operation.input.key,
            effect.operation.input.value,
          )
          callbacks.onComplete(undefined as A)
          return
        }
        case 'RemoveStorageItem': {
          acc.storage[effect.operation.input.storage].delete(
            effect.operation.input.key,
          )
          callbacks.onComplete(undefined as A)
          return
        }
        case 'ClearStorage': {
          acc.storage[effect.operation.input.storage].clear()
          callbacks.onComplete(undefined as A)
          return
        }
        case 'OpenDatabase': {
          const { db, setup } = effect.operation.input
          if (!acc.db.databases.has(db)) {
            const mutableDb: MutableTestDb = { stores: new Map() }
            acc.db.databases.set(db, mutableDb)
            runDbSetupEffect(setup(dbVersion(0)), makeSetupInterpreter(mutableDb), _r => {
              callbacks.onComplete(success(undefined) as A)
            })
          } else {
            callbacks.onComplete(success(undefined) as A)
          }
          return
        }
        case 'RunDbTransaction': {
          const { db, effect: dbEffect } = effect.operation.input
          const mutableDb = acc.db.databases.get(db)
          if (!mutableDb) {
            callbacks.onComplete(
              failure({
                _type: 'UnexpectedError' as const,
                message: `Database '${db}' is not open`,
              }) as A,
            )
            return
          }
          runDbEffect(dbEffect, makeDbInterpreter(mutableDb), _r => {
            callbacks.onComplete(success(undefined) as A)
          })
          return
        }

        case 'UpdateState': {
          callbacks.setState(effect.operation.input(callbacks.getState()))
          callbacks.onComplete(undefined as A)
          return
        }
        case 'CustomEffect': {
          const { args, test } = effect.operation.input
          const result = test(args, acc.custom as unknown)
          acc.custom = result.data as Custom
          callbacks.onComplete(result.out as A)
          return
        }
        default: {
          exhaustivenessCheck(effect.operation)
        }
      }
      break
    }
    default: {
      exhaustivenessCheck(effect)
    }
  }
}

function makeSetupInterpreter(
  mutableDb: MutableTestDb,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (op: DbSetupOperation, onComplete: (a: any) => void) => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (op: DbSetupOperation, onComplete: (a: any) => void): void => {
    switch (op._type) {
      case 'CreateObjectStore': {
        mutableDb.stores.set(op.objectStore, {
          keyPath: op.keyPath,
          records: new Map(),
          autoIncrementCounter: 1,
        })
        onComplete(undefined)
        return
      }
      case 'CreateIndex': {
        onComplete(undefined)
        return
      }
      case 'DeleteObjectStore': {
        mutableDb.stores.delete(op.objectStore)
        onComplete(undefined)
        return
      }
      case 'DeleteIndex': {
        onComplete(undefined)
        return
      }
      case 'GetObjectStoreNames': {
        onComplete([...mutableDb.stores.keys()])
        return
      }
      case 'GetIndexNames': {
        onComplete([])
        return
      }
      case 'RunDbEffect': {
        runDbEffect(op.effect, makeDbInterpreter(mutableDb), _r =>
          onComplete(undefined),
        )
        return
      }
    }
  }
}

function makeDbInterpreter(
  mutableDb: MutableTestDb,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (op: DbOperation, onComplete: (a: any) => void) => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (op: DbOperation, onComplete: (a: any) => void): void => {
    switch (op._type) {
      case 'Add':
      case 'Put': {
        const store = requireStore(mutableDb, op.objectStore)
        store.records.set(extractKey(op.value, store), op.value)
        onComplete(undefined)
        return
      }
      case 'Get': {
        const store = requireStore(mutableDb, op.objectStore)
        onComplete(store.records.get(serializeIdbKey(op.key)))
        return
      }
      case 'GetAll': {
        const store = requireStore(mutableDb, op.objectStore)
        onComplete([...store.records.values()])
        return
      }
      case 'Delete': {
        const store = requireStore(mutableDb, op.objectStore)
        store.records.delete(serializeIdbKey(op.key))
        onComplete(undefined)
        return
      }
      case 'Count': {
        const store = requireStore(mutableDb, op.objectStore)
        onComplete(store.records.size)
        return
      }
    }
  }
}

function requireStore(
  mutableDb: MutableTestDb,
  storeName: string,
): MutableTestObjectStore {
  const store = mutableDb.stores.get(storeName)
  if (!store) throw new Error(`Object store '${storeName}' not found`)
  return store
}

function extractKey(value: JsonValue, store: MutableTestObjectStore): string {
  const { keyPath } = store
  switch (keyPath._type) {
    case 'AutoIncrement':
      return String(store.autoIncrementCounter++)
    case 'Manual': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`Cannot extract key '${keyPath.value}' from non-object`)
      }
      return JSON.stringify((value as Record<string, JsonValue>)[keyPath.value])
    }
    case 'Multi': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error('Cannot extract compound key from non-object')
      }
      const obj = value as Record<string, JsonValue>
      return JSON.stringify(
        [keyPath.first, keyPath.second, ...keyPath.rest].map(f => obj[f]),
      )
    }
  }
}
