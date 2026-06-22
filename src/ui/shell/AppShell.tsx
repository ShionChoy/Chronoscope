import { useEffect, useState } from 'react'
import { AppStoreProvider, useAppStore, useAppState, applyTheme, persistTheme, type AppStore } from '../../state'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { ListView } from '../list/ListView'
import { EventEditor } from '../editor/EventEditor'
import { exportFilename, serializeSnapshot, parseSnapshot } from './transfer'
import type { Id } from '../../domain/model'

type EditorTarget = Id | 'new' | null

function ShellBody() {
  const app = useAppStore()
  const state = useAppState()
  const [editor, setEditor] = useState<EditorTarget>(null)

  useEffect(() => {
    applyTheme(document.documentElement, state.theme)
    persistTheme(window.localStorage, state.theme)
  }, [state.theme])

  const doExport = async () => {
    const file = await app.exportSnapshot()
    const blob = new Blob([serializeSnapshot(file)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFilename(new Date())
    // Firefox honours the download attribute only for an in-document anchor,
    // and revoking the URL synchronously can cancel a deferred download — so
    // append, click, remove, then revoke on the next tick.
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const doImport = async (file: File) => {
    const text = await file.text()
    await app.importSnapshot(parseSnapshot(text))
  }

  return (
    <div className="app-shell">
      <TopBar onNew={() => setEditor('new')} onExport={doExport} onImportFile={doImport} />
      <div className="body">
        <Sidebar />
        <main className="view-area">
          {state.view === 'list' ? (
            <ListView onEdit={(id) => setEditor(id)} />
          ) : (
            <div className="placeholder">时间轴视图开发中（Plan 4）</div>
          )}
        </main>
      </div>
      {editor !== null && (
        <div className="modal-overlay" onClick={() => setEditor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <EventEditor editingId={editor === 'new' ? null : editor} onClose={() => setEditor(null)} />
          </div>
        </div>
      )}
    </div>
  )
}

export interface AppShellProps {
  app: AppStore
}

export function AppShell({ app }: AppShellProps) {
  return (
    <AppStoreProvider value={app}>
      <ShellBody />
    </AppStoreProvider>
  )
}
