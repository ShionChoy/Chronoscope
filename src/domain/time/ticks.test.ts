import { describe, it, expect } from 'vitest'
import { chooseTickPrecision, generateTicks } from './ticks'

describe('chooseTickPrecision', () => {
  it('picks a unit giving a readable number of ticks', () => {
    expect(chooseTickPrecision(100)).toBe('decade')   // 100yr / 10 = 10 ticks
    expect(chooseTickPrecision(5)).toBe('year')       // 5yr / 1 = 5 ticks
    expect(chooseTickPrecision(5e9)).toBe('Ga')       // huge range
  })
})

describe('generateTicks', () => {
  it('produces aligned ticks within the view', () => {
    const ticks = generateTicks({ min: 1995, max: 2025 })
    expect(ticks.length).toBeGreaterThanOrEqual(3)
    expect(ticks.length).toBeLessThanOrEqual(12)
    expect(ticks[0].year).toBeGreaterThanOrEqual(1995)
    expect(ticks[ticks.length - 1].year).toBeLessThanOrEqual(2025)
    for (const t of ticks) expect(t.precision).toBe('decade')
  })
})
