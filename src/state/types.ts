import type { EventRecord, Category, Tag, Id } from '../domain/model'

export type Theme = 'day' | 'night'
export type View = 'list' | 'timeline'
export type TagMode = 'and' | 'or'

export interface Filter {
  categoryId: Id | null
  tagIds: Id[]
  tagMode: TagMode
  query: string
}

export interface Sort {
  key: 'start' | 'title' | 'category' | 'updated'
  dir: 'asc' | 'desc'
}

export interface AppState {
  events: EventRecord[]
  categories: Category[]
  tags: Tag[]
  filter: Filter
  selectedId: Id | null
  view: View
  sort: Sort
  theme: Theme
  nowYear: number
  loaded: boolean
}

export function initialAppState(nowYear: number, theme: Theme): AppState {
  return {
    events: [],
    categories: [],
    tags: [],
    filter: { categoryId: null, tagIds: [], tagMode: 'or', query: '' },
    selectedId: null,
    view: 'list',
    sort: { key: 'start', dir: 'asc' },
    theme,
    nowYear,
    loaded: false,
  }
}
