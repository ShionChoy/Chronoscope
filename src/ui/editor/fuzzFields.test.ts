import { describe, it, expect } from 'vitest'
import { buildFuzz, fuzzFromValue, emptyFuzzFields } from './fuzzFields'

describe('fuzzFields', () => {
  it('round-trips a symmetric range', () => {
    expect(buildFuzz(fuzzFromValue({ before: 5, after: 5 }))).toEqual({ before: 5, after: 5 })
  })
  it('round-trips an asymmetric range', () => {
    expect(buildFuzz(fuzzFromValue({ before: 2, after: 8 }))).toEqual({ before: 2, after: 8 })
  })
  it('treats empty fields as no fuzz', () => {
    expect(buildFuzz(emptyFuzzFields())).toBeUndefined()
  })
  it('applies the chosen unit', () => {
    expect(buildFuzz({ unit: 'Ma', amount: '2', asymmetric: false, before: '', after: '' })).toEqual({
      before: 2e6,
      after: 2e6,
    })
  })
  it('ignores negative or non-numeric input', () => {
    expect(buildFuzz({ unit: 'year', amount: '-3', asymmetric: false, before: '', after: '' })).toBeUndefined()
    expect(buildFuzz({ unit: 'year', amount: 'abc', asymmetric: false, before: '', after: '' })).toBeUndefined()
  })
})
