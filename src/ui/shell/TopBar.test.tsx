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

function renderTopBar(over: Partial<{ onNew: () => void }> = {}) {
  const props = { onNew: vi.fn(), ...over }
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
  it('fires onNew', async () => {
    const props = renderTopBar()
    await userEvent.click(screen.getByRole('button', { name: '新建' }))
    expect(props.onNew).toHaveBeenCalled()
  })
  it('opens and closes the overflow menu', async () => {
    renderTopBar()
    const toggle = screen.getByRole('button', { name: '更多' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    // clicking an action inside the menu closes it again
    await userEvent.click(screen.getByRole('button', { name: '主题' }))
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })
})
