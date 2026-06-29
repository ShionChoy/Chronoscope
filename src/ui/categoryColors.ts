// Preset folder colors (legible on both the day and night themes) plus a
// persisted, user-extensible custom palette. The custom palette is a local UI
// preference (localStorage) — not part of the exported data.

export const CATEGORY_PRESETS = [
  '#c0392b',
  '#e67e22',
  '#f1c40f',
  '#27ae60',
  '#16a085',
  '#0d7d8c',
  '#2980b9',
  '#8e44ad',
  '#d6336c',
  '#7f8c8d',
] as const

// Auto-assign a distinct preset when a category is created.
export function nextPresetColor(index: number): string {
  const n = CATEGORY_PRESETS.length
  return CATEGORY_PRESETS[((index % n) + n) % n]
}

const STORAGE_KEY = 'chronoscope.customColors'

export function loadCustomColors(storage: Storage): string[] {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function persistCustomColors(storage: Storage, colors: string[]): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(colors))
  } catch {
    // best-effort: ignore quota / unavailable storage
  }
}

// Prepend a new color (lowercased, deduped), capped — oldest entries drop off.
export function addToPalette(list: string[], hex: string, cap = 12): string[] {
  const c = hex.toLowerCase()
  return [c, ...list.filter((x) => x.toLowerCase() !== c)].slice(0, cap)
}
