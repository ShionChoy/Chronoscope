import { describe, it, expect } from 'vitest'
import { fromYear } from './timepoint'
import { spanOf } from './span'

describe('spanOf', () => {
  it('treats a year as a half-open bucket', () => {
    expect(spanOf(fromYear(1990, 'year'))).toEqual({ start: 1990, end: 1991 })
  })
  it('treats a decade as a 10-year bucket', () => {
    expect(spanOf(fromYear(1990, 'decade'))).toEqual({ start: 1990, end: 2000 })
  })
  it('centers approximate geological precisions', () => {
    const s = spanOf(fromYear(-3.8e9, 'Ga'))
    expect(s.start).toBe(-3.8e9 - 0.5e9)
    expect(s.end).toBe(-3.8e9 + 0.5e9)
  })
})
