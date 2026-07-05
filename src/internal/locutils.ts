import { parseFragment } from '../net/fragment'
import type { Location } from '../net/location'
import { emptyPath, parsePath } from '../net/path'
import { parseAllQueryParams } from '../net/queryparam'
import { filterNot, stringToInt } from '../utils/index'
import type { RealWindow } from './realdom'

export function currentLocation(window: RealWindow): Location {
  return {
    protocol: filterNot(window.location.protocol?.trim(), p => p.length <= 0),
    hostname: filterNot(window.location.hostname?.trim(), h => h.length <= 0),
    port: window.location.port
      ? stringToInt(window.location.port.trim())
      : undefined,
    path: window.location.pathname
      ? parsePath(window.location.pathname)
      : emptyPath,
    queryParams: window.location.search?.trim()
      ? parseAllQueryParams(window.location.search?.trim())
      : [],
    fragment: window.location.hash
      ? parseFragment(window.location.hash)
      : undefined,
  }
}
