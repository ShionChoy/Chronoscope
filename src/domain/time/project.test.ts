import { describe, it, expect } from 'vitest'
import { unprojectLinear, unprojectLog, projectLinear, projectLog, LOG_AGO_MIN, LOG_AGO_MAX } from './project'

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

describe('inverse projections', () => {
  it('unprojectLinear inverts projectLinear', () => {
    const view = { min: 1900, max: 2000 }
    expect(unprojectLinear(0, view)).toBeCloseTo(1900, 6)
    expect(unprojectLinear(1, view)).toBeCloseTo(2000, 6)
    expect(unprojectLinear(0.5, view)).toBeCloseTo(1950, 6)
    expect(projectLinear(unprojectLinear(0.37, view), view)).toBeCloseTo(0.37, 6)
  })
  it('unprojectLog inverts projectLog within the representable range', () => {
    const now = 2026
    expect(unprojectLog(1, now)).toBeCloseTo(now - LOG_AGO_MIN, 6)
    expect(unprojectLog(0, now)).toBeCloseTo(now - LOG_AGO_MAX, 6)
    for (const f of [0.1, 0.5, 0.9]) {
      expect(projectLog(unprojectLog(f, now), now)).toBeCloseTo(f, 6)
    }
  })
})
