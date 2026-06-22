import { describe, it, expect } from 'vitest'
import { initialView, zoomView, panView, clampView, lensFromView, viewFromLens, MIN_RANGE_YEARS } from './view'
import { LOG_AGO_MAX } from '../../domain/time'

describe('timeline view math', () => {
  it('initialView fits instants with padding', () => {
    const v = initialView([1900, 2000], 2026)
    expect(v.min).toBeLessThan(1900)
    expect(v.max).toBeGreaterThan(2000)
    expect(v.min).toBeCloseTo(1895, 0) // 100 range, 5% pad = 5
    expect(v.max).toBeCloseTo(2005, 0)
  })
  it('initialView falls back when there are no instants', () => {
    expect(initialView([], 2026)).toEqual({ min: 1926, max: 2036 })
  })
  it('zoomView keeps the anchor year fixed and shrinks the range', () => {
    const v = zoomView({ min: 0, max: 100 }, 0.5, 0.5)
    expect(v.max - v.min).toBeCloseTo(50, 6)
    expect((v.min + v.max) / 2).toBeCloseTo(50, 6) // center anchor unchanged
  })
  it('zoomView refuses to shrink below MIN_RANGE_YEARS', () => {
    const v = zoomView({ min: 0, max: 1 }, 0.5, 0.0001)
    expect(v.max - v.min).toBeCloseTo(MIN_RANGE_YEARS, 9)
  })
  it('panView shifts by a fraction of the range', () => {
    expect(panView({ min: 0, max: 100 }, 0.1)).toEqual({ min: 10, max: 110 })
  })
  it('clampView bounds the deep past and keeps a minimum width', () => {
    const v = clampView({ min: 2026 - LOG_AGO_MAX - 1e9, max: 2026 - LOG_AGO_MAX - 1e9 + 0.0001 }, 2026)
    expect(v.min).toBeGreaterThanOrEqual(2026 - LOG_AGO_MAX - 1e-6)
    // tolerance accounts for IEEE-754 precision near the ~1.4e10 deep-past
    // magnitude (max = min + MIN_RANGE_YEARS loses ~1e-6 of precision there).
    expect(v.max - v.min).toBeGreaterThanOrEqual(MIN_RANGE_YEARS - 1e-5)
  })
  it('lensFromView and viewFromLens round-trip', () => {
    const view = { min: 1000, max: 2000 }
    const lens = lensFromView(view, 2026)
    expect(lens.f0).toBeLessThan(lens.f1)
    const back = viewFromLens(lens, 2026)
    expect(back.min).toBeCloseTo(1000, 3)
    expect(back.max).toBeCloseTo(2000, 3)
  })
})
