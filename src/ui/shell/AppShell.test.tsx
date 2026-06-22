// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'
import { createAppStore, type AppStore } from '../../state'
import { createMemoryRepository, type Database, type Clock } from '../../data'
import type { EventRecord, Category, Tag } from '../../domain/model'

function makeApp(): AppStore {
  const db: Database = {
    events: createMemoryRepository<EventRecord>(),
    categories: createMemoryRepository<Category>(),
    tags: createMemoryRepository<Tag>(),
  }
  let t = 0
  let i = 0
  const clock: Clock = { now: () => `t${++t}` }
  return createAppStore({ db, clock, nowYear: 2026, theme: 'day', genId: () => `id${++i}` })
}

let app: AppStore
beforeEach(() => {
  app = makeApp()
})

describe('AppShell', () => {
  it('applies the theme to the document element', () => {
    render(<AppShell app={app} />)
    expect(document.documentElement.getAttribute('data-theme')).toBe('day')
  })

  it('shows the timeline placeholder when the timeline view is selected', async () => {
    render(<AppShell app={app} />)
    await userEvent.click(screen.getByRole('button', { name: '时间轴' }))
    expect(screen.getByText(/Plan 4/)).toBeTruthy()
  })

  it('creates an event end-to-end: 新建 → fill → 保存 → appears in the list', async () => {
    render(<AppShell app={app} />)
    await userEvent.click(screen.getByRole('button', { name: '新建' }))
    await userEvent.type(screen.getByLabelText('标题'), '宇宙大爆炸')
    await userEvent.type(screen.getByLabelText('起点'), '约138亿年前')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('宇宙大爆炸')).toBeTruthy()
  })
})
