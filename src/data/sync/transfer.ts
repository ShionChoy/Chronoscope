import type { Database } from '../repositories/types'
import type { EventRecord, Category, Tag } from '../../domain/model'
import { mergeById } from './merge'

export const EXPORT_VERSION = 1

export interface ExportFile {
  version: number
  exportedAt: string
  events: EventRecord[]
  categories: Category[]
  tags: Tag[]
}

export async function exportData(
  db: Database,
  nowIso: () => string = () => new Date().toISOString(),
): Promise<ExportFile> {
  return {
    version: EXPORT_VERSION,
    exportedAt: nowIso(),
    events: await db.events.getAll(),
    categories: await db.categories.getAll(),
    tags: await db.tags.getAll(),
  }
}

export async function importData(file: ExportFile, db: Database): Promise<void> {
  await db.events.bulkPut(mergeById(await db.events.getAll(), file.events))
  await db.categories.bulkPut(mergeById(await db.categories.getAll(), file.categories))
  await db.tags.bulkPut(mergeById(await db.tags.getAll(), file.tags))
}
