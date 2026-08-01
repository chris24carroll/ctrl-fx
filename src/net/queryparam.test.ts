import { describe, expect, it } from 'vitest'
import {
  findQueryParam,
  formatQueryString,
  parseAllQueryParams,
  parseQueryParam,
} from './queryparam'

describe('parseQueryParam', () => {
  it('parses key=value pair', () => {
    const qp = parseQueryParam('foo=bar')
    expect(qp.name).toBe('foo')
    expect(qp.value).toBe('bar')
    expect(qp.format).toBe('foo=bar')
  })

  it('parses value-less param', () => {
    const qp = parseQueryParam('flag')
    expect(qp.name).toBe('flag')
    expect(qp.value).toBeUndefined()
    expect(qp.format).toBe('flag')
  })

  it('handles value containing equals sign', () => {
    const qp = parseQueryParam('x=a=b')
    expect(qp.name).toBe('x')
    expect(qp.value).toBe('a=b')
  })
})

describe('parseAllQueryParams', () => {
  it('parses multiple params', () => {
    const qps = parseAllQueryParams('a=1&b=2')
    expect(qps).toHaveLength(2)
    expect(qps[0].name).toBe('a')
    expect(qps[1].name).toBe('b')
  })

  it('strips leading ?', () => {
    const qps = parseAllQueryParams('?x=1')
    expect(qps).toHaveLength(1)
    expect(qps[0].name).toBe('x')
  })

  it('returns empty array for empty string', () => {
    expect(parseAllQueryParams('')).toHaveLength(0)
  })

  it('returns empty array for bare ?', () => {
    expect(parseAllQueryParams('?')).toHaveLength(0)
  })

  it('handles value-less params in list', () => {
    const qps = parseAllQueryParams('flag&x=1')
    expect(qps[0].name).toBe('flag')
    expect(qps[0].value).toBeUndefined()
    expect(qps[1].value).toBe('1')
  })
})

describe('formatQueryString', () => {
  it('returns empty string for empty array', () => {
    expect(formatQueryString([])).toBe('')
  })

  it('prefixes single param with ?', () => {
    const qps = parseAllQueryParams('x=1')
    expect(formatQueryString(qps)).toBe('?x=1')
  })

  it('joins multiple params with &', () => {
    const qps = parseAllQueryParams('a=1&b=2')
    expect(formatQueryString(qps)).toBe('?a=1&b=2')
  })
})

describe('findQueryParam', () => {
  const qps = parseAllQueryParams('foo=1&bar=2&baz')

  it('finds param by name', () => {
    const found = findQueryParam(qps, qp => qp.name === 'bar')
    expect(found?.name).toBe('bar')
    expect(found?.value).toBe('2')
  })

  it('returns undefined when not found', () => {
    expect(findQueryParam(qps, qp => qp.name === 'missing')).toBeUndefined()
  })

  it('finds value-less param', () => {
    const found = findQueryParam(qps, qp => qp.name === 'baz')
    expect(found).toBeDefined()
    expect(found?.value).toBeUndefined()
  })
})

describe('percent-decoding', () => {
  it('decodes encoded values (e.g. an OAuth code with %2F)', () => {
    const qp = parseQueryParam('code=4%2F0AVGxyz%3D%3D')
    expect(qp.value).toBe('4/0AVGxyz==')
    expect(qp.format).toBe('code=4%2F0AVGxyz%3D%3D')
  })

  it('decodes encoded names', () => {
    const qp = parseQueryParam('a%20b=c')
    expect(qp.name).toBe('a b')
  })

  it('leaves + alone -- form-submission space convention does not apply here', () => {
    expect(parseQueryParam('scope=openid+email').value).toBe('openid+email')
  })

  it('falls back to the raw text on malformed encoding rather than throwing', () => {
    expect(parseQueryParam('x=%zz').value).toBe('%zz')
  })
})
