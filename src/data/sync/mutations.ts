import type { EventRecord, Id, Syncable } from '../../domain/model'
import type { TimePoint } from '../../domain/time'
import type { Clock } from './hlc'

export interface NewEventFields {
  title: string
  start?: TimePoint
  end?: TimePoint
  note?: string
  categoryId?: Id | null
  tagIds?: Id[]
  links?: Id[]
}

export function newEvent(
  fields: NewEventFields,
  clock: Clock,
  genId: () => string = () => crypto.randomUUID(),
): EventRecord {
  const ts = clock.now()
  return {
    id: genId(),
    title: fields.title,
    start: fields.start,
    end: fields.end,
    note: fields.note ?? '',
    categoryId: fields.categoryId ?? null,
    tagIds: fields.tagIds ?? [],
    links: fields.links ?? [],
    createdAt: ts,
    updatedAt: ts,
    deleted: false,
  }
}

export function touch<T extends Syncable>(record: T, changes: Partial<T>, clock: Clock): T {
  return { ...record, ...changes, updatedAt: clock.now() }
}

export function softDelete<T extends Syncable>(record: T, clock: Clock): T {
  return { ...record, deleted: true, updatedAt: clock.now() }
}
