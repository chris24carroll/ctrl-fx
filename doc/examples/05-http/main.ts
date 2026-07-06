import { manageApplication } from 'ctrl-fx'
import { makeDom } from 'ctrl-fx/dom'
import { makeEffects, resultT } from 'ctrl-fx/effects'

// --- Types ---

type Post = { id: number; title: string; body: string }

type State =
  | { _tag: 'idle' }
  | { _tag: 'loading' }
  | { _tag: 'loaded'; posts: Post[] }

// --- DOM and effects ---

const { div_, ul_, li_, p_, button_ } = makeDom<State, never>()
const { updateState, getJson, alert } = makeEffects<State, never>()

// --- Effects ---

const loadPosts = updateState(state => ({ ...state, _tag: 'loading' })).and(
  getJson('https://jsonplaceholder.typicode.com/posts')
    .apply(resultT)
    .semiFlatMap(json =>
      updateState(() => ({
        _tag: 'loaded' as const,
        posts: json.decodeUnsafe<Post[]>().slice(0, 10),
      })),
    )
    .errorFlatMap(err => {
      const msg = 'message' in err ? err.message : 'HTTP error'
      return updateState(() => ({ _tag: 'idle' as const })).flatMap(() =>
        alert(`Could not load posts: ${msg}`),
      )
    })
    .merge(),
)

// --- View ---

const view = (state: State) => {
  switch (state._tag) {
    case 'idle':
      return div_(button_('Load Posts').onClick(loadPosts))
    case 'loading':
      return div_(p_('Loading…'))
    case 'loaded':
      return div_(
        button_('Reload').onClick(loadPosts),
        ul_(...state.posts.map(post => li_(p_(post.title), p_(post.body)))),
      )
  }
}

// --- Mount ---

manageApplication(view, { _tag: 'idle' })
