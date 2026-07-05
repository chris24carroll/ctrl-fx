/** A pair of get/set functions that focus on a field `A` within a structure `S`. */
export type Lens<S, A> = {
  /** Reads the focused field from `S`. */
  get: (source: S) => A
  /** Returns a new `S` with the focused field replaced. */
  set: (source: S, value: A) => S
}

/** Creates a Lens focused on a single property of `S`. Usage: `lensFromProp<S>()('propName')`. */
export function lensFromProp<S>() {
  return <K extends keyof S>(key: K): Lens<S, S[K]> => ({
    get: s => s[key],
    set: (s, a) => ({ ...s, [key]: a }),
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PathValue<S, Keys extends readonly any[]> = Keys extends [
  infer K,
  ...infer Rest,
]
  ? K extends keyof S
    ? Rest extends []
      ? S[K]
      : PathValue<S[K], Rest>
    : never
  : S

/** Creates a Lens focused on a nested path within `S`. Usage: `lensFromPath<S>()('a', 'b', 'c')`. */
export function lensFromPath<S>() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Keys extends readonly (keyof any)[]>(
    ...keys: [...Keys]
  ): Lens<S, PathValue<S, Keys>> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lens = lensFromProp<any>()(keys[0])
    for (let i = 1; i < keys.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lens = composeLenses(lens, lensFromProp<any>()(keys[i]))
    }
    return lens
  }
}

/** Composes two lenses, focusing first through `ab` then through `bc`. */
export function composeLenses<A, B, C>(
  ab: Lens<A, B>,
  bc: Lens<B, C>,
): Lens<A, C> {
  return {
    get: a => bc.get(ab.get(a)),
    set: (a, c) => ab.set(a, bc.set(ab.get(a), c)),
  }
}
