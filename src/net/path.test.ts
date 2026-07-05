import { describe, expect, it } from 'vitest'
import { emptyPath, parsePath } from './path'

describe('emptyPath', () => {
  it('has no elements', () => {
    expect(emptyPath.elems).toHaveLength(0)
  })

  it('formats to empty string', () => {
    expect(emptyPath.format()).toBe('')
  })

  it('matches itself', () => {
    expect(emptyPath.matches(emptyPath)).toBe(true)
  })

  it('does not match parsePath("") which has one empty-string element', () => {
    expect(emptyPath.matches(parsePath(''))).toBe(false)
  })

  it('does not match a non-empty path', () => {
    expect(emptyPath.matches(parsePath('foo/bar'))).toBe(false)
  })
})

describe('parsePath', () => {
  it('splits on slashes', () => {
    const p = parsePath('foo/bar/baz')
    expect(p.elems).toEqual(['foo', 'bar', 'baz'])
  })

  it('formats back to original string', () => {
    expect(parsePath('foo/bar').format()).toBe('foo/bar')
  })

  it('single segment path', () => {
    const p = parsePath('home')
    expect(p.elems).toEqual(['home'])
    expect(p.format()).toBe('home')
  })

  it('preserves leading slash as empty first element', () => {
    const p = parsePath('/users/1')
    expect(p.elems).toEqual(['', 'users', '1'])
  })
})

describe('Path.matches', () => {
  it('matches identical paths', () => {
    expect(parsePath('a/b/c').matches(parsePath('a/b/c'))).toBe(true)
  })

  it('does not match paths of different lengths', () => {
    expect(parsePath('a/b').matches(parsePath('a/b/c'))).toBe(false)
  })

  it('does not match paths with different segments', () => {
    expect(parsePath('a/b').matches(parsePath('a/x'))).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(parsePath('Foo/Bar').matches(parsePath('foo/bar'))).toBe(true)
  })
})
