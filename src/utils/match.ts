/** Intermediate builder returned by `match(x)` — call `.on(key)` to specify the discriminant. */
export type MatcherScrutinee<UnionType> = {
  scrutinee: UnionType

  on<DiscriminantKey extends keyof UnionType>(
    k: DiscriminantKey,
  ): MatcherScrutineeAndDiscriminantKey<UnionType, DiscriminantKey>
}

/** Intermediate builder returned by `match(x).on(key)` — call `.with(handlers)` to complete the match. */
export type MatcherScrutineeAndDiscriminantKey<
  UnionType,
  DiscriminantKey extends keyof UnionType,
> = {
  scrutinee: UnionType
  key: DiscriminantKey
  /** Dispatches to the handler for the matching variant and returns its result. */
  with<Result>(handlers: {
    [K in UnionType[DiscriminantKey] & string]: (
      v: Extract<UnionType, Record<DiscriminantKey, K>>,
    ) => Result
  }): Result
}

/** Starts a type-safe exhaustive match on `scrutinee`. */
export function match<UnionType>(
  scrutinee: UnionType,
): MatcherScrutinee<UnionType> {
  return {
    scrutinee,
    on<DiscriminantKey extends keyof UnionType>(
      key: DiscriminantKey,
    ): MatcherScrutineeAndDiscriminantKey<UnionType, DiscriminantKey> {
      return {
        scrutinee,
        key,
        with<Result>(handlers: {
          [K in UnionType[DiscriminantKey] & string]: (
            v: Extract<UnionType, Record<DiscriminantKey, K>>,
          ) => Result
        }) {
          const k = scrutinee[key] as UnionType[DiscriminantKey] & string

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return handlers[k](scrutinee as any)
        },
      }
    },
  }
}

type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'triangle'; base: number; height: number }

const shape: Shape = { kind: 'circle', radius: 5 }

function logShape(shape: Shape): void {
  match(shape)
    .on('kind')
    .with({
      circle: shape => console.log('circle of radius: ' + shape.radius),
      square: shape => console.log('square of size ' + shape.size),
      triangle: shape =>
        console.log(
          `triangle with base ${shape.base} and height ${shape.height}`,
        ),
    })
}

logShape(shape)
