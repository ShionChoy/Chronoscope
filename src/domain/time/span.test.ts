import { describe, it, expect } from 'vitest'
import { fromYear, withFuzz } from './timepoint'
import { fuzzRangeOf } from './span'

describe('fuzzRangeOf', () => {
  it('returns a zero-width range when there is no fuzz', () => {
    expect(fuzzRangeOf(fromYear(1990, 'year'))).toEqual({ earliest: 1990, latest: 1990 })
    expect(fuzzRangeOf(fromYear(-3.8e9, 'Ga'))).toEqual({ earliest: -3.8e9, latest: -3.8e9 })
  })
  it('applies a symmetric explicit range', () => {
    const tp = withFuzz(fromYear(1990, 'year'), { before: 5, after: 5 })
    expect(fuzzRangeOf(tp)).toEqual({ earliest: 1985, latest: 1995 })
  })
  it('applies an asymmetric explicit range', () => {
    const tp = withFuzz(fromYear(1990, 'year'), { before: 2, after: 8 })
    expect(fuzzRangeOf(tp)).toEqual({ earliest: 1988, latest: 1998 })
  })
})
