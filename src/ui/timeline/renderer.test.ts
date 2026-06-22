import { describe, it, expect } from 'vitest'
import { drawScene, computeLayout, type TimelineColors } from './renderer'
import type { TimelineScene } from './scene'

const COLORS: TimelineColors = {
  bg: '#000', surface: '#111', text: '#fff', muted: '#888',
  border: '#333', accent: '#0aa', now: '#0ff', deepTime: '#a40',
}

// Minimal recording double for a 2D context — records method calls and
// style assignments so we can assert what was drawn without a real canvas.
function fakeCtx() {
  const calls: string[] = []
  const method = (name: string) => (...args: unknown[]) => calls.push(`${name}(${args.length})`)
  const ctx = {
    calls,
    clearRect: method('clearRect'),
    beginPath: method('beginPath'),
    moveTo: method('moveTo'),
    lineTo: method('lineTo'),
    stroke: method('stroke'),
    fillRect: method('fillRect'),
    strokeRect: method('strokeRect'),
    arc: method('arc'),
    fill: method('fill'),
    fillText: method('fillText'),
    set fillStyle(_v: string) {},
    set strokeStyle(_v: string) {},
    set font(_v: string) {},
    set lineWidth(_v: number) {},
    set globalAlpha(_v: number) {},
  }
  return ctx as unknown as CanvasRenderingContext2D & { calls: string[] }
}

const scene: TimelineScene = {
  width: 1000,
  detail: {
    ticks: [{ x: 100, label: '2000年' }, { x: 500, label: '2050年' }],
    glyphs: [
      { eventId: 'a', kind: 'span', xStart: 100, xEnd: 300, whiskerStart: 100, whiskerEnd: 300, row: 0, selected: false, title: 'A' },
      { eventId: 'b', kind: 'point', xStart: 500, xEnd: 500, whiskerStart: 480, whiskerEnd: 520, row: 1, selected: true, title: 'B' },
    ],
    rowCount: 2,
  },
  overview: { markers: [{ x: 100, eventId: 'a' }, { x: 900, eventId: 'b' }], lens: { x0: 200, x1: 600 } },
}

describe('renderer', () => {
  it('computeLayout reserves an overview band at the bottom', () => {
    const l = computeLayout(400)
    expect(l.overviewHeight).toBe(48)
    expect(l.overviewTop).toBe(400 - 48)
    expect(l.glyphTop).toBeGreaterThan(l.tickLabelH - 1)
  })
  it('draws ticks, a span rect, a point arc, labels, and the lens', () => {
    const ctx = fakeCtx()
    drawScene(ctx, scene, COLORS, computeLayout(400))
    const count = (name: string) => ctx.calls.filter((c) => c.startsWith(name + '(')).length
    expect(count('clearRect')).toBe(1)
    expect(count('fillRect')).toBe(4) // bg + span glyph + overview band + lens fill
    expect(count('arc')).toBe(1) // one point glyph
    expect(count('strokeRect')).toBe(1) // lens border
    expect(count('fillText')).toBe(4) // 2 tick labels + 2 glyph titles
  })
})
