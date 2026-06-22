import type { Id, EventRecord, Category, Tag } from '../../domain/model'

export interface Repository<T extends { id: Id }> {
  getAll(): Promise<T[]>
  get(id: Id): Promise<T | undefined>
  put(record: T): Promise<void>
  bulkPut(records: T[]): Promise<void>
}

export interface Database {
  events: Repository<EventRecord>
  categories: Repository<Category>
  tags: Repository<Tag>
}
