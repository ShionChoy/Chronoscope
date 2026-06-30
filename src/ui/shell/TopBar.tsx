import { useState } from 'react'
import { useAppStore, useAppState } from '../../state'

export interface TopBarProps {
  onNew: () => void
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
}

export function TopBar({ onNew, onToggleSidebar, sidebarOpen = false }: TopBarProps) {
  const app = useAppStore()
  const state = useAppState()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

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

      <button type="button" onClick={onNew}>
        新建
      </button>

      {/* Narrow screens collapse the secondary actions behind this toggle; wide
          screens hide it (CSS) and lay the actions out inline. */}
      <button
        type="button"
        className="overflow-toggle"
        aria-label="更多"
        aria-haspopup="true"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        ⋯
      </button>

      {/* Same DOM in both layouts; clicking any action closes the popover. */}
      <div className={menuOpen ? 'topbar-actions open' : 'topbar-actions'} onClick={closeMenu}>
        <button type="button" aria-label="主题" onClick={() => app.setTheme(state.theme === 'day' ? 'night' : 'day')}>
          {state.theme === 'day' ? '🌙' : '☀️'}
        </button>
      </div>

      {menuOpen && <div className="overflow-backdrop" onClick={closeMenu} />}
    </header>
  )
}
