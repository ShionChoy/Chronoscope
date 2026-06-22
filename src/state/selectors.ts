import type { EventRecord, Category, Id } from '../domain/model'
import { instantOf } from '../domain/time'
import type { AppState, Filter, Sort } from './types'

export function descendantCategoryIds(categories: Category[], rootId: Id): Set<Id> {
  const childrenOf = new Map<Id | null, Category[]>()
  for (const c of categories) {
    if (c.deleted) continue
    const arr = childrenOf.get(c.parentId) ?? []
    arr.push(c)
    childrenOf.set(c.parentId, arr)
  }
  const out = new Set<Id>()
  const walk = (id: Id) => {
    if (out.has(id)) return
    out.add(id)
    for (const child of childrenOf.get(id) ?? []) walk(child.id)
  }
  walk(rootId)
  return out
}

export interface CategoryNode {
  category: Category
  children: CategoryNode[]
}

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const live = categories.filter((c) => !c.deleted).sort((a, b) => a.order - b.order)
  const byParent = new Map<Id | null, Category[]>()
  for (const c of live) {
    const arr = byParent.get(c.parentId) ?? []
    arr.push(c)
    byParent.set(c.parentId, arr)
  }
  const build = (parentId: Id | null): CategoryNode[] =>
    (byParent.get(parentId) ?? []).map((c) => ({ category: c, children: build(c.id) }))
  return build(null)
}

function matchesFilter(e: EventRecord, filter: Filter, categories: Category[]): boolean {
  if (filter.categoryId) {
    const ids = descendantCategoryIds(categories, filter.categoryId)
    if (!e.categoryId || !ids.has(e.categoryId)) return false
  }
  if (filter.tagIds.length > 0) {
    const has = (t: Id) => e.tagIds.includes(t)
    if (filter.tagMode === 'and' ? !filter.tagIds.every(has) : !filter.tagIds.some(has)) return false
  }
  const q = filter.query.trim().toLowerCase()
  if (q && !`${e.title} ${e.note}`.toLowerCase().includes(q)) return false
  return true
}

function sortValue(e: EventRecord, sort: Sort, catName: (id: Id | null) => string): number | string {
  switch (sort.key) {
    case 'start':
      return e.start ? instantOf(e.start) : e.end ? instantOf(e.end) : Number.POSITIVE_INFINITY
    case 'title':
      return e.title
    case 'category':
      return e.categoryId != null ? catName(e.categoryId) : '￿'
    case 'updated':
      return e.updatedAt
  }
}

export function visibleEvents(state: AppState): EventRecord[] {
  const cats = state.categories
  const catName = (id: Id | null) => cats.find((c) => c.id === id)?.name ?? ''
  const filtered = state.events.filter((e) => !e.deleted && matchesFilter(e, state.filter, cats))
  const dir = state.sort.dir === 'asc' ? 1 : -1
  return [...filtered].sort((a, b) => {
    const va = sortValue(a, state.sort, catName)
    const vb = sortValue(b, state.sort, catName)
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb)) * dir
  })
}
