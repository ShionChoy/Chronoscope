import type { TimePoint } from '../time'

export type Id = string

export interface EventRecord {
  id: Id
  title: string
  start?: TimePoint
  end?: TimePoint
  note: string
  categoryId: Id | null
  tagIds: Id[]
  links: Id[]
  createdAt: string // HLC timestamp (Plan 2)
  updatedAt: string // HLC timestamp (Plan 2)
  deleted: boolean
}

export interface Category {
  id: Id
  name: string
  parentId: Id | null
  color: string
  order: number
}

export interface Tag {
  id: Id
  name: string
  color: string
}
