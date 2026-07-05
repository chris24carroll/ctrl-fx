export const todo: () => never = () => {
  throw new Error('Unimplemented')
}

export function identity<A>(value: A): A {
  return value
}

export function exhaustivenessCheck(value: never): never {
  throw new Error(`Unhandled: ${value}`)
}

// check two values for deep equality
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function eq(value1: any, value2: any): boolean {
  // check for different types
  if (typeof value1 !== typeof value2) {
    return false
  }

  // null and undefined checks
  if (value1 === null) {
    return value2 === null
  }

  if (value2 === null) {
    return false
  }

  if (value1 === undefined) {
    return value2 === undefined
  }

  if (value2 === undefined) {
    return false
  }

  // ignore functions
  if (typeof value1 === 'function') {
    return true
  }

  // primitive comparison
  if (typeof value1 !== 'object') {
    return value1 === value2
  }

  // recursively compare array items
  if (Array.isArray(value1)) {
    if (!Array.isArray(value2)) {
      return false
    }

    if (value1.length != value2.length) {
      return false
    }

    for (let i = 0; i < value1.length; i++) {
      if (!eq(value1[i], value2[i])) {
        return false
      }
    }

    return true
  } else if (Array.isArray(value2)) {
    return false
  }

  // recusively compare object key/value pairs
  if (typeof value1 === 'object') {
    const keys1 = Object.keys(value1)
    const keys2 = Object.keys(value2)

    if (keys1.length !== keys2.length) {
      return false
    }

    for (const key of keys1) {
      if (!Object.prototype.hasOwnProperty.call(value2, key)) {
        return false
      }

      if (!eq(value1[key], value2[key])) {
        return false
      }
    }

    return true
  }

  // if we get this far, we're working with some other type. Its hacky but we'll
  // just compare the string representations
  return `${value1}` === `${value2}`
}

// returns false but lets us narrow types
export function isNever<A>(): [A] extends [never] ? true : false {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return false as any
}

export type Integer = number & { __brand: 'Integer' }

export function int(n: number): Integer {
  if (Number.isInteger(n)) return n as Integer
  else throw new Error(`Not an integer: ${n}`)
}

export function fold<A, B>(items: A[], initial: B, f: (a: A, b: B) => B): B {
  let b: B = initial

  let index = 0

  while (index < items.length) {
    b = f(items[index], b)
    index++
  }

  return b
}

export function exists<A>(
  items: A[],
  predicate: (item: A) => boolean,
): boolean {
  return fold(items, false, (item: A, acc: boolean) => {
    return acc || predicate(item)
  })
}

export function stringToInt(s: string): number | undefined {
  const result = Number.parseInt(s)
  if (Number.isNaN(result)) {
    return undefined
  } else {
    return result
  }
}

export function toggle<K extends keyof O, O extends Record<K, boolean>>(
  obj: O,
  key: K,
): O {
  return {
    ...obj,
    [key]: !obj[key],
  }
}

export function zipWithIndex<A>(as: readonly A[]): [A, number][] {
  return as.map((a, i) => [a, i])
}

export function assertDefined<A>(
  value: A,
  msg: string | undefined = undefined,
): asserts value is NonNullable<A> {
  if (value === null || value === undefined) {
    throw new Error(msg ? msg : 'assertDefined failed')
  }
}

export function pickFrom<T, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = obj[key]
      return acc
    },
    {} as Pick<T, K>,
  )
}

export type NonEmptyArray<A> = [A, ...A[]]

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type DeepReadonly<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T

export function filterNot<A>(
  value: A | undefined,
  f: (a: A) => boolean,
): A | undefined {
  if (value !== undefined) {
    return f(value) ? undefined : value
  } else {
    return undefined
  }
}
