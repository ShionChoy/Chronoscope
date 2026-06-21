import { describe, it, expect } from 'vitest'
import { fromYear, fromCivil } from './timepoint'
import { formatTimePoint } from './format'

const NOW = 2026

describe('formatTimePoint', () => {
  it('formats civil precisions', () => {
    expect(formatTimePoint(fromCivil({ y: 2026, mo: 6, d: 21 }, 'day'), NOW)).toBe('2026-06-21')
    expect(formatTimePoint(fromCivil({ y: 2026, mo: 6 }, 'month'), NOW)).toBe('2026-06')
    expect(formatTimePoint(fromCivil({ y: 2026, mo: 6, d: 21, h: 15, mi: 30 }, 'minute'), NOW)).toBe('2026-06-21 15:30')
  })
  it('formats years and BCE', () => {
    expect(formatTimePoint(fromYear(1969, 'year'), NOW)).toBe('1969年')
    expect(formatTimePoint(fromYear(-2999, 'year'), NOW)).toBe('公元前3000年')
    expect(formatTimePoint(fromYear(1990, 'decade'), NOW)).toBe('1990年代')
  })
  it('formats geological precisions relative to now', () => {
    expect(formatTimePoint(fromYear(NOW - 3.8e9, 'Ga'), NOW)).toBe('约38.0亿年前')
    expect(formatTimePoint(fromYear(NOW - 66e6, 'Ma'), NOW)).toBe('约6600万年前')
  })
})
