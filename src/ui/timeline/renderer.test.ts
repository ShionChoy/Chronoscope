import { describe, it, expect } from 'vitest'
import { drawScene, computeLayout, densityHeight, mixHex, type TimelineColors } from './renderer'
import type { TimelineScene } from './scene'

const COLORS: TimelineColors = {
  bg: '#000', surface: '#111', text: '#fff', muted: '#888',
  border: '#333', accent: '#0aa', now: '#0ff', deepTime: '#a40',
}

// Minimal recording double for a 2D context — records method calls and
// style assignments so we can assert what was drawn without a real canvas.
function fakeCtx() {
  const calls: string[] = []
  const styles: string[] = []
  const method = (name: string) => (...args: unknown[]) => calls.push(`${name}(${args.length})`)
  const ctx = {
    calls,
    styles,
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
    createLinearGradient: (...args: unknown[]) => {
      calls.push(`createLinearGradient(${args.length})`)
      return { addColorStop: () => {} }
    },
    set fillStyle(_v: string) {},
    set strokeStyle(v: string) { styles.push(v) },
    set font(_v: string) {},
    set lineWidth(_v: number) {},
    set globalAlpha(_v: number) {},
  }
  return ctx as unknown as CanvasRenderingContext2D & { calls: string[]; styles: string[] }
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
  overview: { markers: [{ x: 100, count: 1, eventId: 'a' }, { x: 900, count: 1, eventId: 'b' }], lens: { x0: 200, x1: 600 } },
}

describe('renderer', () => {
  it('computeLayout reserves an overview band at the bottom', () => {
    const l = computeLayout(400)
    expect(l.overviewHeight).toBe(48)
    expect(l.overviewTop).toBe(400 - 48)
    expect(l.glyphTop).toBeGreaterThan(l.tickLabelH - 1)
  })
  it('densityHeight scales from a floor up to the full band by count', () => {
    expect(densityHeight(1, 1)).toBe(1) // no clustering anywhere → full height
    expect(densityHeight(1, 10)).toBeGreaterThanOrEqual(0.4)
    expect(densityHeight(10, 10)).toBeCloseTo(1, 6)
    expect(densityHeight(2, 10)).toBeLessThan(densityHeight(8, 10))
  })
  describe('mixHex', () => {
    it('returns the endpoints at t=0 and t=1', () => {
      expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000')
      expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff')
    })
    it('blends channels at the midpoint', () => {
      expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080')
    })
    it('clamps t outside [0,1]', () => {
      expect(mixHex('#000000', '#ffffff', -1)).toBe('#000000')
      expect(mixHex('#000000', '#ffffff', 2)).toBe('#ffffff')
    })
    it('expands 3-digit shorthand hex', () => {
      expect(mixHex('#000', '#fff', 1)).toBe('#ffffff')
    })
  })
  it('draws ticks, a span rect, a point arc, labels, and the lens', () => {
    const ctx = fakeCtx()
    drawScene(ctx, scene, COLORS, computeLayout(400))
    const count = (name: string) => ctx.calls.filter((c) => c.startsWith(name + '(')).length
    expect(count('clearRect')).toBe(1)
    expect(count('fillRect')).toBe(5) // bg + span glyph + overview band + band wash + lens fill
    expect(count('arc')).toBe(1) // one point glyph
    expect(count('strokeRect')).toBe(1) // lens border
    expect(count('fillText')).toBe(4) // 2 tick labels + 2 glyph titles
  })
  it('washes the overview with a deep-time→now gradient and colors markers by depth', () => {
    const ctx = fakeCtx()
    drawScene(ctx, scene, COLORS, computeLayout(400))
    const count = (name: string) => ctx.calls.filter((c) => c.startsWith(name + '(')).length
    expect(count('createLinearGradient')).toBe(1)
    // markers sit at x=100 and x=900 over width 1000 → depth 0.1 and 0.9
    expect(ctx.styles).toContain(mixHex(COLORS.deepTime, COLORS.now, 0.1))
    expect(ctx.styles).toContain(mixHex(COLORS.deepTime, COLORS.now, 0.9))
  })
})
