// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from './Sidebar'
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

const renderSidebar = () =>
  render(
    <AppStoreProvider value={app}>
      <Sidebar />
    </AppStoreProvider>,
  )

describe('Sidebar', () => {
  it('updates the search query filter', async () => {
    renderSidebar()
    await userEvent.type(screen.getByLabelText('搜索'), 'moon')
    expect(app.store.getState().filter.query).toBe('moon')
  })

  it('selects and clears a category', async () => {
    const id = await app.createCategory({ name: '科技' })
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: '科技' }))
    expect(app.store.getState().filter.categoryId).toBe(id)
    await userEvent.click(screen.getByRole('button', { name: '科技' }))
    expect(app.store.getState().filter.categoryId).toBeNull()
  })

  it('toggles a tag and the AND/OR mode', async () => {
    const id = await app.createTag({ name: '里程碑' })
    renderSidebar()
    await userEvent.click(screen.getByLabelText('里程碑'))
    expect(app.store.getState().filter.tagIds).toEqual([id])
    await userEvent.click(screen.getByRole('button', { name: /OR|AND/ }))
    expect(app.store.getState().filter.tagMode).toBe('and')
  })
})
