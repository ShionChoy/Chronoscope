import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { openDatabase } from './repository'
import { importData, EXPORT_VERSION } from '../sync/transfer'
import type { EventRecord, Category, Tag } from '../../domain/model'

const ev = (id: string, t: string, deleted = false): EventRecord => ({
  id, title: id, note: '', categoryId: null, tagIds: [], links: [],
  createdAt: t, updatedAt: t, deleted,
})

let n = 0
const freshName = () => `chrono-xfer-${Date.now()}-${n++}`

describe('transfer integration (real IndexedDB via fake-indexeddb)', () => {
  it('importData merges by LWW through real Dexie: newer-incoming wins, local-newer kept, new id added', async () => {
    const { db, events, categories, tags } = openDatabase(freshName())

    // Seed local state: 'a' at t1, 'c' at t5
    await events.bulkPut([ev('a', 't1'), ev('c', 't5')])

    const file = {
      version: EXPORT_VERSION,
      exportedAt: '2026-06-22T00:00:00.000Z',
      events: [ev('a', 't9'), ev('c', 't1'), ev('d', 't1')],
      categories: [] as Category[],
      tags: [] as Tag[],
    }

    // Pass the Dexie-backed Database to importData
    await importData(file, { events, categories, tags })

    const out = Object.fromEntries((await events.getAll()).map((e) => [e.id, e.updatedAt]))
    expect(out.a).toBe('t9') // incoming newer wins
    expect(out.c).toBe('t5') // local newer kept
    expect(out.d).toBe('t1') // new id added

    db.close()
  })
})
