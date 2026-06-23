import {
  newEvent,
  touch,
  softDelete,
  exportData,
  importData,
  type Database,
  type Clock,
  type NewEventFields,
  type ExportFile,
} from '../data'
import type { EventRecord, Category, Tag, Id } from '../domain/model'
import { createStore, type Store } from './store'
import { initialAppState, type AppState, type Filter, type Sort, type Theme, type View } from './types'

export interface AppStoreDeps {
  db: Database
  clock: Clock
  nowYear: number
  theme: Theme
  genId?: () => string
}

export interface AppStore {
  store: Store<AppState>
  load(): Promise<void>
  createEvent(fields: NewEventFields): Promise<Id>
  updateEvent(id: Id, changes: Partial<EventRecord>): Promise<void>
  deleteEvent(id: Id): Promise<void>
  createCategory(fields: { name: string; parentId?: Id | null; color?: string; order?: number }): Promise<Id>
  updateCategory(id: Id, changes: Partial<Category>): Promise<void>
  deleteCategory(id: Id): Promise<void>
  createTag(fields: { name: string; color?: string }): Promise<Id>
  updateTag(id: Id, changes: Partial<Tag>): Promise<void>
  deleteTag(id: Id): Promise<void>
  setFilter(patch: Partial<Filter>): void
  select(id: Id | null): void
  setView(view: View): void
  setSort(sort: Sort): void
  setTheme(theme: Theme): void
  exportSnapshot(): Promise<ExportFile>
  importSnapshot(file: ExportFile): Promise<void>
}

// replace the record with matching id, or append if new
function upsert<T extends { id: Id }>(list: T[], rec: T): T[] {
  const i = list.findIndex((x) => x.id === rec.id)
  if (i === -1) return [...list, rec]
  const copy = list.slice()
  copy[i] = rec
  return copy
}

export function createAppStore(deps: AppStoreDeps): AppStore {
  const { db, clock, nowYear, theme } = deps
  const genId = deps.genId ?? (() => crypto.randomUUID())
  const store = createStore<AppState>(initialAppState(nowYear, theme))

  async function load(): Promise<void> {
    const [events, categories, tags] = await Promise.all([
      db.events.getAll(),
      db.categories.getAll(),
      db.tags.getAll(),
    ])
    store.setState((s) => ({ ...s, events, categories, tags, loaded: true }))
  }

  return {
    store,
    load,

    async createEvent(fields) {
      const record = newEvent(fields, clock, genId)
      await db.events.put(record)
      store.setState((s) => ({ ...s, events: upsert(s.events, record) }))
      return record.id
    },

    async updateEvent(id, changes) {
      const current = store.getState().events.find((e) => e.id === id)
      if (!current) throw new Error(`updateEvent: no event ${id}`)
      const next = touch(current, changes, clock)
      await db.events.put(next)
      store.setState((s) => ({ ...s, events: upsert(s.events, next) }))
    },

    async deleteEvent(id) {
      const current = store.getState().events.find((e) => e.id === id)
      if (!current) throw new Error(`deleteEvent: no event ${id}`)
      const next = softDelete(current, clock)
      await db.events.put(next)
      store.setState((s) => ({
        ...s,
        events: upsert(s.events, next),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }))
    },

    async createCategory(fields) {
      const cat: Category = {
        id: genId(),
        name: fields.name,
        parentId: fields.parentId ?? null,
        color: fields.color ?? '#888888',
        order: fields.order ?? 0,
        updatedAt: clock.now(),
        deleted: false,
      }
      await db.categories.put(cat)
      store.setState((s) => ({ ...s, categories: upsert(s.categories, cat) }))
      return cat.id
    },

    async updateCategory(id, changes) {
      const current = store.getState().categories.find((c) => c.id === id)
      if (!current) throw new Error(`updateCategory: no category ${id}`)
      const next = touch(current, changes, clock)
      await db.categories.put(next)
      store.setState((s) => ({ ...s, categories: upsert(s.categories, next) }))
    },

    async deleteCategory(id) {
      const current = store.getState().categories.find((c) => c.id === id)
      if (!current) throw new Error(`deleteCategory: no category ${id}`)
      const next = softDelete(current, clock)
      await db.categories.put(next)
      store.setState((s) => ({ ...s, categories: upsert(s.categories, next) }))
    },

    async createTag(fields) {
      const t: Tag = {
        id: genId(),
        name: fields.name,
        color: fields.color ?? '#888888',
        updatedAt: clock.now(),
        deleted: false,
      }
      await db.tags.put(t)
      store.setState((s) => ({ ...s, tags: upsert(s.tags, t) }))
      return t.id
    },

    async updateTag(id, changes) {
      const current = store.getState().tags.find((t) => t.id === id)
      if (!current) throw new Error(`updateTag: no tag ${id}`)
      const next = touch(current, changes, clock)
      await db.tags.put(next)
      store.setState((s) => ({ ...s, tags: upsert(s.tags, next) }))
    },

    async deleteTag(id) {
      const current = store.getState().tags.find((t) => t.id === id)
      if (!current) throw new Error(`deleteTag: no tag ${id}`)
      const next = softDelete(current, clock)
      await db.tags.put(next)
      store.setState((s) => ({ ...s, tags: upsert(s.tags, next) }))
    },

    setFilter(patch) {
      store.setState((s) => ({ ...s, filter: { ...s.filter, ...patch } }))
    },
    select(id) {
      store.setState((s) => ({ ...s, selectedId: id }))
    },
    setView(view) {
      // Selection is per-view: clearing it on a view switch keeps a row
      // selected in the list from popping the timeline's detail card (and
      // vice-versa) for something the user never picked in the new view.
      store.setState((s) => ({ ...s, view, selectedId: null }))
    },
    setSort(sort) {
      store.setState((s) => ({ ...s, sort }))
    },
    setTheme(t) {
      store.setState((s) => ({ ...s, theme: t }))
    },

    async exportSnapshot() {
      return exportData(db)
    },
    async importSnapshot(file) {
      await importData(file, db)
      await load()
    },
  }
}
