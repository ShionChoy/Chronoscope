import { describe, it, expect } from 'vitest'
import { spanOf, pinchScale, midpoint } from './gesture'

describe('gesture math', () => {
  it('spanOf is the distance between the extremes', () => {
    expect(spanOf([100, 300])).toBe(200)
    expect(spanOf([300, 100])).toBe(200)
    expect(spanOf([200])).toBe(0) // need two points
    expect(spanOf([])).toBe(0)
  })

  it('pinchScale is the ratio of new span to old span', () => {
    expect(pinchScale(100, 200)).toBe(2) // fingers moved apart
    expect(pinchScale(200, 100)).toBe(0.5) // fingers pinched together
  })

  it('pinchScale is 1 when the previous span is degenerate', () => {
    expect(pinchScale(0, 200)).toBe(1)
  })

  it('midpoint averages the positions', () => {
    expect(midpoint([100, 300])).toBe(200)
    expect(midpoint([])).toBe(0)
  })
})
