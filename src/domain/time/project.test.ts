import { describe, it, expect } from 'vitest'
import { projectLinear, projectLog, LOG_AGO_MAX } from './project'

describe('projectLinear', () => {
  it('maps endpoints to 0 and 1', () => {
    const view = { min: 1900, max: 2000 }
    expect(projectLinear(1900, view)).toBe(0)
    expect(projectLinear(2000, view)).toBe(1)
    expect(projectLinear(1950, view)).toBeCloseTo(0.5, 6)
  })
})

describe('projectLog', () => {
  const NOW = 2026
  it('puts now near 1 and the oldest bound at 0', () => {
    expect(projectLog(NOW, NOW)).toBeCloseTo(1, 6)
    expect(projectLog(NOW - LOG_AGO_MAX, NOW)).toBeCloseTo(0, 6)
  })
  it('is monotonic: older ⇒ smaller fraction', () => {
    expect(projectLog(NOW - 100, NOW)).toBeGreaterThan(projectLog(NOW - 1e6, NOW))
  })
})
