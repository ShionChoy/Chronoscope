import { useSyncExternalStore } from 'react'
import { useAppStore, useAppState } from '../../state'
import type { FileSync } from '../../data'

export interface TopBarProps {
  onNew: () => void
  onExport: () => void
  onImportFile: (file: File) => void
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
  fileSync?: FileSync
}

const NOOP_SUBSCRIBE = () => () => {}

export function TopBar({ onNew, onExport, onImportFile, onToggleSidebar, sidebarOpen = false, fileSync }: TopBarProps) {
  const app = useAppStore()
  const state = useAppState()
  const fileBound = useSyncExternalStore(
    fileSync ? fileSync.subscribe : NOOP_SUBSCRIBE,
    () => fileSync?.isBound() ?? false,
  )

  return (
    <header className="topbar">
      <button
        type="button"
        className="drawer-toggle"
        aria-label="菜单"
        aria-controls="sidebar"
        aria-expanded={sidebarOpen}
        onClick={onToggleSidebar}
      >
        ☰
      </button>
      <span className="display title">Chronoscope</span>

      <nav className="view-switch">
        <button type="button" className={state.view === 'list' ? 'active' : ''} onClick={() => app.setView('list')}>
          列表
        </button>
        <button type="button" className={state.view === 'timeline' ? 'active' : ''} onClick={() => app.setView('timeline')}>
          时间轴
        </button>
      </nav>

      <div className="spacer" />

      <button type="button" aria-label="主题" onClick={() => app.setTheme(state.theme === 'day' ? 'night' : 'day')}>
        {state.theme === 'day' ? '🌙' : '☀️'}
      </button>
      <button type="button" onClick={onNew}>
        新建
      </button>
      {fileSync?.supported && (
        <button type="button" onClick={() => void fileSync.bind()}>
          {fileBound ? '已绑定文件' : '绑定文件'}
        </button>
      )}
      {fileSync?.supported && fileBound && (
        <button type="button" onClick={() => void fileSync.reload()}>
          重载
        </button>
      )}
      <button type="button" onClick={onExport}>
        导出
      </button>
      <label className="import-label">
        导入
        <input
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImportFile(f)
            e.target.value = ''
          }}
        />
      </label>
    </header>
  )
}
