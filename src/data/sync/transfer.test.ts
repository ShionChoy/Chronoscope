import { describe, it, expect } from 'vitest'
import { exportData, importData, EXPORT_VERSION } from './transfer'
import { createMemoryRepository } from '../repositories/memory'
import type { Database } from '../repositories/types'
import type { EventRecord, Category, Tag } from '../../domain/model'

const ev = (id: string, t: string, deleted = false): EventRecord => ({
  id, title: id, note: '', categoryId: null, tagIds: [], links: [],
  createdAt: t, updatedAt: t, deleted,
})

function makeDb(events: EventRecord[] = []): Database {
  return {
    events: createMemoryRepository<EventRecord>(events),
    categories: createMemoryRepository<Category>(),
    tags: createMemoryRepository<Tag>(),
  }
}

describe('transfer', () => {
  it('exportData dumps a versioned snapshot including tombstones', async () => {
    const db = makeDb([ev('a', 't1'), ev('b', 't1', true)])
    const file = await exportData(db, () => '2026-06-21T00:00:00.000Z')
    expect(file.version).toBe(EXPORT_VERSION)
    expect(file.exportedAt).toBe('2026-06-21T00:00:00.000Z')
    expect(file.events.map((e) => e.id).sort()).toEqual(['a', 'b'])
  })
  it('importData merges by LWW: newer incoming wins, older is ignored', async () => {
    const db = makeDb([ev('a', 't1'), ev('c', 't5')])
    const file: any = {
      version: EXPORT_VERSION, exportedAt: 'x',
      events: [ev('a', 't9'), ev('c', 't1'), ev('d', 't1')],
      categories: [], tags: [],
    }
    await importData(file, db)
    const out = Object.fromEntries((await db.events.getAll()).map((e) => [e.id, e.updatedAt]))
    expect(out.a).toBe('t9') // incoming newer
    expect(out.c).toBe('t5') // local newer kept
    expect(out.d).toBe('t1') // new id added
  })
})
