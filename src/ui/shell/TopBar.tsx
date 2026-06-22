import { useAppStore, useAppState } from '../../state'

export interface TopBarProps {
  onNew: () => void
  onExport: () => void
  onImportFile: (file: File) => void
}

export function TopBar({ onNew, onExport, onImportFile }: TopBarProps) {
  const app = useAppStore()
  const state = useAppState()

  return (
    <header className="topbar">
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
