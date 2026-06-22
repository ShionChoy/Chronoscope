import { describe, it, expect } from 'vitest'
import { newEvent, touch, softDelete } from './mutations'
import { fromYear } from '../../domain/time'
import type { Clock } from './hlc'

const fixedClock = (t: string): Clock => ({ now: () => t })

describe('mutations', () => {
  it('newEvent stamps ids, timestamps, and defaults', () => {
    const e = newEvent({ title: '登月', start: fromYear(1969, 'year') }, fixedClock('t1'), () => 'id1')
    expect(e).toMatchObject({
      id: 'id1', title: '登月', note: '', categoryId: null,
      tagIds: [], links: [], createdAt: 't1', updatedAt: 't1', deleted: false,
    })
    expect(e.start).toEqual(fromYear(1969, 'year'))
  })
  it('touch applies changes and bumps updatedAt', () => {
    const e = newEvent({ title: 'x' }, fixedClock('t1'), () => 'id1')
    const e2 = touch(e, { title: 'y' }, fixedClock('t2'))
    expect(e2.title).toBe('y')
    expect(e2.updatedAt).toBe('t2')
    expect(e2.createdAt).toBe('t1')
  })
  it('softDelete sets the tombstone and bumps updatedAt', () => {
    const e = newEvent({ title: 'x' }, fixedClock('t1'), () => 'id1')
    const d = softDelete(e, fixedClock('t2'))
    expect(d.deleted).toBe(true)
    expect(d.updatedAt).toBe('t2')
  })
})
