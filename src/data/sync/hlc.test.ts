import { describe, it, expect } from 'vitest'
import { createClock, compareHLC } from './hlc'

describe('hlc', () => {
  it('increments counter when physical time does not advance', () => {
    let t = 1000
    const clock = createClock('n1', () => t)
    const a = clock.now() // millis 1000, counter 0
    const b = clock.now() // same millis, counter 1
    expect(compareHLC(b, a)).toBeGreaterThan(0)
    expect(a.endsWith('-n1')).toBe(true)
  })
  it('resets counter and advances when physical time moves forward', () => {
    let t = 1000
    const clock = createClock('n1', () => t)
    const a = clock.now()
    t = 2000
    const b = clock.now()
    expect(compareHLC(b, a)).toBeGreaterThan(0)
  })
  it('stays monotonic if physical clock goes backwards', () => {
    let t = 5000
    const clock = createClock('n1', () => t)
    const a = clock.now()
    t = 1 // clock jumped back
    const b = clock.now()
    expect(compareHLC(b, a)).toBeGreaterThan(0)
  })
  it('orders lexicographically the same as temporally', () => {
    expect(compareHLC('000000000002000-000000-n1', '000000000001000-000999-n1')).toBeGreaterThan(0)
    expect(compareHLC('x', 'x')).toBe(0)
  })
})
