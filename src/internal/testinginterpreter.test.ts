import { describe, expect, it } from 'vitest'
import { makeDom } from '../dom'
import { makeEffects, scheduleTask, taskId } from '../effects'
import { ResponseBody, type HttpResponse } from '../net'
import { advanceTime, click, one, receiveBroadcast, testApplication, type TestConfig } from '../testing'
import { failure, success } from '../utils/result'

type State =
  | { tag: 'idle' }
  | { tag: 'done'; status: number; body: string }
  | { tag: 'failed'; message: string }

const { div_, button_, p_ } = makeDom<State, never>()
const { makeHttpRequest, updateState } = makeEffects<State, never>()

function jsonBody(json: unknown): ResponseBody {
  return new ResponseBody(
    new TextEncoder().encode(JSON.stringify(json)).buffer as ArrayBuffer,
  )
}

const load = makeHttpRequest({
  uri: 'https://example.test/api',
  method: 'GET',
  headers: {},
}).flatMap(result => {
  switch (result._tag) {
    case 'success':
      return updateState(() => ({
        tag: 'done',
        status: result.value.status,
        body: result.value.body.asString(),
      }))
    case 'failure':
      return updateState(() => ({
        tag: 'failed',
        message:
          'message' in result.error ? result.error.message : result.error._type,
      }))
  }
})

const view = (state: State) =>
  div_(
    button_('Load').onClick(load),
    p_(
      state.tag === 'done'
        ? `status:${state.status}:${state.body}`
        : state.tag === 'failed'
          ? `error:${state.message}`
          : 'idle',
    ),
  )

function baseConfig(handler: TestConfig['http']['handler']): TestConfig {
  return {
    http: { handler },
    clock: { values: [] },
    random: { values: [] },
  }
}

describe('MakeHttpRequest in the test interpreter', () => {
  it('resolves a scripted 2xx response, exposing status and body', () => {
    const config = baseConfig(
      (): ReturnType<TestConfig['http']['handler']> =>
        success({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: jsonBody({ ok: true }),
        } satisfies HttpResponse),
    )
    const app = testApplication<State>(view, { tag: 'idle' }, config)
    const after = app.run(click(one('button')))
    expect(after.findOne('p').childNodes[0]).toBe(
      'status:200:{"ok":true}',
    )
  })

  it('exposes a non-2xx status instead of silently treating it as failure', () => {
    const config = baseConfig(() =>
      success({
        status: 429,
        headers: {},
        body: jsonBody({ error: 'quota exceeded' }),
      } satisfies HttpResponse),
    )
    const app = testApplication<State>(view, { tag: 'idle' }, config)
    const after = app.run(click(one('button')))
    expect(after.findOne('p').childNodes[0]).toBe(
      'status:429:{"error":"quota exceeded"}',
    )
  })

  it('propagates a scripted RequestError failure', () => {
    const config = baseConfig(() =>
      failure({
        _type: 'RequestError',
        cause: 'NetworkFailure',
        message: 'boom',
      }),
    )
    const app = testApplication<State>(view, { tag: 'idle' }, config)
    const after = app.run(click(one('button')))
    expect(after.findOne('p').childNodes[0]).toBe('error:boom')
  })

  it('converts a throwing handler into a RequestError instead of crashing', () => {
    const config = baseConfig(() => {
      throw new Error('handler exploded')
    })
    const app = testApplication<State>(view, { tag: 'idle' }, config)
    const after = app.run(click(one('button')))
    expect(after.findOne('p').childNodes[0]).toBe('error:handler exploded')
  })

  it('falls back to the default throwing handler when no TestConfig is supplied', () => {
    const app = testApplication<State>(view, { tag: 'idle' })
    const after = app.run(click(one('button')))
    expect(after.findOne('p').childNodes[0]).toBe(
      'error:No HTTP handler configured in TestConfig.',
    )
  })

  it('records the request/response pair in data.http.interactions', () => {
    const config = baseConfig(() =>
      success({
        status: 200,
        headers: {},
        body: jsonBody({ ok: true }),
      } satisfies HttpResponse),
    )
    const app = testApplication<State>(view, { tag: 'idle' }, config)
    const after = app.run(click(one('button')))
    expect(after.data.http.interactions).toHaveLength(1)
    expect(after.data.http.interactions[0]?.request.uri).toBe(
      'https://example.test/api',
    )
    expect(after.data.http.interactions[0]?.response).toMatchObject({
      _tag: 'success',
      value: { status: 200 },
    })
  })
})

describe('TestConfig propagation into deferred effects', () => {
  it('honors the scripted HTTP handler for an effect run via scheduleTask + advanceTime', () => {
    const config = baseConfig(() =>
      success({
        status: 200,
        headers: {},
        body: jsonBody({ ok: true }),
      } satisfies HttpResponse),
    )
    const scheduledLoad = scheduleTask(load, 100, undefined, taskId('scheduled-load')).void()
    const scheduledView = (state: State) =>
      div_(
        button_('Schedule').onClick(scheduledLoad),
        p_(
          state.tag === 'done'
            ? `status:${state.status}:${state.body}`
            : state.tag === 'failed'
              ? `error:${state.message}`
              : 'idle',
        ),
      )
    const app = testApplication<State>(scheduledView, { tag: 'idle' }, config)
    const after = app.run(click(one('button')), advanceTime(100))
    expect(after.findOne('p').childNodes[0]).toBe('status:200:{"ok":true}')
  })

  it('honors the scripted HTTP handler for an effect run via receiveBroadcast', () => {
    const config = baseConfig(() =>
      success({
        status: 200,
        headers: {},
        body: jsonBody({ ok: true }),
      } satisfies HttpResponse),
    )
    const { subscribeToBroadcastChannel } = makeEffects<State, never>()
    const subscribed = subscribeToBroadcastChannel('chan', () => load, taskId('sub')).void()
    const broadcastView = (state: State) =>
      div_(
        button_('Subscribe').onClick(subscribed),
        p_(
          state.tag === 'done'
            ? `status:${state.status}:${state.body}`
            : state.tag === 'failed'
              ? `error:${state.message}`
              : 'idle',
        ),
      )
    const app = testApplication<State>(broadcastView, { tag: 'idle' }, config)
    const after = app.run(click(one('button')), receiveBroadcast('chan', {}))
    expect(after.findOne('p').childNodes[0]).toBe('status:200:{"ok":true}')
  })
})
