import type { Theme } from './types'

export const THEME_STORAGE_KEY = 'chronoscope.theme'

export function resolveInitialTheme(stored: string | null, systemPrefersDark: boolean): Theme {
  if (stored === 'day' || stored === 'night') return stored
  return systemPrefersDark ? 'night' : 'day'
}

export function loadStoredTheme(storage: Pick<Storage, 'getItem'>): string | null {
  return storage.getItem(THEME_STORAGE_KEY)
}

export function persistTheme(storage: Pick<Storage, 'setItem'>, theme: Theme): void {
  storage.setItem(THEME_STORAGE_KEY, theme)
}

export function applyTheme(root: { setAttribute(name: string, value: string): void }, theme: Theme): void {
  root.setAttribute('data-theme', theme)
}
