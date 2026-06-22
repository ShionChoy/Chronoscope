import { describe, it, expect } from 'vitest'
import { resolveInitialTheme, persistTheme, loadStoredTheme, applyTheme, THEME_STORAGE_KEY } from './theme'

describe('theme', () => {
  it('prefers a valid stored theme', () => {
    expect(resolveInitialTheme('night', false)).toBe('night')
    expect(resolveInitialTheme('day', true)).toBe('day')
  })
  it('falls back to system preference when nothing valid is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('night')
    expect(resolveInitialTheme(null, false)).toBe('day')
    expect(resolveInitialTheme('garbage', true)).toBe('night')
  })
  it('persists and loads via the storage key', () => {
    const map = new Map<string, string>()
    const storage = { setItem: (k: string, v: string) => void map.set(k, v), getItem: (k: string) => map.get(k) ?? null }
    persistTheme(storage, 'night')
    expect(map.get(THEME_STORAGE_KEY)).toBe('night')
    expect(loadStoredTheme(storage)).toBe('night')
  })
  it('applies the theme as a data-theme attribute', () => {
    let attr = ''
    applyTheme({ setAttribute: (_n, v) => void (attr = v) }, 'day')
    expect(attr).toBe('day')
  })
})
