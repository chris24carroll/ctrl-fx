import { makeDom } from 'ctrl-fx/dom'
import { customEffect, makeEffects } from 'ctrl-fx/effects'

export type State = { title: string; slug: string }

// Stand-in for a real slugify library (e.g. import slugify from 'slugify').
// customEffect wraps it so the browser calls the real thing while tests
// can supply scripted return values without depending on library behaviour.
function libSlugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export type SlugData = string[]

export const slugify = customEffect<State, never, string, string, SlugData>(
  text => libSlugify(text),
  (text, scripted) => {
    const [value = libSlugify(text), ...remaining] = scripted
    return { out: value, data: remaining }
  },
)

const { div_, label_, input, p_, code_ } = makeDom<State, never>()
const { updateState } = makeEffects<State, never>()

export const view = (state: State) =>
  div_(
    label_('Post title'),
    input(['type', 'text'], ['value', state.title]).onTextInput(
      ({ value: title }) =>
        slugify(title).flatMap(slug => updateState(() => ({ title, slug }))),
    ),
    p_(code_(state.slug || '—')),
  )

export const initialState: State = { title: '', slug: '' }
