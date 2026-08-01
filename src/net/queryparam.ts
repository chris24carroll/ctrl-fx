export interface QueryParam {
  name: string
  value?: string
  format: string
}

/** Percent-decodes one query-string component, falling back to the raw text when the encoding is malformed (a stray '%' must not throw out of location parsing). `+` is deliberately NOT treated as a space -- that convention belongs to form submission, and consumers here want the literal characters (e.g. an OAuth `code=4%2F...` must decode to `4/...`, see spoiler-alert's auth callback). */
function decodeComponent(str: string): string {
  try {
    return decodeURIComponent(str)
  } catch {
    return str
  }
}

export function parseQueryParam(str: string): QueryParam {
  const eqIndx = str.indexOf('=')

  if (eqIndx < 0) {
    return {
      name: decodeComponent(str),
      format: str,
    }
  } else {
    const name = str.substring(0, eqIndx)
    const value = str.substring(eqIndx + 1)
    return {
      name: decodeComponent(name),
      value: decodeComponent(value),
      format: str,
    }
  }
}

export function parseAllQueryParams(str: string): readonly QueryParam[] {
  const normalizedInput = str.startsWith('?') ? str.substring(1) : str
  const qps = normalizedInput.split('&').filter(s => s.length > 0)
  return qps.map(parseQueryParam)
}

export function formatQueryString(queryParams: readonly QueryParam[]): string {
  if (queryParams.length === 0) {
    return ''
  } else {
    return '?' + queryParams.map(qp => qp.format).join('&')
  }
}

export function findQueryParam(
  haystack: readonly QueryParam[],
  predicate: (queryParam: QueryParam) => boolean,
): QueryParam | undefined {
  return haystack.find(qp => predicate(qp))
}
