import type { JsonValue } from '../json'
import type { ObjectStore } from './index'

type DbAdd = {
  readonly _type: 'Add'
  readonly objectStore: ObjectStore
  readonly value: JsonValue
}

type DbPut = {
  readonly _type: 'Put'
  readonly objectStore: ObjectStore
  readonly value: JsonValue
}

type DbGet = {
  readonly _type: 'Get'
  readonly objectStore: ObjectStore
  readonly key: IDBValidKey
}

type DbGetAll = {
  readonly _type: 'GetAll'
  readonly objectStore: ObjectStore
}

type DbDelete = {
  readonly _type: 'Delete'
  readonly objectStore: ObjectStore
  readonly key: IDBValidKey
}

type DbCount = {
  readonly _type: 'Count'
  readonly objectStore: ObjectStore
}

export type DbOperation = DbAdd | DbPut | DbGet | DbGetAll | DbDelete | DbCount

type DbReturn<A> = {
  readonly _type: 'Return'
  readonly value: A
  flatMap<B>(f: (a: A) => DbEffect<B>): DbEffect<B>
  map<B>(f: (a: A) => B): DbEffect<B>
  as<B>(b: B): DbEffect<B>
  void(): DbEffect<void>
}

type DbSuspend<A> = {
  readonly _type: 'Suspend'
  readonly operation: DbOperation
  flatMap<B>(f: (a: A) => DbEffect<B>): DbEffect<B>
  map<B>(f: (a: A) => B): DbEffect<B>
  as<B>(b: B): DbEffect<B>
  void(): DbEffect<void>
}

type DbChain<A> = {
  readonly _type: 'FlatMap'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly effect: DbEffect<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly next: (x: any) => DbEffect<A>
  flatMap<B>(f: (a: A) => DbEffect<B>): DbEffect<B>
  map<B>(f: (a: A) => B): DbEffect<B>
  as<B>(b: B): DbEffect<B>
  void(): DbEffect<void>
}

/** A lazy, composable IndexedDB operation that produces a value of type `A`. Chain with `.flatMap`. */
export type DbEffect<A> = DbReturn<A> | DbSuspend<A> | DbChain<A>

function chain<A, B>(effect: DbEffect<A>, next: (a: A) => DbEffect<B>): DbEffect<B> {
  return {
    _type: 'FlatMap',
    effect,
    next,
    flatMap<C>(f: (b: B) => DbEffect<C>): DbEffect<C> {
      return chain(this, f)
    },
    map<C>(f: (b: B) => C): DbEffect<C> {
      return chain(this, b => ret(f(b)))
    },
    as<C>(c: C): DbEffect<C> {
      return chain(this, _ => ret(c))
    },
    void(): DbEffect<void> {
      return this.map(_ => {})
    },
  }
}

function ret<A>(value: A): DbEffect<A> {
  return {
    _type: 'Return',
    value,
    flatMap<B>(f: (a: A) => DbEffect<B>): DbEffect<B> {
      return chain(this, f)
    },
    map<B>(f: (a: A) => B): DbEffect<B> {
      return chain(this, a => ret(f(a)))
    },
    as<B>(b: B): DbEffect<B> {
      return chain(this, _ => ret(b))
    },
    void(): DbEffect<void> {
      return this.map(_ => {})
    },
  }
}

function suspend<A>(operation: DbOperation): DbEffect<A> {
  return {
    _type: 'Suspend',
    operation,
    flatMap<B>(f: (a: A) => DbEffect<B>): DbEffect<B> {
      return chain(this, f)
    },
    map<B>(f: (a: A) => B): DbEffect<B> {
      return chain(this, a => ret(f(a)))
    },
    as<B>(b: B): DbEffect<B> {
      return chain(this, _ => ret(b))
    },
    void(): DbEffect<void> {
      return this.map(_ => {})
    },
  }
}

/** Lifts a plain value into a `DbEffect` without performing any database operation. */
export function pure<A>(a: A): DbEffect<A> {
  return ret(a)
}

/** A `DbEffect` that does nothing. Useful as a no-op in conditional chains. */
export function noop(): DbEffect<void> {
  return ret(undefined)
}

/** Runs a `DbEffect` against an interpreter callback. Called by the framework; not needed in application code. */
export function run<A>(
  effect: DbEffect<A>,
  interpreter: (op: DbOperation, onComplete: (a: A) => void) => void,
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

/** A DbEffect describing an insert of `value` into `objectStore`. Fails if a record with the same key already exists. */
export function add(
  objectStore: ObjectStore,
  value: JsonValue,
): DbEffect<void> {
  return suspend({ _type: 'Add', objectStore, value })
}

/** A DbEffect describing an insert-or-replace of `value` in `objectStore` (upsert). */
export function put(
  objectStore: ObjectStore,
  value: JsonValue,
): DbEffect<void> {
  return suspend({ _type: 'Put', objectStore, value })
}

/** A DbEffect describing a retrieval of the record with `key` from `objectStore`, or `undefined` if not found. */
export function get(
  objectStore: ObjectStore,
  key: IDBValidKey,
): DbEffect<JsonValue | undefined> {
  return suspend({ _type: 'Get', objectStore, key })
}

/** A DbEffect describing a retrieval of all records from `objectStore`. */
export function getAll(objectStore: ObjectStore): DbEffect<JsonValue[]> {
  return suspend({ _type: 'GetAll', objectStore })
}

/** A DbEffect describing the deletion of the record with `key` from `objectStore`. */
export function deleteRecord(
  objectStore: ObjectStore,
  key: IDBValidKey,
): DbEffect<void> {
  return suspend({ _type: 'Delete', objectStore, key })
}

/** A DbEffect describing a record count in `objectStore`. */
export function count(objectStore: ObjectStore): DbEffect<number> {
  return suspend({ _type: 'Count', objectStore })
}
