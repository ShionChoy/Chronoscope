import { describe, it, expect } from 'vitest'
import { decimalFromCivil, civilFromDecimal } from './decimal'

describe('decimalFromCivil', () => {
  it('maps Jan 1 to the integer year', () => {
    expect(decimalFromCivil({ y: 2000, mo: 1, d: 1 })).toBe(2000)
    expect(decimalFromCivil({ y: 2001, mo: 1, d: 1 })).toBe(2001)
  })
  it('is monotonic within a year', () => {
    const jul = decimalFromCivil({ y: 2000, mo: 7, d: 1 })
    expect(jul).toBeGreaterThan(2000.4)
    expect(jul).toBeLessThan(2000.6)
  })
  it('treats missing day/time as start of bucket', () => {
    expect(decimalFromCivil({ y: 2000, mo: 1 })).toBe(2000)
  })
  it('advances with time of day', () => {
    const noon = decimalFromCivil({ y: 2023, mo: 1, d: 1, h: 12 })
    expect(noon).toBeCloseTo(2023 + 0.5 / 365, 6)
  })
})

describe('civilFromDecimal', () => {
  it('inverts decimalFromCivil for a date and time', () => {
    const c = { y: 2026, mo: 3, d: 15, h: 14, mi: 30, s: 0 }
    expect(civilFromDecimal(decimalFromCivil(c))).toEqual(c)
  })
  it('round-trips Jan 1 and a leap day', () => {
    expect(civilFromDecimal(2000)).toEqual({ y: 2000, mo: 1, d: 1, h: 0, mi: 0, s: 0 })
    const leap = { y: 2024, mo: 2, d: 29, h: 0, mi: 0, s: 0 }
    expect(civilFromDecimal(decimalFromCivil(leap))).toEqual(leap)
  })
})
