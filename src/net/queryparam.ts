export interface QueryParam {
  name: string
  value?: string
  format: string
}

export function parseQueryParam(str: string): QueryParam {
  const eqIndx = str.indexOf('=')

  if (eqIndx < 0) {
    return {
      name: str,
      format: str,
    }
  } else {
    const name = str.substring(0, eqIndx)
    const value = str.substring(eqIndx + 1)
    return {
      name,
      value,
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
