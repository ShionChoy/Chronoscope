import type { Syncable } from '../../domain/model'
import { compareHLC } from './hlc'

export function mergeById<T extends Syncable>(local: T[], incoming: T[]): T[] {
  const map = new Map<string, T>()
  for (const r of local) map.set(r.id, r)
  for (const r of incoming) {
    const existing = map.get(r.id)
    if (!existing || compareHLC(r.updatedAt, existing.updatedAt) > 0) {
      map.set(r.id, r)
    }
  }
  return [...map.values()]
}
