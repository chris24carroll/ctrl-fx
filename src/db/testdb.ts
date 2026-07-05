import type { JsonValue } from '../json'
import type { KeyPath } from './keypath'
import type { DbName, ObjectStore } from './index'

export type DbStoreSnapshot = {
  readonly keyPath: KeyPath
  readonly records: ReadonlyMap<string, JsonValue>
  readonly autoIncrementCounter: number
}

export function serializeIdbKey(key: IDBValidKey): string {
  if (key instanceof Date) return key.toISOString()
  return JSON.stringify(key)
}

export class TestDatabaseData {
  readonly _databases: ReadonlyMap<string, ReadonlyMap<string, DbStoreSnapshot>>

  constructor(
    databases: ReadonlyMap<string, ReadonlyMap<string, DbStoreSnapshot>>,
  ) {
    this._databases = databases
  }

  records(db: DbName, store: ObjectStore): readonly JsonValue[] {
    return [...(this._databases.get(db)?.get(store)?.records.values() ?? [])]
  }

  getByKey(
    db: DbName,
    store: ObjectStore,
    key: IDBValidKey,
  ): JsonValue | undefined {
    return this._databases
      .get(db)
      ?.get(store)
      ?.records.get(serializeIdbKey(key))
  }

  size(db: DbName, store: ObjectStore): number {
    return this._databases.get(db)?.get(store)?.records.size ?? 0
  }

  hasDatabase(db: DbName): boolean {
    return this._databases.has(db)
  }

  hasStore(db: DbName, store: ObjectStore): boolean {
    return this._databases.get(db)?.has(store) ?? false
  }
}
