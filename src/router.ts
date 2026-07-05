import type { EventActions } from './dom/events'
import { async, pushState, type Effect } from './effects'
import type { InternalLocation } from './net/location'
import { parseInternalLocation } from './net/location'

export type { EventActions } from './dom/events'
export type { InternalLocation } from './net/location'

/** Named path-segment parameters extracted from a matched route. */
export type Params = Record<string, string>

/** A map of URL patterns to handler functions. Pattern keys use `:param` syntax for named path segments. */
export type RouteMap<Route> = {
  [pattern: string]: (params: Params) => Route
}

type CompiledRoute<Route> = {
  segments: string[]
  handler: (params: Params) => Route
}

function compile<Route>(routes: RouteMap<Route>): CompiledRoute<Route>[] {
  return Object.entries(routes).map(([pattern, handler]) => ({
    segments: pattern.split('/'),
    handler,
  }))
}

function matchRoute<Route>(
  compiled: CompiledRoute<Route>[],
  location: InternalLocation,
): Route | null {
  const pathSegs = location.path.elems

  for (const { segments, handler } of compiled) {
    if (segments.length !== pathSegs.length) continue

    const params: Params = {}
    let matched = true

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      if (seg.startsWith(':')) {
        params[seg.slice(1)] = pathSegs[i]
      } else if (seg.toLowerCase() !== pathSegs[i].toLowerCase()) {
        matched = false
        break
      }
    }

    if (matched) return handler(params)
  }

  return null
}

/**
 * Creates a route-matching function from a pattern map. Pattern keys use `:param` syntax for
 * named path segments. Returns `null` when no pattern matches.
 *
 * ```ts
 * const match = router({ '/': () => 'home', '/users/:id': ({ id }) => `user-${id}` })
 * ```
 */
export function router<Route>(
  routes: RouteMap<Route>,
): (location: InternalLocation) => Route | null {
  const compiled = compile(routes)
  return location => matchRoute(compiled, location)
}

/**
 * An effect describing a `history.pushState` to `path`, suitable for use as an `onClick` handler on an `<a>` element.
 * Produces `{ preventDefault: true }` to suppress the default browser navigation.
 */
export function link<State, Event>(
  path: string,
): Effect<State, Event, EventActions> {
  return async(pushState<State, Event>(parseInternalLocation(path)), 0).as({
    preventDefault: true,
  })
}

/** An effect describing a `history.pushState` to `path`. Use in effect chains or button handlers. */
export function navigate<State, Event>(
  path: string,
): Effect<State, Event, void> {
  return pushState<State, Event>(parseInternalLocation(path))
}

/**
 * Bundled router that strips `options.basePath` before matching and prepends it before navigating.
 * Use when your app is mounted at a sub-path (e.g. a GitHub Pages subdirectory).
 * Returns a `{ match, link, navigate }` object.
 */
export function createRouter<Route>(
  routes: RouteMap<Route>,
  options?: { basePath?: string },
): {
  match(location: InternalLocation): Route | null
  link<State, Event>(path: string): Effect<State, Event, EventActions>
  navigate<State, Event>(path: string): Effect<State, Event, void>
} {
  const compiled = compile(routes)
  const base = options?.basePath ?? ''

  return {
    match(location) {
      if (!base) return matchRoute(compiled, location)
      const fullPath = location.path.elems.join('/')
      if (!fullPath.startsWith(base)) return null
      const relative = fullPath.slice(base.length) || '/'
      return matchRoute(compiled, parseInternalLocation(relative))
    },
    link: (path) => link(base + path),
    navigate: (path) => navigate(base + path),
  }
}
