import type { TimePoint } from '../time'

export type Id = string

export interface Syncable {
  id: Id
  updatedAt: string // HLC timestamp
  deleted: boolean
}

export interface EventRecord extends Syncable {
  title: string
  start?: TimePoint
  end?: TimePoint
  note: string
  categoryId: Id | null
  tagIds: Id[]
  links: Id[]
  createdAt: string // HLC timestamp
}

export interface Category extends Syncable {
  name: string
  parentId: Id | null
  color: string
  order: number
}

export interface Tag extends Syncable {
  name: string
  color: string
}
