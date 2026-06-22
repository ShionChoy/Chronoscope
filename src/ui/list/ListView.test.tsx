// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListView } from './ListView'
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
  let i = 0
  const clock: Clock = { now: () => `t${++t}` }
  return createAppStore({ db, clock, nowYear: 2026, theme: 'day', genId: () => `id${++i}` })
}

let app: AppStore
beforeEach(() => {
  app = makeApp()
})

function renderList(onEdit = () => {}) {
  return render(
    <AppStoreProvider value={app}>
      <ListView onEdit={onEdit} />
    </AppStoreProvider>,
  )
}

describe('ListView', () => {
  it('shows an empty state when there are no events', () => {
    renderList()
    expect(screen.getByText('暂无事件')).toBeTruthy()
  })

  it('renders rows with formatted time and title', async () => {
    await app.createEvent({ title: '登月', start: { year: 1969, precision: 'year' } })
    renderList()
    expect(screen.getByText('登月')).toBeTruthy()
    expect(screen.getByText('1969年')).toBeTruthy()
  })

  it('calls onEdit with the row id when a row is clicked', async () => {
    const id = await app.createEvent({ title: 'x', start: { year: 1, precision: 'year' } })
    const onEdit = vi.fn()
    renderList(onEdit)
    await userEvent.click(screen.getByText('x'))
    expect(onEdit).toHaveBeenCalledWith(id)
  })

  it('toggles sort when a header is clicked', async () => {
    renderList()
    await userEvent.click(screen.getByRole('button', { name: '标题' }))
    expect(app.store.getState().sort).toEqual({ key: 'title', dir: 'asc' })
    await userEvent.click(screen.getByRole('button', { name: '标题' }))
    expect(app.store.getState().sort).toEqual({ key: 'title', dir: 'desc' })
  })
})
