import { manageApplication } from 'ctrl-fx'
import { makeDom } from 'ctrl-fx/dom'
import { makeEffects } from 'ctrl-fx/effects'
import { createRouter } from 'ctrl-fx/router'

// --- Routes ---

type Route =
  | { _tag: 'home' }
  | { _tag: 'about' }
  | { _tag: 'user'; id: string }
  | { _tag: 'notFound' }

// basePath strips '/02-routing' before matching so route patterns stay clean.
// In a real app served from '/', omit the basePath option entirely.
const { match, link, navigate } = createRouter<Route>(
  {
    '/':           () => ({ _tag: 'home' }),
    '/about':      () => ({ _tag: 'about' }),
    '/users/:id':  p => ({ _tag: 'user', id: p.id }),
  },
  { basePath: '/02-routing' },
)

// --- State ---

type State = { route: Route }

// --- App ---

const { _, div_, p_, h2_, a, button_, nav_, ul_, li_ } = makeDom<State, never>()
const { updateState, getLocation } = makeEffects<State, never>()

const setRoute = (loc: Parameters<typeof match>[0]) =>
  updateState(() => ({ route: match(loc) ?? { _tag: 'notFound' } }))

// --- Views ---

const navBar = () =>
  nav_(
    ul_(
      li_(a(['href', '/02-routing/'])('Home').onClick(link('/'))),
      li_(a(['href', '/02-routing/about'])('About').onClick(link('/about'))),
      li_(a(['href', '/02-routing/users/42'])('User 42').onClick(link('/users/42'))),
    ),
  )

function pageView(state: State) {
  switch (state.route._tag) {
    case 'home':
      return div_(
        h2_('Home'),
        p_('Welcome! Use the nav links or the button below.'),
        button_('Go to About').onClick(navigate('/about')),
      )
    case 'about':
      return div_(
        h2_('About'),
        p_('This example shows routing with ctrl-fx.'),
      )
    case 'user':
      return div_(
        h2_(`User ${state.route.id}`),
        p_(`Showing profile for user ID: ${state.route.id}`),
        button_('← Back').onClick(navigate('/')),
      )
    case 'notFound':
      return div_(h2_('404'), p_('Page not found.'))
  }
}

// --- Root view ---

// Container listeners (onLocationChange, onPopState) live on the NodeGroup,
// not on individual elements. _() is shorthand for nodeGroup().
const view = (state: State) =>
  _(navBar(), pageView(state))
    .onLocationChange(setRoute)
    .onPopState(setRoute)

// --- Mount ---

// Read the current URL to set the initial route before first render
const initialState = getLocation().map(loc => ({
  route: match(loc) ?? { _tag: 'notFound' as const },
}))

manageApplication(view, initialState)
