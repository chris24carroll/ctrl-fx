import { dbVersion, type DbName, type DbVersion, type ObjectStore } from '../db'
import type { DbEffect, DbOperation } from '../db/effects'
import {
  constraintError,
  notFoundError,
  unexpectedError,
  type DbError,
} from '../db/errors'
import type { IndexKeyPath, KeyPath } from '../db/keypath'
import type { DbSetupEffect, DbSetupOperation } from '../db/setup'
import { run as runDbEffect } from '../db/effects'
import { run as runDbSetupEffect } from '../db/setup'
import { failure, success, type Result } from '../utils/result'

export class DbManager {
  private openDatabases = new Map<DbName, IDBDatabase>()

  open(
    db: DbName,
    version: DbVersion,
    setup: (oldVersion: DbVersion) => DbSetupEffect<void>,
    callback: (result: Result<void, DbError>) => void,
  ): void {
    const idbFactory = globalThis.indexedDB
    if (!idbFactory) {
      return callback(
        failure(unexpectedError({ message: 'IndexedDB not supported' })),
      )
    }

    const openRequest = idbFactory.open(db, version)

    openRequest.onblocked = _event => {
      window.alert(
        'A database upgrade is blocked. Please close other tabs with this app.',
      )
    }

    let upgradeError: Error | undefined = undefined

    openRequest.onupgradeneeded = versionChangeEvent => {
      const idbDb = openRequest.result
      const tx = openRequest.transaction
      if (!tx) {
        console.warn('Expected idb transaction to be non-null during upgrade')
        return
      }
      const oldVersion = dbVersion(versionChangeEvent.oldVersion)
      const effect = setup(oldVersion)
      try {
        runDbSetupEffect(effect, setupInterpreter(idbDb, tx), _result => {})
      } catch (err) {
        if (err instanceof Error) upgradeError = err
        throw err
      }
    }

    openRequest.onerror = event => {
      if (upgradeError instanceof DOMException) {
        if (upgradeError.name === 'ConstraintError') {
          return callback(failure(constraintError(upgradeError)))
        }
        if (upgradeError.name === 'NotFoundError') {
          return callback(failure(notFoundError(upgradeError)))
        }
      }
      return callback(
        failure(
          unexpectedError({
            message: extractMessage(event),
            cause: upgradeError,
          }),
        ),
      )
    }

    openRequest.onsuccess = _event => {
      this.openDatabases.set(db, openRequest.result)
      callback(success(undefined))
    }
  }

  runTransaction(
    db: DbName,
    objectStores: readonly ObjectStore[],
    mode: 'readonly' | 'readwrite',
    effect: DbEffect<void>,
    callback: (result: Result<void, DbError>) => void,
  ): void {
    const idbDb = this.openDatabases.get(db)
    if (!idbDb) {
      return callback(
        failure(unexpectedError({ message: `Database '${db}' is not open` })),
      )
    }

    const tx = idbDb.transaction([...objectStores], mode)
    let txError: DOMException | null = null

    tx.onerror = _event => {
      txError = tx.error
    }

    tx.onabort = _event => {
      if (txError !== null) {
        if (txError.name === 'ConstraintError') {
          return callback(failure(constraintError(txError)))
        }
        if (txError.name === 'NotFoundError') {
          return callback(failure(notFoundError(txError)))
        }
        return callback(failure(unexpectedError({ cause: txError })))
      }
      return callback(
        failure(unexpectedError({ message: 'Transaction aborted' })),
      )
    }

    tx.oncomplete = _event => {
      callback(success(undefined))
    }

    runDbEffect(effect, dbInterpreter(tx), _result => {})
  }
}

function setupInterpreter(
  db: IDBDatabase,
  tx: IDBTransaction,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (op: DbSetupOperation, onComplete: (a: any) => void) => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (op: DbSetupOperation, onComplete: (a: any) => void): void => {
    switch (op._type) {
      case 'CreateObjectStore': {
        db.createObjectStore(op.objectStore, objectStoreKeyOptions(op.keyPath))
        onComplete(undefined)
        return
      }
      case 'CreateIndex': {
        const store = tx.objectStore(op.objectStore)
        store.createIndex(op.index, indexKeyPathValue(op.keyPath), {
          unique: op.unique,
        })
        onComplete(undefined)
        return
      }
      case 'DeleteObjectStore': {
        db.deleteObjectStore(op.objectStore)
        onComplete(undefined)
        return
      }
      case 'DeleteIndex': {
        const store = tx.objectStore(op.objectStore)
        store.deleteIndex(op.index)
        onComplete(undefined)
        return
      }
      case 'GetObjectStoreNames': {
        onComplete(Array.from(db.objectStoreNames))
        return
      }
      case 'GetIndexNames': {
        const store = tx.objectStore(op.objectStore)
        onComplete(Array.from(store.indexNames))
        return
      }
      case 'RunDbEffect': {
        runDbEffect(op.effect, dbInterpreter(tx), _result =>
          onComplete(undefined),
        )
        return
      }
    }
  }
}

function dbInterpreter(
  tx: IDBTransaction,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (op: DbOperation, onComplete: (a: any) => void) => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (op: DbOperation, onComplete: (a: any) => void): void => {
    switch (op._type) {
      case 'Add': {
        const req = tx.objectStore(op.objectStore).add(op.value)
        req.onsuccess = () => onComplete(undefined)
        return
      }
      case 'Put': {
        const req = tx.objectStore(op.objectStore).put(op.value)
        req.onsuccess = () => onComplete(undefined)
        return
      }
      case 'Get': {
        const req = tx.objectStore(op.objectStore).get(op.key)
        req.onsuccess = () => onComplete(req.result ?? undefined)
        return
      }
      case 'GetAll': {
        const req = tx.objectStore(op.objectStore).getAll()
        req.onsuccess = () => onComplete(req.result)
        return
      }
      case 'Delete': {
        const req = tx.objectStore(op.objectStore).delete(op.key)
        req.onsuccess = () => onComplete(undefined)
        return
      }
      case 'Count': {
        const req = tx.objectStore(op.objectStore).count()
        req.onsuccess = () => onComplete(req.result)
        return
      }
    }
  }
}

function objectStoreKeyOptions(keyPath: KeyPath): IDBObjectStoreParameters {
  switch (keyPath._type) {
    case 'AutoIncrement':
      return { keyPath: keyPath.value, autoIncrement: true }
    case 'Manual':
      return { keyPath: keyPath.value, autoIncrement: false }
    case 'Multi':
      return {
        keyPath: [keyPath.first, keyPath.second, ...keyPath.rest],
        autoIncrement: false,
      }
  }
}

function indexKeyPathValue(keyPath: IndexKeyPath): string | string[] {
  switch (keyPath._type) {
    case 'SingleIndex':
      return keyPath.value
    case 'MultiIndex':
      return [keyPath.first, keyPath.second, ...keyPath.rest]
  }
}

function extractMessage(event: Event): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = (event as any).message
  if (typeof m === 'string') return m
  if (m != null) return `${m}`
  return undefined
}
