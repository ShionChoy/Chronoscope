import { describe, it, expect } from 'vitest'
import { formatTimeRange, formatUpdatedAt } from './timeText'
import { fromYear } from '../../domain/time'

const NOW = 2026

describe('formatTimeRange', () => {
  it('joins start and end with an arrow', () => {
    expect(formatTimeRange(fromYear(1300, 'year'), fromYear(1600, 'year'), NOW)).toBe('1300年 → 1600年')
  })
  it('shows the start alone when there is no end', () => {
    expect(formatTimeRange(fromYear(1969, 'year'), undefined, NOW)).toBe('1969年')
  })
  it('shows an open interval when only the end is set', () => {
    expect(formatTimeRange(undefined, fromYear(1600, 'year'), NOW)).toBe('→ 1600年')
  })
  it('falls back to a dash when neither is set', () => {
    expect(formatTimeRange(undefined, undefined, NOW)).toBe('—')
  })
})

describe('formatUpdatedAt', () => {
  it('formats the HLC physical time as a local Y-M-D H:m stamp', () => {
    // an HLC: "<15-digit epoch ms>-<6-digit counter>-<nodeId>"
    const ms = 1782709299731
    const hlc = `001782709299731-000000-3e77df5b-9ad6-4aae-a992-406814561822`
    const d = new Date(ms)
    const p = (n: number) => String(n).padStart(2, '0')
    const expected = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
    expect(formatUpdatedAt(hlc)).toBe(expected)
  })
  it('returns a dash for a non-numeric / seed stamp', () => {
    expect(formatUpdatedAt('t0001')).toBe('—')
    expect(formatUpdatedAt('')).toBe('—')
  })
})
