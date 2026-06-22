import { describe, it, expectTypeOf } from 'vitest'
import type { Syncable, EventRecord, Category, Tag } from './types'

describe('Syncable', () => {
  it('is implemented by all three record types', () => {
    expectTypeOf<EventRecord>().toExtend<Syncable>()
    expectTypeOf<Category>().toExtend<Syncable>()
    expectTypeOf<Tag>().toExtend<Syncable>()
  })
  it('requires updatedAt and deleted on Category and Tag', () => {
    const c: Category = { id: 'c1', name: 'x', parentId: null, color: '#000', order: 0, updatedAt: 't1', deleted: false }
    const t: Tag = { id: 't1', name: 'y', color: '#111', updatedAt: 't1', deleted: false }
    expectTypeOf(c.updatedAt).toBeString()
    expectTypeOf(t.deleted).toBeBoolean()
  })
})
