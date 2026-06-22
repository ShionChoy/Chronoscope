import { describe, it, expect } from 'vitest'
import { packRows } from './packing'

describe('packRows', () => {
  it('puts non-overlapping items on row 0', () => {
    const out = packRows([
      { id: 'a', left: 0, right: 10 },
      { id: 'b', left: 20, right: 30 },
    ])
    expect(out.map((x) => x.row)).toEqual([0, 0])
  })
  it('stacks overlapping items onto new rows', () => {
    const out = packRows([
      { id: 'a', left: 0, right: 30 },
      { id: 'b', left: 10, right: 40 },
      { id: 'c', left: 20, right: 50 },
    ])
    const byId = Object.fromEntries(out.map((x) => [x.id, x.row]))
    expect(byId).toEqual({ a: 0, b: 1, c: 2 })
  })
  it('reuses the lowest freed row (greedy)', () => {
    const out = packRows([
      { id: 'a', left: 0, right: 10 },
      { id: 'b', left: 5, right: 15 }, // overlaps a -> row 1
      { id: 'c', left: 12, right: 20 }, // a freed (10<=12) -> row 0
    ])
    const byId = Object.fromEntries(out.map((x) => [x.id, x.row]))
    expect(byId).toEqual({ a: 0, b: 1, c: 0 })
  })
  it('does not mutate the input array order', () => {
    const input = [{ id: 'z', left: 100, right: 110 }, { id: 'a', left: 0, right: 10 }]
    packRows(input)
    expect(input.map((x) => x.id)).toEqual(['z', 'a'])
  })
})
