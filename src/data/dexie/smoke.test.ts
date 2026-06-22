import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import Dexie, { type Table } from 'dexie'

interface Row { id: string; v: number }

describe('dexie + fake-indexeddb', () => {
  it('persists and reads a row in the node test env', async () => {
    const db = new Dexie('smoke') as Dexie & { rows: Table<Row, string> }
    db.version(1).stores({ rows: 'id' })
    await db.rows.put({ id: 'a', v: 1 })
    expect(await db.rows.get('a')).toEqual({ id: 'a', v: 1 })
    db.close()
  })
})
