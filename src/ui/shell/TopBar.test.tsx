// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TopBar } from './TopBar'
import { AppStoreProvider, createAppStore, type AppStore } from '../../state'
import { createMemoryRepository, type Database, type Clock } from '../../data'
import type { EventRecord, Category, Tag } from '../../domain/model'

function makeApp(): AppStore {
  const db: Database = {
    events: createMemoryRepository<EventRecord>(),
    categories: createMemoryRepository<Category>(),
    tags: createMemoryRepository<Tag>(),
  }
  let t = 0
  const clock: Clock = { now: () => `t${++t}` }
  return createAppStore({ db, clock, nowYear: 2026, theme: 'day', genId: () => 'id' })
}

let app: AppStore
beforeEach(() => {
  app = makeApp()
})

function renderTopBar(over: Partial<{ onNew: () => void; onExport: () => void; onImportFile: (f: File) => void }> = {}) {
  const props = { onNew: vi.fn(), onExport: vi.fn(), onImportFile: vi.fn(), ...over }
  render(
    <AppStoreProvider value={app}>
      <TopBar {...props} />
    </AppStoreProvider>,
  )
  return props
}

describe('TopBar', () => {
  it('switches the view', async () => {
    renderTopBar()
    await userEvent.click(screen.getByRole('button', { name: '时间轴' }))
    expect(app.store.getState().view).toBe('timeline')
  })
  it('toggles the theme', async () => {
    renderTopBar()
    await userEvent.click(screen.getByRole('button', { name: '主题' }))
    expect(app.store.getState().theme).toBe('night')
  })
  it('fires onNew and onExport', async () => {
    const props = renderTopBar()
    await userEvent.click(screen.getByRole('button', { name: '新建' }))
    await userEvent.click(screen.getByRole('button', { name: '导出' }))
    expect(props.onNew).toHaveBeenCalled()
    expect(props.onExport).toHaveBeenCalled()
  })
  it('passes a chosen file to onImportFile', async () => {
    const props = renderTopBar()
    const file = new File(['{}'], 'snap.json', { type: 'application/json' })
    await userEvent.upload(screen.getByLabelText('导入'), file)
    expect(props.onImportFile).toHaveBeenCalledWith(file)
  })
})
