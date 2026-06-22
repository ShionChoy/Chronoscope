import { describe, it, expect, beforeEach } from 'vitest'
import { createAppStore, type AppStore } from './appStore'
import { createMemoryRepository, type Database } from '../data'
import type { Clock } from '../data'
import type { EventRecord, Category, Tag } from '../domain/model'
import { fromYear } from '../domain/time'
import { visibleEvents } from './selectors'

function makeDb(): Database {
  return {
    events: createMemoryRepository<EventRecord>(),
    categories: createMemoryRepository<Category>(),
    tags: createMemoryRepository<Tag>(),
  }
}

// deterministic monotonically-increasing clock + id generator
function fixtures() {
  let t = 0
  const clock: Clock = { now: () => `t${String(++t).padStart(4, '0')}` }
  let i = 0
  const genId = () => `id${++i}`
  return { clock, genId }
}

let app: AppStore
let db: Database

beforeEach(() => {
  db = makeDb()
  const { clock, genId } = fixtures()
  app = createAppStore({ db, clock, nowYear: 2026, theme: 'day', genId })
})

describe('appStore', () => {
  it('createEvent persists, stamps, and appears in state', async () => {
    const id = await app.createEvent({ title: '登月', start: fromYear(1969, 'year') })
    expect(id).toBe('id1')
    const inDb = await db.events.get('id1')
    expect(inDb?.title).toBe('登月')
    expect(inDb?.updatedAt).toBe('t0001')
    expect(app.store.getState().events.map((e) => e.id)).toEqual(['id1'])
  })

  it('load reads existing records (incl. tombstones) into state', async () => {
    await db.events.put({ id: 'x', title: 'x', note: '', categoryId: null, tagIds: [], links: [], createdAt: 't0', updatedAt: 't0', deleted: true })
    await app.load()
    const s = app.store.getState()
    expect(s.loaded).toBe(true)
    expect(s.events.map((e) => e.id)).toEqual(['x']) // tombstone present in raw state
    expect(visibleEvents(s)).toEqual([]) // but hidden by the selector
  })

  it('updateEvent applies changes and bumps updatedAt', async () => {
    await app.createEvent({ title: 'a' })
    await app.updateEvent('id1', { title: 'b' })
    expect((await db.events.get('id1'))?.title).toBe('b')
    expect(app.store.getState().events[0].title).toBe('b')
    expect(app.store.getState().events[0].updatedAt).toBe('t0002')
  })

  it('deleteEvent tombstones the record (kept in state, hidden by selector)', async () => {
    await app.createEvent({ title: 'a' })
    await app.deleteEvent('id1')
    expect((await db.events.get('id1'))?.deleted).toBe(true)
    expect(visibleEvents(app.store.getState())).toEqual([])
  })

  it('deleteEvent clears selectedId when it points at the deleted event', async () => {
    await app.createEvent({ title: 'a' })
    app.select('id1')
    await app.deleteEvent('id1')
    expect(app.store.getState().selectedId).toBeNull()
  })

  it('createCategory stamps and stores', async () => {
    const id = await app.createCategory({ name: '科技', parentId: null, color: '#0aa' })
    const c = await db.categories.get(id)
    expect(c).toMatchObject({ name: '科技', parentId: null, color: '#0aa', deleted: false })
    expect(c?.updatedAt).toBe('t0001')
    expect(app.store.getState().categories.map((x) => x.id)).toEqual([id])
  })

  it('createTag stamps and stores', async () => {
    const id = await app.createTag({ name: '里程碑' })
    expect((await db.tags.get(id))?.name).toBe('里程碑')
    expect(app.store.getState().tags.map((x) => x.id)).toEqual([id])
  })

  it('setters update only their slice and notify', async () => {
    const seen: number[] = []
    app.store.subscribe(() => seen.push(1))
    app.setFilter({ query: 'moon' })
    app.select('id1')
    app.setView('timeline')
    app.setSort({ key: 'title', dir: 'desc' })
    app.setTheme('night')
    const s = app.store.getState()
    expect(s.filter.query).toBe('moon')
    expect(s.selectedId).toBe('id1')
    expect(s.view).toBe('timeline')
    expect(s.sort).toEqual({ key: 'title', dir: 'desc' })
    expect(s.theme).toBe('night')
    expect(seen.length).toBe(5)
  })

  it('exportSnapshot/importSnapshot round-trips through the data layer', async () => {
    await app.createEvent({ title: 'keep' })
    const file = await app.exportSnapshot()
    expect(file.events.map((e) => e.title)).toEqual(['keep'])
    // a second store importing the file ends up with the event
    const db2 = makeDb()
    const { clock, genId } = fixtures()
    const app2 = createAppStore({ db: db2, clock, nowYear: 2026, theme: 'day', genId })
    await app2.importSnapshot(file)
    expect(app2.store.getState().events.map((e) => e.title)).toContain('keep')
  })
})
