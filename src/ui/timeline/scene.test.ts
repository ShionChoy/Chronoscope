import { describe, it, expect } from 'vitest'
import { buildScene, eventInstant } from './scene'
import { ev, y } from '../../test/fixtures'

const base = { view: { min: 2000, max: 2100 }, nowYear: 2026, width: 1000, selectedId: null }

describe('eventInstant', () => {
  it('prefers start, falls back to end, else null', () => {
    expect(eventInstant(ev({ id: 'a', start: y(1969) }))).toBe(1969)
    expect(eventInstant(ev({ id: 'b', end: y(1980) }))).toBe(1980)
    expect(eventInstant(ev({ id: 'c' }))).toBeNull()
  })
})

describe('buildScene', () => {
  it('places a point event at the projected x', () => {
    const scene = buildScene({ ...base, events: [ev({ id: 'p', start: y(2050) })] })
    const g = scene.detail.glyphs.find((x) => x.eventId === 'p')!
    expect(g.kind).toBe('point')
    expect(g.xStart).toBeCloseTo(500, 0) // (2050-2000)/100 * 1000
    expect(g.xEnd).toBeCloseTo(g.xStart, 6)
  })
  it('builds a span between start and end', () => {
    const scene = buildScene({ ...base, events: [ev({ id: 's', start: y(2025), end: y(2075) })] })
    const g = scene.detail.glyphs.find((x) => x.eventId === 's')!
    expect(g.kind).toBe('span')
    expect(g.xStart).toBeCloseTo(250, 0)
    expect(g.xEnd).toBeCloseTo(750, 0)
  })
  it('culls events entirely outside the view', () => {
    const scene = buildScene({ ...base, events: [ev({ id: 'far', start: y(1000) })] })
    expect(scene.detail.glyphs).toEqual([])
  })
  it('stacks overlapping events into rows', () => {
    const scene = buildScene({
      ...base,
      events: [ev({ id: 'a', start: y(2010), end: y(2060) }), ev({ id: 'b', start: y(2020), end: y(2070) })],
    })
    expect(scene.detail.rowCount).toBe(2)
    expect(new Set(scene.detail.glyphs.map((g) => g.row))).toEqual(new Set([0, 1]))
  })
  it('marks the selected event', () => {
    const scene = buildScene({ ...base, selectedId: 'p', events: [ev({ id: 'p', start: y(2050) })] })
    expect(scene.detail.glyphs[0].selected).toBe(true)
  })
  it('produces overview markers and a lens within the width', () => {
    const scene = buildScene({ ...base, events: [ev({ id: 'p', start: y(2050) })] })
    expect(scene.overview.markers.map((m) => m.eventId)).toEqual(['p'])
    expect(scene.overview.lens.x0).toBeGreaterThanOrEqual(0)
    expect(scene.overview.lens.x1).toBeLessThanOrEqual(base.width)
    expect(scene.overview.lens.x0).toBeLessThan(scene.overview.lens.x1)
  })
  it('labels ticks and keeps them within the width', () => {
    const scene = buildScene({ ...base, events: [] })
    expect(scene.detail.ticks.length).toBeGreaterThan(0)
    for (const t of scene.detail.ticks) {
      expect(t.x).toBeGreaterThanOrEqual(0)
      expect(t.x).toBeLessThanOrEqual(base.width)
      expect(typeof t.label).toBe('string')
    }
  })
})
