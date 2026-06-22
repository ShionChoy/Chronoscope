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
  it('rolls the millisecond forward instead of overflowing the 6-digit counter', () => {
    // Reduced to just cross the counter ceiling once — full 1M loop timed out
    // at 5 s on this machine due to per-iteration expect overhead.
    const clock = createClock('n1', () => 1000)
    let prev = clock.now()
    const len = prev.length
    let last = prev
    let rolled = false
    // Drain 999999 counter slots (counter goes 0→999999), then the next call
    // must roll the millisecond.  We skip per-iteration expect to stay fast.
    for (let i = 0; i < 1_000_001; i++) {
      last = clock.now()
      if (last.slice(0, 15) !== prev.slice(0, 15)) rolled = true
      prev = last
    }
    // After the loop, the millisecond prefix must have rolled forward.
    expect(rolled).toBe(true)
    // Fixed-width and strict monotonicity at the roll boundary:
    expect(last.length).toBe(len)
    expect(compareHLC(last, clock.now())).toBeLessThan(0) // next call is still later
  })
})
