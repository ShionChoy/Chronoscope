import { describe, it, expect } from 'vitest'
import {
  CATEGORY_PRESETS,
  nextPresetColor,
  loadCustomColors,
  persistCustomColors,
  addToPalette,
} from './categoryColors'

function memoryStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v)
    },
    removeItem: (k: string) => {
      delete store[k]
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k]
    },
    key: () => null,
    length: 0,
  } as unknown as Storage
}

describe('nextPresetColor', () => {
  it('cycles through the presets', () => {
    expect(nextPresetColor(0)).toBe(CATEGORY_PRESETS[0])
    expect(nextPresetColor(1)).toBe(CATEGORY_PRESETS[1])
    expect(nextPresetColor(CATEGORY_PRESETS.length)).toBe(CATEGORY_PRESETS[0])
  })
})

describe('addToPalette', () => {
  it('prepends, lowercases, dedupes, and caps', () => {
    expect(addToPalette([], '#ABCDEF')).toEqual(['#abcdef'])
    expect(addToPalette(['#abcdef'], '#ABCDEF')).toEqual(['#abcdef'])
    expect(addToPalette(['#111111'], '#222222')).toEqual(['#222222', '#111111'])
    const full = Array.from({ length: 12 }, (_, i) => `#0000${String(i).padStart(2, '0')}`)
    const after = addToPalette(full, '#ffffff')
    expect(after.length).toBe(12)
    expect(after[0]).toBe('#ffffff')
  })
})

describe('custom color persistence', () => {
  it('round-trips and tolerates missing/garbage values', () => {
    const s = memoryStorage()
    expect(loadCustomColors(s)).toEqual([])
    persistCustomColors(s, ['#abcdef', '#123456'])
    expect(loadCustomColors(s)).toEqual(['#abcdef', '#123456'])
    s.setItem('chronoscope.customColors', 'not json')
    expect(loadCustomColors(s)).toEqual([])
  })
})
