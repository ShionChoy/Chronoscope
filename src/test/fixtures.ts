import type { EventRecord, Category, Tag } from '../domain/model'
import { fromYear } from '../domain/time'

export function ev(over: Partial<EventRecord> & { id: string }): EventRecord {
  return {
    title: over.id,
    note: '',
    categoryId: null,
    tagIds: [],
    links: [],
    createdAt: 't0',
    updatedAt: 't0',
    deleted: false,
    ...over,
  }
}

export function cat(over: Partial<Category> & { id: string }): Category {
  return { name: over.id, parentId: null, color: '#888', order: 0, updatedAt: 't0', deleted: false, ...over }
}

export function tag(over: Partial<Tag> & { id: string }): Tag {
  return { name: over.id, color: '#888', updatedAt: 't0', deleted: false, ...over }
}

export const y = (year: number) => fromYear(year, 'year')
