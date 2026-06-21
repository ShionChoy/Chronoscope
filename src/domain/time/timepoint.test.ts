import { describe, it, expect } from 'vitest'
import { fromYear, fromCivil, instantOf, compareTimePoints } from './timepoint'

describe('timepoint', () => {
  it('builds from a bare year', () => {
    const tp = fromYear(-2999, 'year')
    expect(tp.year).toBe(-2999)
    expect(tp.civil).toBeUndefined()
    expect(instantOf(tp)).toBe(-2999)
  })
  it('builds from civil and stores both', () => {
    const tp = fromCivil({ y: 2026, mo: 6, d: 21 }, 'day')
    expect(tp.civil).toEqual({ y: 2026, mo: 6, d: 21 })
    expect(instantOf(tp)).toBeGreaterThan(2026.4)
  })
  it('orders across scales', () => {
    const big = fromYear(-3.8e9, 'Ga')
    const recent = fromCivil({ y: 2026, mo: 6, d: 21 }, 'day')
    expect(compareTimePoints(big, recent)).toBeLessThan(0)
  })
})
