import { describe, expect, it } from 'vitest'
import { formatLocation, parseInternalLocation } from './location'

describe('parseInternalLocation', () => {
  it('parses a plain path', () => {
    const loc = parseInternalLocation('foo/bar')
    expect(loc.path.elems).toEqual(['foo', 'bar'])
    expect(loc.queryParams).toHaveLength(0)
    expect(loc.fragment).toBeUndefined()
  })

  it('parses path with query params', () => {
    const loc = parseInternalLocation('foo/bar?x=1&y=2')
    expect(loc.path.elems).toEqual(['foo', 'bar'])
    expect(loc.queryParams).toHaveLength(2)
    expect(loc.queryParams[0].name).toBe('x')
    expect(loc.queryParams[1].name).toBe('y')
  })

  it('parses path with fragment', () => {
    const loc = parseInternalLocation('foo#section')
    expect(loc.path.elems).toEqual(['foo'])
    expect(loc.fragment?.path.elems).toEqual(['section'])
  })

  it('parses empty string', () => {
    const loc = parseInternalLocation('')
    expect(loc.path.elems).toEqual([''])
    expect(loc.queryParams).toHaveLength(0)
    expect(loc.fragment).toBeUndefined()
  })

  it('parses path with both query params and fragment', () => {
    const loc = parseInternalLocation('search?q=hello#results')
    expect(loc.path.elems).toEqual(['search'])
    expect(loc.queryParams[0].name).toBe('q')
    expect(loc.fragment?.path.elems).toEqual(['results'])
  })
})

describe('formatLocation', () => {
  it('formats a path-only location', () => {
    const loc = parseInternalLocation('foo/bar')
    expect(formatLocation(loc)).toBe('foo/bar')
  })

  it('formats path with query params', () => {
    const loc = parseInternalLocation('foo?x=1')
    expect(formatLocation(loc)).toBe('foo?x=1')
  })

  it('roundtrips path + query + fragment', () => {
    const original = 'search?q=hello#results'
    const loc = parseInternalLocation(original)
    expect(formatLocation(loc)).toBe(original)
  })

  it('formats empty location', () => {
    const loc = parseInternalLocation('')
    expect(formatLocation(loc)).toBe('')
  })
})
