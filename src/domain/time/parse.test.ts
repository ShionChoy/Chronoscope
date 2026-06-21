import { describe, it, expect } from 'vitest'
import { parseTimeInput } from './parse'
import { instantOf } from './timepoint'

const NOW = 2026

describe('parseTimeInput', () => {
  it('parses ISO-ish datetimes', () => {
    expect(parseTimeInput('2026-06-21 15:30', NOW)).toMatchObject({
      precision: 'minute', civil: { y: 2026, mo: 6, d: 21, h: 15, mi: 30 },
    })
    expect(parseTimeInput('2026-06-21', NOW)).toMatchObject({ precision: 'day' })
    expect(parseTimeInput('2026-06', NOW)).toMatchObject({ precision: 'month' })
    expect(parseTimeInput('2026', NOW)).toMatchObject({ precision: 'year', year: 2026 })
  })
  it('parses BCE and decades', () => {
    expect(parseTimeInput('公元前3000年', NOW)).toMatchObject({ precision: 'year', year: -2999 })
    expect(parseTimeInput('1990年代', NOW)).toMatchObject({ precision: 'decade', year: 1990 })
  })
  it('parses geological "ago" forms', () => {
    const ga = parseTimeInput('约38亿年前', NOW)!
    expect(ga.precision).toBe('Ga')
    expect(instantOf(ga)).toBeCloseTo(NOW - 3.8e9, 0)
    const wan = parseTimeInput('30万年前', NOW)! // 3e5 yr ago ⇒ ka (< 1e6)
    expect(wan.precision).toBe('ka')
    expect(instantOf(wan)).toBeCloseTo(NOW - 3e5, 0)
  })
  it('returns null for unrecognized input', () => {
    expect(parseTimeInput('sometime last summer', NOW)).toBeNull()
  })
})
