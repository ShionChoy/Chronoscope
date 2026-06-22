import { describe, it, expect } from 'vitest'
import { mergeById } from './merge'
import type { Syncable } from '../../domain/model'

const rec = (id: string, updatedAt: string, deleted = false): Syncable => ({ id, updatedAt, deleted })
const byId = (xs: Syncable[]) => Object.fromEntries(xs.map((x) => [x.id, x]))

describe('mergeById', () => {
  it('keeps the newer version of a record', () => {
    const out = byId(mergeById([rec('a', 't1')], [rec('a', 't2')]))
    expect(out.a.updatedAt).toBe('t2')
  })
  it('keeps local when incoming is older', () => {
    const out = byId(mergeById([rec('a', 't3')], [rec('a', 't2')]))
    expect(out.a.updatedAt).toBe('t3')
  })
  it('lets a newer tombstone win and retains it', () => {
    const out = byId(mergeById([rec('a', 't1', false)], [rec('a', 't2', true)]))
    expect(out.a.deleted).toBe(true)
    expect(out.a.updatedAt).toBe('t2')
  })
  it('unions records present on only one side', () => {
    const out = byId(mergeById([rec('a', 't1')], [rec('b', 't1')]))
    expect(Object.keys(out).sort()).toEqual(['a', 'b'])
  })
})
