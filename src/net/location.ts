import { parseFragment, type Fragment } from './fragment'
import { parsePath, type Path } from './path'
import type { QueryParam } from './queryparam'
import { formatQueryString, parseAllQueryParams } from './queryparam'

export interface InternalLocation {
  readonly path: Path
  readonly queryParams: readonly QueryParam[]
  readonly fragment?: Fragment
}

export function formatLocation(loc: InternalLocation): string {
  return `${loc.path.format()}${formatQueryString(loc.queryParams)}${loc.fragment != null ? '#' + loc.fragment.format : ''}`
}

export function parseInternalLocation(s: string): InternalLocation {
  const fragStart = s.indexOf('#')

  let pathAndParams, fragment: Fragment | undefined

  if (fragStart < 0) {
    pathAndParams = s
    fragment = undefined
  } else {
    pathAndParams = s.substring(0, fragStart)
    fragment = parseFragment(s.substring(fragStart + 1))
  }

  let path, queryParams: readonly QueryParam[]
  const paramsStart = pathAndParams.indexOf('?')
  if (paramsStart < 0) {
    path = parsePath(pathAndParams)
    queryParams = []
  } else {
    path = parsePath(pathAndParams.substring(0, paramsStart))
    queryParams = parseAllQueryParams(pathAndParams.substring(paramsStart + 1))
  }

  return {
    path,
    queryParams,
    fragment,
  }
}

export interface Location {
  readonly protocol?: string
  readonly hostname?: string
  readonly port?: number
  readonly path: Path
  readonly queryParams: readonly QueryParam[]
  readonly fragment?: Fragment
}

export function internalLocationFromLocation(
  location: Location,
): InternalLocation {
  return {
    path: location.path,
    queryParams: location.queryParams,
    fragment: location.fragment,
  }
}

export const emptyLocation: InternalLocation = parseInternalLocation('')
