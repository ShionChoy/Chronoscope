import { createContext, useContext } from 'react'
import type { AppStore } from './appStore'
import type { AppState } from './types'
import { useStore } from './useStore'

const AppStoreContext = createContext<AppStore | null>(null)

export const AppStoreProvider = AppStoreContext.Provider

export function useAppStore(): AppStore {
  const app = useContext(AppStoreContext)
  if (!app) throw new Error('useAppStore must be used within an AppStoreProvider')
  return app
}

export function useAppState(): AppState {
  return useStore(useAppStore().store)
}
