// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimelineView } from './TimelineView'
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

function renderTimeline() {
  return render(
    <AppStoreProvider value={app}>
      <TimelineView onEdit={() => {}} />
    </AppStoreProvider>,
  )
}

describe('TimelineView', () => {
  it('renders a canvas without crashing when there are no events', () => {
    const { container } = renderTimeline()
    expect(container.querySelector('canvas')).not.toBeNull()
  })
  it('renders without crashing with events present (jsdom has no 2D context)', async () => {
    await app.createEvent({ title: '登月', start: { year: 1969, precision: 'year' } })
    await app.createEvent({ title: '区间', start: { year: 1950, precision: 'year' }, end: { year: 1980, precision: 'year' } })
    expect(() => renderTimeline()).not.toThrow()
    expect(document.querySelector('canvas')).not.toBeNull()
  })
  it('shows a detail card for the selected event', async () => {
    const id = await app.createEvent({ title: '登月', start: { year: 1969, precision: 'year' } })
    app.select(id)
    renderTimeline()
    expect(screen.getByText('登月')).toBeTruthy()
  })
})
