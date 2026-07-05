import { describe, expect, it } from 'vitest'
import {
  fireEvent,
  getState,
  isEffect,
  log,
  mapEvent,
  mapState,
  pure,
  resultT,
  traverse,
  updateState,
} from './effects'
import { lensFromProp } from './utils/lens'
import { failure, success } from './utils/result'

describe('pure', () => {
  it('creates a Return with the given value', () => {
    const e = pure(42)
    expect(e).toMatchObject({ _type: 'Return', value: 42 })
  })
})

describe('flatMap', () => {
  it('sequences two effects', () => {
    const e = pure(1).flatMap(n => pure(n + 1))
    expect(e._type).toBe('FlatMap')
  })
})

describe('map', () => {
  it('transforms the value', () => {
    const e = pure(3).map(n => n * 2)
    expect(e._type).toBe('FlatMap')
  })
})

describe('and', () => {
  it('creates a FlatMap that discards the left value', () => {
    const e = pure(1).and(pure(2))
    expect(e._type).toBe('FlatMap')
  })
})

describe('as', () => {
  it('replaces value with a constant', () => {
    const e = pure(1).as('hello')
    expect(e._type).toBe('FlatMap')
  })
})

describe('isEffect', () => {
  it('recognizes Return', () => {
    expect(isEffect(pure(1))).toBe(true)
  })

  it('recognizes FlatMap', () => {
    expect(isEffect(pure(1).flatMap(n => pure(n)))).toBe(true)
  })

  it('recognizes Suspend', () => {
    expect(isEffect(log('msg'))).toBe(true)
  })

  it('rejects null', () => {
    expect(isEffect(null)).toBe(false)
  })

  it('rejects plain objects', () => {
    expect(isEffect({ x: 1 })).toBe(false)
  })

  it('rejects primitives', () => {
    expect(isEffect(42)).toBe(false)
  })
})

describe('mapEvent', () => {
  it('maps through Return unchanged', () => {
    const e = mapEvent(pure<void, 'A', string>('hello'), _ => 'B' as const)
    expect(e).toMatchObject({ _type: 'Return', value: 'hello' })
  })

  it('transforms FireEvent', () => {
    const original = fireEvent<void, 'A'>('A')
    const mapped = mapEvent(original, _ => 'B' as const)
    expect(mapped._type).toBe('Suspend')
    if (mapped._type === 'Suspend') {
      expect(mapped.operation._type).toBe('FireEvent')
      if (mapped.operation._type === 'FireEvent') {
        expect(mapped.operation.input).toBe('B')
      }
    }
  })

  it('passes through non-event operations', () => {
    const e = log<void, 'A'>('msg')
    const mapped = mapEvent(e, _ => 'B' as const)
    expect(mapped._type).toBe('Suspend')
    if (mapped._type === 'Suspend') {
      expect(mapped.operation._type).toBe('Log')
    }
  })

  it('maps FlatMap recursively', () => {
    const e = fireEvent<void, 'A'>('A').and(pure(undefined))
    const mapped = mapEvent(e, _ => 'B' as const)
    expect(mapped._type).toBe('FlatMap')
  })
})

describe('mapState', () => {
  type Inner = { count: number }
  type Outer = { inner: Inner; other: string }

  const lens = lensFromProp<Outer>()('inner')

  it('maps through Return unchanged', () => {
    const e = pure<Inner, never, string>('hi')
    const mapped = mapState(e, lens)
    expect(mapped).toMatchObject({ _type: 'Return', value: 'hi' })
  })

  it('wraps UpdateState through lens', () => {
    const e = updateState<Inner, never>(s => ({ count: s.count + 1 }))
    const mapped = mapState(e, lens)
    expect(mapped._type).toBe('Suspend')
    if (mapped._type === 'Suspend') {
      expect(mapped.operation._type).toBe('UpdateState')
      if (mapped.operation._type === 'UpdateState') {
        const outer: Outer = { inner: { count: 5 }, other: 'x' }
        const result = mapped.operation.input(outer)
        expect(result.inner.count).toBe(6)
        expect(result.other).toBe('x')
      }
    }
  })

  it('wraps GetState through lens', () => {
    const e = getState<Inner, never>()
    const mapped = mapState(e, lens)
    expect(mapped._type).toBe('FlatMap')
  })
})

describe('traverse', () => {
  it('returns pure([]) for empty array', () => {
    const e = traverse([], _ => pure(0))
    expect(e).toMatchObject({ _type: 'Return', value: [] })
  })

  it('builds a product chain for non-empty array', () => {
    const e = traverse([1, 2, 3], n => pure(n * 2))
    expect(isEffect(e)).toBe(true)
  })
})

describe('ResultTransformer', () => {
  it('map transforms success value', () => {
    const rt = resultT(pure(success<number, string>(3)))
    const mapped = rt.map(n => n * 2)
    expect(isEffect(mapped.value)).toBe(true)
  })

  it('flatMap short-circuits on failure', () => {
    const rt = resultT(pure(failure<number, string>('err')))
    const mapped = rt.flatMap(n => pure(success<number, string>(n + 1)))
    expect(isEffect(mapped.value)).toBe(true)
  })

  it('errorMap transforms error', () => {
    const rt = resultT(pure(failure<number, string>('oops')))
    const mapped = rt.errorMap(e => e.toUpperCase())
    expect(isEffect(mapped.value)).toBe(true)
  })

  it('merge produces an effect', () => {
    const rt = resultT(pure(success<number, string>(7)))
    expect(isEffect(rt.merge())).toBe(true)
  })

  it('void produces ResultTransformer<..., void>', () => {
    const rt = resultT(pure(success<number, string>(1)))
    expect(isEffect(rt.void().value)).toBe(true)
  })
})
