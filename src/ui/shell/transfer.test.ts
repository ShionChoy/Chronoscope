import { describe, it, expect } from 'vitest'
import { exportFilename, serializeSnapshot, parseSnapshot } from './transfer'
import type { ExportFile } from '../../data'

const file: ExportFile = { version: 1, exportedAt: 'x', events: [], categories: [], tags: [] }

describe('transfer ui helpers', () => {
  it('builds a zero-padded dated filename', () => {
    // local-time Date (month is 0-indexed) so the assertion is timezone-independent:
    // exportFilename reads local Date methods, matching the local `new Date()` callers use.
    expect(exportFilename(new Date(2026, 5, 9))).toBe('chronoscope-2026-06-09.json')
  })
  it('serializes and re-parses a snapshot round-trip', () => {
    const text = serializeSnapshot(file)
    expect(parseSnapshot(text)).toEqual(file)
  })
  it('rejects a malformed file', () => {
    expect(() => parseSnapshot('{"nope":true}')).toThrow('无效的导入文件')
    expect(() => parseSnapshot('not json')).toThrow()
  })
})
