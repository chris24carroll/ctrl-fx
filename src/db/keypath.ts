export type AutoIncrementPath = {
  readonly _type: 'AutoIncrement'
  readonly value: string
}

export type ManualPath = {
  readonly _type: 'Manual'
  readonly value: string
}

export type MultiPath = {
  readonly _type: 'Multi'
  readonly first: string
  readonly second: string
  readonly rest: readonly string[]
}

/** Describes how an object store's primary key is derived from stored values. */
export type KeyPath = AutoIncrementPath | ManualPath | MultiPath

/** Key is stored under `value` and auto-incremented by IndexedDB if absent. */
export function autoIncrementPath(value: string): KeyPath {
  return { _type: 'AutoIncrement', value }
}

/** Key is read from the `value` property of each stored object; caller must provide it. */
export function manualPath(value: string): KeyPath {
  return { _type: 'Manual', value }
}

/** Key is a compound of two or more property paths. */
export function multiPath(
  first: string,
  second: string,
  ...rest: string[]
): KeyPath {
  return { _type: 'Multi', first, second, rest }
}

export type SingleIndexPath = {
  readonly _type: 'SingleIndex'
  readonly value: string
}

export type MultiIndexPath = {
  readonly _type: 'MultiIndex'
  readonly first: string
  readonly second: string
  readonly rest: readonly string[]
  readonly multiEntry: boolean
}

/** Describes how an IndexedDB index key is derived from stored values. */
export type IndexKeyPath = SingleIndexPath | MultiIndexPath

/** Index key is read from a single property. */
export function singleIndexPath(value: string): IndexKeyPath {
  return { _type: 'SingleIndex', value }
}

/** Index key is a compound of two or more properties. Set `multiEntry: true` to index array values individually. */
export function multiIndexPath(
  first: string,
  second: string,
  rest: readonly string[],
  multiEntry: boolean,
): IndexKeyPath {
  return { _type: 'MultiIndex', first, second, rest, multiEntry }
}
