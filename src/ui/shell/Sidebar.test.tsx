// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
afterEach(() => {
  vi.restoreAllMocks()
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

  it('creates a category from the sidebar', async () => {
    renderSidebar()
    await userEvent.type(screen.getByLabelText('新建分类'), '科技{Enter}')
    expect(app.store.getState().categories.map((c) => c.name)).toContain('科技')
  })

  it('creates a tag from the sidebar', async () => {
    renderSidebar()
    await userEvent.type(screen.getByLabelText('新建标签'), '里程碑{Enter}')
    expect(app.store.getState().tags.map((t) => t.name)).toContain('里程碑')
  })

  it('has an 未分类 folder that filters to uncategorized events', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: '未分类' }))
    expect(app.store.getState().filter.uncategorized).toBe(true)
    expect(app.store.getState().filter.categoryId).toBeNull()
  })

  it('deletes a category after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const id = await app.createCategory({ name: '科技' })
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: '删除分类「科技」' }))
    expect(app.store.getState().categories.find((c) => c.id === id)?.deleted).toBe(true)
  })

  it('keeps the category when deletion is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const id = await app.createCategory({ name: '科技' })
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: '删除分类「科技」' }))
    expect(app.store.getState().categories.find((c) => c.id === id)?.deleted).toBe(false)
  })

  it('collapses a category folder, hiding its children', async () => {
    const parent = await app.createCategory({ name: '历史' })
    await app.createCategory({ name: '近代', parentId: parent })
    renderSidebar()
    expect(screen.getByRole('button', { name: '近代' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: '折叠「历史」' }))
    expect(screen.queryByRole('button', { name: '近代' })).toBeNull()
  })

  it('shows a descendant-inclusive event count on a category folder', async () => {
    const parent = await app.createCategory({ name: '历史' })
    const child = await app.createCategory({ name: '近代', parentId: parent })
    await app.createEvent({ title: 'a', categoryId: parent })
    await app.createEvent({ title: 'b', categoryId: child })
    renderSidebar()
    const row = screen.getByRole('button', { name: '历史' }).closest('.row') as HTMLElement
    expect(row.querySelector('.count')?.textContent).toBe('2')
  })
})
