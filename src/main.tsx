import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './ui/styles/tokens.css'
import './ui/styles/chrome.css'
import {
  openDatabase,
  getOrCreateNodeId,
  createClock,
  createFileSync,
  fileAccessSupported,
  pickSaveFile,
  ensureWritable,
  saveHandle,
  loadHandle,
  type FileSync,
  type BoundHandle,
} from './data'
import { createAppStore, resolveInitialTheme, type AppStore } from './state'
import { decimalFromCivil } from './domain/time'

async function bootstrap(): Promise<{ app: AppStore; fileSync: FileSync }> {
  // openDatabase() returns { db, events, categories, tags }; the object as a
  // whole satisfies the Database interface (events/categories/tags repos),
  // while `opened.db` is the raw ChronoscopeDB that getOrCreateNodeId needs.
  const opened = openDatabase()
  const nodeId = await getOrCreateNodeId(opened.db)
  const clock = createClock(nodeId)
  const now = new Date()
  const nowYear = decimalFromCivil({
    y: now.getFullYear(),
    mo: now.getMonth() + 1,
    d: now.getDate(),
    h: now.getHours(),
    mi: now.getMinutes(),
    s: now.getSeconds(),
  })
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = resolveInitialTheme(window.localStorage.getItem('chronoscope.theme'), prefersDark)
  const app = createAppStore({ db: opened, clock, nowYear, theme })
  await app.load()

  const fileSync = createFileSync({
    supported: fileAccessSupported(),
    pickFile: () => pickSaveFile('chronoscope.json') as Promise<BoundHandle>,
    loadHandle: () => loadHandle(opened.db) as Promise<BoundHandle | null>,
    saveHandle: (handle) => saveHandle(opened.db, handle as FileSystemFileHandle),
    ensureWritable,
    getSnapshot: () => app.exportSnapshot(),
    applySnapshot: (file) => app.importSnapshot(file),
    subscribe: (listener) => app.store.subscribe(listener),
  })
  void fileSync.reconnect() // silently re-arm if a handle was previously bound

  return { app, fileSync }
}

bootstrap().then(({ app, fileSync }) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App app={app} fileSync={fileSync} />
    </StrictMode>,
  )
})
