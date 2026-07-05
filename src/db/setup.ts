import type { DbEffect, DbOperation } from './effects'
import type { Index, ObjectStore } from './index'
import type { IndexKeyPath, KeyPath } from './keypath'

type CreateObjectStore = {
  readonly _type: 'CreateObjectStore'
  readonly objectStore: ObjectStore
  readonly keyPath: KeyPath
}

type CreateIndex = {
  readonly _type: 'CreateIndex'
  readonly objectStore: ObjectStore
  readonly index: Index
  readonly keyPath: IndexKeyPath
  readonly unique: boolean
}

type DeleteObjectStore = {
  readonly _type: 'DeleteObjectStore'
  readonly objectStore: ObjectStore
}

type DeleteIndex = {
  readonly _type: 'DeleteIndex'
  readonly objectStore: ObjectStore
  readonly index: Index
}

type GetObjectStoreNames = {
  readonly _type: 'GetObjectStoreNames'
}

type GetIndexNames = {
  readonly _type: 'GetIndexNames'
  readonly objectStore: ObjectStore
}

type RunDbEffect = {
  readonly _type: 'RunDbEffect'
  readonly effect: DbEffect<void>
}

export type DbSetupOperation =
  | CreateObjectStore
  | CreateIndex
  | DeleteObjectStore
  | DeleteIndex
  | GetObjectStoreNames
  | GetIndexNames
  | RunDbEffect

type DbSetupReturn<A> = {
  readonly _type: 'Return'
  readonly value: A
  flatMap<B>(f: (a: A) => DbSetupEffect<B>): DbSetupEffect<B>
  map<B>(f: (a: A) => B): DbSetupEffect<B>
  as<B>(b: B): DbSetupEffect<B>
  void(): DbSetupEffect<void>
}

type DbSetupSuspend<A> = {
  readonly _type: 'Suspend'
  readonly operation: DbSetupOperation
  flatMap<B>(f: (a: A) => DbSetupEffect<B>): DbSetupEffect<B>
  map<B>(f: (a: A) => B): DbSetupEffect<B>
  as<B>(b: B): DbSetupEffect<B>
  void(): DbSetupEffect<void>
}

type DbSetupChain<A> = {
  readonly _type: 'FlatMap'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly effect: DbSetupEffect<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly next: (x: any) => DbSetupEffect<A>
  flatMap<B>(f: (a: A) => DbSetupEffect<B>): DbSetupEffect<B>
  map<B>(f: (a: A) => B): DbSetupEffect<B>
  as<B>(b: B): DbSetupEffect<B>
  void(): DbSetupEffect<void>
}

/** A lazy schema-migration operation that produces a value of type `A`. Run via `runDbEffect`. */
export type DbSetupEffect<A> = DbSetupReturn<A> | DbSetupSuspend<A> | DbSetupChain<A>

function chain<A, B>(
  effect: DbSetupEffect<A>,
  next: (a: A) => DbSetupEffect<B>,
): DbSetupEffect<B> {
  return {
    _type: 'FlatMap',
    effect,
    next,
    flatMap<C>(f: (b: B) => DbSetupEffect<C>): DbSetupEffect<C> {
      return chain(this, f)
    },
    map<C>(f: (b: B) => C): DbSetupEffect<C> {
      return chain(this, b => ret(f(b)))
    },
    as<C>(c: C): DbSetupEffect<C> {
      return chain(this, _ => ret(c))
    },
    void(): DbSetupEffect<void> {
      return this.map(_ => {})
    },
  }
}

function ret<A>(value: A): DbSetupEffect<A> {
  return {
    _type: 'Return',
    value,
    flatMap<B>(f: (a: A) => DbSetupEffect<B>): DbSetupEffect<B> {
      return chain(this, f)
    },
    map<B>(f: (a: A) => B): DbSetupEffect<B> {
      return chain(this, a => ret(f(a)))
    },
    as<B>(b: B): DbSetupEffect<B> {
      return chain(this, _ => ret(b))
    },
    void(): DbSetupEffect<void> {
      return this.map(_ => {})
    },
  }
}

function suspend<A>(operation: DbSetupOperation): DbSetupEffect<A> {
  return {
    _type: 'Suspend',
    operation,
    flatMap<B>(f: (a: A) => DbSetupEffect<B>): DbSetupEffect<B> {
      return chain(this, f)
    },
    map<B>(f: (a: A) => B): DbSetupEffect<B> {
      return chain(this, a => ret(f(a)))
    },
    as<B>(b: B): DbSetupEffect<B> {
      return chain(this, _ => ret(b))
    },
    void(): DbSetupEffect<void> {
      return this.map(_ => {})
    },
  }
}

export function pure<A>(a: A): DbSetupEffect<A> {
  return ret(a)
}

export function noop(): DbSetupEffect<void> {
  return ret(undefined)
}

/** Runs a `DbSetupEffect` against an interpreter callback. Called by the framework; not needed in application code. */
export function run<A>(
  effect: DbSetupEffect<A>,
  interpreter: (op: DbSetupOperation, onComplete: (a: A) => void) => void,
  onComplete: (a: A) => void,
): void {
  switch (effect._type) {
    case 'Return':
      return onComplete(effect.value)
    case 'Suspend':
      return interpreter(effect.operation, onComplete)
    case 'FlatMap':
      return run(effect.effect, interpreter, result =>
        run(effect.next(result), interpreter, onComplete),
      )
  }
}

/** A DbSetupEffect describing the creation of a new object store with the given key path. */
export function createObjectStore(
  objectStore: ObjectStore,
  keyPath: KeyPath,
): DbSetupEffect<void> {
  return suspend({ _type: 'CreateObjectStore', objectStore, keyPath })
}

/** A DbSetupEffect describing the creation of an index on an object store. */
export function createIndex(
  objectStore: ObjectStore,
  index: Index,
  keyPath: IndexKeyPath,
  unique: boolean,
): DbSetupEffect<void> {
  return suspend({ _type: 'CreateIndex', objectStore, index, keyPath, unique })
}

/** A DbSetupEffect describing the deletion of an object store. */
export function deleteObjectStore(
  objectStore: ObjectStore,
): DbSetupEffect<void> {
  return suspend({ _type: 'DeleteObjectStore', objectStore })
}

/** A DbSetupEffect describing the deletion of an index from an object store. */
export function deleteIndex(
  objectStore: ObjectStore,
  index: Index,
): DbSetupEffect<void> {
  return suspend({ _type: 'DeleteIndex', objectStore, index })
}

/** A DbSetupEffect describing a read of all object store names in the database. */
export function getObjectStoreNames(): DbSetupEffect<readonly string[]> {
  return suspend({ _type: 'GetObjectStoreNames' })
}

/** A DbSetupEffect describing a read of all index names on the given object store. */
export function getIndexNames(
  objectStore: ObjectStore,
): DbSetupEffect<readonly string[]> {
  return suspend({ _type: 'GetIndexNames', objectStore })
}

/** A DbSetupEffect describing the embedding of a `DbEffect` inside a setup operation, useful for seeding data during an upgrade. */
export function runDbEffect(effect: DbEffect<void>): DbSetupEffect<void> {
  return suspend({ _type: 'RunDbEffect', effect })
}

export type { DbOperation }
