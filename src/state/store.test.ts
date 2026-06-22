import { describe, it, expect, vi } from 'vitest'
import { createStore } from './store'

describe('createStore', () => {
  it('getState returns the current value', () => {
    const s = createStore({ n: 1 })
    expect(s.getState()).toEqual({ n: 1 })
  })
  it('setState replaces state and notifies subscribers', () => {
    const s = createStore({ n: 1 })
    const seen: number[] = []
    s.subscribe(() => seen.push(s.getState().n))
    s.setState((p) => ({ n: p.n + 1 }))
    expect(s.getState()).toEqual({ n: 2 })
    expect(seen).toEqual([2])
  })
  it('keeps a stable reference until setState changes it', () => {
    const s = createStore({ n: 1 })
    const a = s.getState()
    expect(s.getState()).toBe(a) // same ref across reads
    s.setState((p) => ({ n: p.n + 1 }))
    expect(s.getState()).not.toBe(a)
  })
  it('does not notify when the updater returns the same reference', () => {
    const s = createStore({ n: 1 })
    const fn = vi.fn()
    s.subscribe(fn)
    s.setState((p) => p) // no change
    expect(fn).not.toHaveBeenCalled()
  })
  it('unsubscribe stops further notifications', () => {
    const s = createStore({ n: 1 })
    const fn = vi.fn()
    const off = s.subscribe(fn)
    off()
    s.setState((p) => ({ n: p.n + 1 }))
    expect(fn).not.toHaveBeenCalled()
  })
})
