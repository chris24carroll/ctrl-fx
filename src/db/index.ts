/** Branded string representing an IndexedDB database name. */
export type DbName = string & { __brand: 'DbName' }

/** Creates a `DbName`. */
export function dbName(value: string): DbName {
  return value as DbName
}

/** Branded number representing an IndexedDB database schema version. */
export type DbVersion = number & { __brand: 'DbVersion' }

/** Creates a `DbVersion`. */
export function dbVersion(value: number): DbVersion {
  return value as DbVersion
}

/** Branded string representing the name of an IndexedDB object store. */
export type ObjectStore = string & { __brand: 'ObjectStore' }

/** Creates an `ObjectStore` name. */
export function objectStore(value: string): ObjectStore {
  return value as ObjectStore
}

/** Branded string representing the name of an IndexedDB index. */
export type Index = string & { __brand: 'Index' }

/** Creates an `Index` name. */
export function index(value: string): Index {
  return value as Index
}

export type { DbEffect } from './effects'
export {
  add,
  count,
  deleteRecord,
  get,
  getAll,
  noop as dbNoop,
  pure as dbPure,
  put,
} from './effects'

export type { DbSetupEffect } from './setup'
export {
  createIndex,
  createObjectStore,
  deleteIndex,
  deleteObjectStore,
  getIndexNames,
  getObjectStoreNames,
  runDbEffect,
} from './setup'

export type {
  DbError,
  UnexpectedError,
  NotFoundError,
  ConstraintError,
} from './errors'

export {
  autoIncrementPath,
  type AutoIncrementPath,
  type IndexKeyPath,
  type KeyPath,
  type ManualPath,
  type MultiIndexPath,
  type MultiPath,
  type SingleIndexPath,
  manualPath,
  multiIndexPath,
  multiPath,
  singleIndexPath,
} from './keypath'

export type { JsonValue, JsonPrimitive } from '../json'
