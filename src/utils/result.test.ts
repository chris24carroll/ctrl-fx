import { describe, expect, it } from 'vitest'
import { failure, success, merge, fold } from './result'

describe('success', () => {
  it('has correct tag and value', () => {
    const r = success<number, string>(42)
    expect(r).toMatchObject({ _tag: 'success', value: 42 })
  })

  it('map transforms value', () => {
    const r = success<number, string>(3).map(x => x * 2)
    expect(r).toMatchObject({ _tag: 'success', value: 6 })
  })

  it('andThen chains to success', () => {
    const r = success<number, string>(3).andThen(x => success(x + 1))
    expect(r).toMatchObject({ _tag: 'success', value: 4 })
  })

  it('andThen chains to failure', () => {
    const r = success<number, string>(3).andThen(_ => failure<number, string>('oops'))
    expect(r).toMatchObject({ _tag: 'failure', error: 'oops' })
  })

  it('errorMap is a no-op on success', () => {
    const r = success<number, string>(5).errorMap(e => e.toUpperCase())
    expect(r).toMatchObject({ _tag: 'success', value: 5 })
  })

  it('merge returns value', () => {
    expect(success<number, string>(7).merge()).toBe(7)
  })

  it('recover is a no-op on success', () => {
    const r = success<number, string>(9).recover(_ => success(0))
    expect(r).toMatchObject({ _tag: 'success', value: 9 })
  })

  it('fold calls onSuccess', () => {
    const result = success<number, string>(1).fold(
      n => `value:${n}`,
      e => `error:${e}`,
    )
    expect(result).toBe('value:1')
  })
})

describe('failure', () => {
  it('has correct tag and error', () => {
    const r = failure<number, string>('bad')
    expect(r).toMatchObject({ _tag: 'failure', error: 'bad' })
  })

  it('map is a no-op on failure', () => {
    const r = failure<number, string>('bad').map(x => x * 2)
    expect(r).toMatchObject({ _tag: 'failure', error: 'bad' })
  })

  it('andThen is a no-op on failure', () => {
    const r = failure<number, string>('bad').andThen(x => success(x + 1))
    expect(r).toMatchObject({ _tag: 'failure', error: 'bad' })
  })

  it('errorMap transforms error', () => {
    const r = failure<number, string>('bad').errorMap(e => e.toUpperCase())
    expect(r).toMatchObject({ _tag: 'failure', error: 'BAD' })
  })

  it('merge returns error', () => {
    expect(failure<number, string>('err').merge()).toBe('err')
  })

  it('recover applies function', () => {
    const r = failure<number, string>('bad').recover(e => success(e.length))
    expect(r).toMatchObject({ _tag: 'success', value: 3 })
  })

  it('recover can return failure', () => {
    const r = failure<number, string>('bad').recover(_ => failure('worse'))
    expect(r).toMatchObject({ _tag: 'failure', error: 'worse' })
  })

  it('fold calls onError', () => {
    const result = failure<number, string>('oops').fold(
      n => `value:${n}`,
      e => `error:${e}`,
    )
    expect(result).toBe('error:oops')
  })
})

describe('merge', () => {
  it('returns value from success', () => {
    expect(merge(success<string, number>('hello'))).toBe('hello')
  })

  it('returns error from failure', () => {
    expect(merge(failure<string, number>(99))).toBe(99)
  })
})

describe('fold', () => {
  it('applies onSuccess for success', () => {
    const f = fold<number, string, string>(
      n => `ok:${n}`,
      e => `err:${e}`,
    )
    expect(f(success(5))).toBe('ok:5')
  })

  it('applies onError for failure', () => {
    const f = fold<number, string, string>(
      n => `ok:${n}`,
      e => `err:${e}`,
    )
    expect(f(failure('nope'))).toBe('err:nope')
  })
})
