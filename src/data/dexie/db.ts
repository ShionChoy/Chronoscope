import Dexie, { type Table } from 'dexie'
import type { EventRecord, Category, Tag } from '../../domain/model'

export interface MetaRow {
  key: string
  value: string
}

export class ChronoscopeDB extends Dexie {
  events!: Table<EventRecord, string>
  categories!: Table<Category, string>
  tags!: Table<Tag, string>
  meta!: Table<MetaRow, string>

  constructor(name = 'chronoscope') {
    super(name)
    this.version(1).stores({
      events: 'id',
      categories: 'id',
      tags: 'id',
      meta: 'key',
    })
    // v2 added a `handles` store for the (now-removed) file-binding feature.
    this.version(2).stores({ handles: 'key' })
    // v3 drops it again — binding/import/export were removed.
    this.version(3).stores({ handles: null })
  }
}

export function createChronoscopeDB(name = 'chronoscope'): ChronoscopeDB {
  return new ChronoscopeDB(name)
}
