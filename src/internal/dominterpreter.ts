import { generateUuid } from '.'
import { permission } from '..'
import { taskId, type Effect, type TaskId } from '../effects'
import { formatLocation, parseInternalLocation } from '../net/location'
import { scrollElementError } from '../scroll'
import { failure, success } from '../utils/result'
import { exhaustivenessCheck } from '../utils'
import type { Callbacks } from './interpreter'
import { readClipboard, writeClipboard } from './clipboard'
import { DbManager } from './dbmgr'
import { makeHttpRequest } from './net'
import { TaskRegistry } from './taskreg'

const dbManager = new DbManager()

export function domInterpreter<State, Event, A>(
  effect: Effect<State, Event, A>,
  callbacks: Callbacks<State, Event, A>,
  taskRegistry: TaskRegistry,
): void {
  switch (effect._type) {
    case 'Return': {
      callbacks.onComplete(effect.value)
      return
    }
    case 'FlatMap': {
      domInterpreter(
        effect.effect,
        {
          ...callbacks,
          onComplete(result) {
            domInterpreter(effect.next(result), callbacks, taskRegistry)
          },
        },
        taskRegistry,
      )
      return
    }
    case 'Suspend': {
      switch (effect.operation._type) {
        case 'Alert': {
          globalThis.window.alert(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }

        case 'Confirm': {
          callbacks.onComplete(
            globalThis.window.confirm(effect.operation.input) as A,
          )
          return
        }

        case 'Prompt': {
          callbacks.onComplete(
            globalThis.window.prompt(
              effect.operation.input.message,
              effect.operation.input.default,
            ) as A,
          )
          return
        }

        case 'GetNotificationPermission': {
          callbacks.onComplete(
            permission(globalThis.Notification.permission) as A,
          )
          return
        }

        case 'RequestNotificationPermission': {
          globalThis.Notification.requestPermission().then(perm => {
            callbacks.onComplete(permission(perm) as A)
          })
          return
        }

        case 'GetLocation': {
          const loc = globalThis.window.location
          callbacks.onComplete(
            parseInternalLocation(loc.pathname + loc.search + loc.hash) as A,
          )
          return
        }

        case 'Async': {
          const { effect: innerEffect, delayInMillis } = effect.operation.input
          setTimeout(() => {
            domInterpreter(
              innerEffect,
              { ...callbacks, onComplete() {} },
              taskRegistry,
            )
          }, delayInMillis)
          callbacks.onComplete(undefined as A)
          return
        }

        case 'CancelTask': {
          taskRegistry.cancel(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }

        case 'ClearAppBadge': {
          if (globalThis.navigator.clearAppBadge) {
            globalThis.navigator.clearAppBadge()
          }
          callbacks.onComplete(undefined as A)
          return
        }

        case 'SetAppBadge': {
          if (globalThis.navigator.setAppBadge) {
            globalThis.navigator.setAppBadge(effect.operation.input)
          }
          callbacks.onComplete(undefined as A)
          return
        }

        case 'SetDocumentTitle': {
          globalThis.document.title = effect.operation.input
          callbacks.onComplete(undefined as A)
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
          callbacks.onComplete(new Date() as A)
          return
        }

        case 'GetRandom': {
          callbacks.onComplete(Math.random() as A)
          return
        }

        case 'MakeHttpRequest': {
          makeHttpRequest(effect.operation.input, result =>
            callbacks.onComplete(result as A),
          )
          return
        }

        case 'Log': {
          console.log(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }

        case 'Product': {
          let resultA: '__ctrl_fx_unset_result' | unknown =
            '__ctrl_fx_unset_result'
          let resultB: '__ctrl_fx_unset_result' | unknown =
            '__ctrl_fx_unset_result'

          domInterpreter<State, Event, unknown>(
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
          )
          domInterpreter<State, Event, unknown>(
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
          )
          return
        }

        case 'ScheduleTask': {
          let tskId: TaskId

          // clear task if its already scheduled
          if (effect.operation.input.taskId) {
            taskRegistry.cancel(effect.operation.input.taskId)
            tskId = effect.operation.input.taskId
          }

          // setTimeout (one-shot)
          if (effect.operation.input.repeatIntervalInMillis === undefined) {
            const timerId = globalThis.setTimeout(() => {
              domInterpreter(
                effect.operation.input.task,
                { ...callbacks, onComplete() {} },
                taskRegistry,
              )
            }, effect.operation.input.initialDelayInMillis)

            tskId ||= taskId(generateUuid())
            taskRegistry.set(tskId, () => clearTimeout(timerId))

          // setInterval (delay == interval shortcut)
          } else if (
            effect.operation.input.initialDelayInMillis ===
            effect.operation.input.repeatIntervalInMillis
          ) {
            const timerId = globalThis.setInterval(() => {
              domInterpreter(
                effect.operation.input.task,
                { ...callbacks, onComplete() {} },
                taskRegistry,
              )
            }, effect.operation.input.repeatIntervalInMillis)

            tskId ||= taskId(generateUuid())
            taskRegistry.set(tskId, () => clearInterval(timerId))
          } else {
            // initial delay differs from repeat interval: setTimeout then setInterval
            tskId ||= taskId(generateUuid())
            const timerId = globalThis.setTimeout(() => {
              domInterpreter(
                effect.operation.input.task,
                {
                  ...callbacks,
                  onComplete() {
                    const newTimerId = globalThis.setInterval(() => {
                      domInterpreter(
                        effect.operation.input.task,
                        { ...callbacks, onComplete() {} },
                        taskRegistry,
                      )
                    }, effect.operation.input.repeatIntervalInMillis)
                    taskRegistry.set(tskId, () => clearInterval(newTimerId))
                  },
                },
                taskRegistry,
              )
            }, effect.operation.input.initialDelayInMillis)

            taskRegistry.set(tskId, () => clearTimeout(timerId))
          }

          callbacks.onComplete(tskId as A)
          return
        }

        case 'SetTimeout': {
          setTimeout(() => {
            callbacks.onComplete(undefined as A)
          }, effect.operation.input)
          return
        }

        case 'PushState': {
          const url = formatLocation(effect.operation.input)
          history.pushState(null, '', url)
          window.dispatchEvent(new Event('locationchange'))
          callbacks.onComplete(undefined as A)
          return
        }

        case 'ReplaceState': {
          const url = formatLocation(effect.operation.input)
          history.replaceState(null, '', url)
          window.dispatchEvent(new Event('locationchange'))
          callbacks.onComplete(undefined as A)
          return
        }

        case 'Go': {
          history.go(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }

        case 'GetStorageItem': {
          const store =
            effect.operation.input.storage === 'local'
              ? localStorage
              : sessionStorage
          callbacks.onComplete(store.getItem(effect.operation.input.key) as A)
          return
        }

        case 'SetStorageItem': {
          const store =
            effect.operation.input.storage === 'local'
              ? localStorage
              : sessionStorage
          store.setItem(
            effect.operation.input.key,
            effect.operation.input.value,
          )
          callbacks.onComplete(undefined as A)
          return
        }

        case 'RemoveStorageItem': {
          const store =
            effect.operation.input.storage === 'local'
              ? localStorage
              : sessionStorage
          store.removeItem(effect.operation.input.key)
          callbacks.onComplete(undefined as A)
          return
        }

        case 'ClearStorage': {
          const store =
            effect.operation.input.storage === 'local'
              ? localStorage
              : sessionStorage
          store.clear()
          callbacks.onComplete(undefined as A)
          return
        }

        case 'OpenDatabase': {
          const { db, version, setup } = effect.operation.input
          dbManager.open(db, version, setup, result => {
            callbacks.onComplete(result as A)
          })
          return
        }

        case 'RunDbTransaction': {
          const {
            db,
            objectStores,
            mode,
            effect: dbEffect,
          } = effect.operation.input
          dbManager.runTransaction(db, objectStores, mode, dbEffect, result => {
            callbacks.onComplete(result as A)
          })
          return
        }

        case 'UpdateState': {
          callbacks.setState(effect.operation.input(callbacks.getState()))
          callbacks.onComplete(undefined as A)
          return
        }

        case 'GenerateUuid': {
          callbacks.onComplete(generateUuid() as A)
          return
        }

        case 'ReadClipboard': {
          readClipboard(result => callbacks.onComplete(result as A))
          return
        }

        case 'WriteClipboard': {
          writeClipboard(effect.operation.input, result =>
            callbacks.onComplete(result as A),
          )
          return
        }

        case 'Download': {
          const { filename, content, contentType } = effect.operation.input
          const blob = new Blob([content], { type: contentType })
          const url = URL.createObjectURL(blob)
          const a = globalThis.document.createElement('a')
          a.href = url
          a.download = filename
          globalThis.document.body.appendChild(a)
          a.click()
          globalThis.document.body.removeChild(a)
          URL.revokeObjectURL(url)
          callbacks.onComplete(undefined as A)
          return
        }

        case 'PostBroadcastMessage': {
          const bc = new BroadcastChannel(effect.operation.input.channel)
          bc.postMessage(effect.operation.input.message)
          bc.close()
          callbacks.onComplete(undefined as A)
          return
        }

        case 'SubscribeToBroadcastChannel': {
          const { channel, handler, taskId: tskIdInput } = effect.operation.input
          const tskId = tskIdInput ?? taskId(generateUuid())
          const bc = new BroadcastChannel(channel)
          bc.onmessage = (event: MessageEvent) => {
            domInterpreter(
              handler(event.data),
              { ...callbacks, onComplete() {} },
              taskRegistry,
            )
          }
          taskRegistry.set(tskId, () => bc.close())
          callbacks.onComplete(tskId as A)
          return
        }

        case 'ScrollWindow': {
          globalThis.window.scrollTo(effect.operation.input)
          callbacks.onComplete(undefined as A)
          return
        }

        case 'ScrollElement': {
          const { selector, options } = effect.operation.input
          const el = globalThis.document.querySelector(selector)
          if (el === null) {
            callbacks.onComplete(failure(scrollElementError(selector)) as A)
          } else {
            el.scrollTo(options)
            callbacks.onComplete(success(undefined) as A)
          }
          return
        }

        case 'CustomEffect': {
          const { args, f } = effect.operation.input
          const result = f(args)
          if (result instanceof Promise) {
            result.then(out => callbacks.onComplete(out as A))
          } else {
            callbacks.onComplete(result as A)
          }
          return
        }

        default:
          exhaustivenessCheck(effect.operation)
      }
      break
    }
    default:
      exhaustivenessCheck(effect)
  }
}
