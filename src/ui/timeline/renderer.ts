import type { TimelineScene } from './scene'

export interface TimelineColors {
  bg: string
  surface: string
  text: string
  muted: string
  border: string
  accent: string
  now: string
  deepTime: string
}

export interface TimelineLayout {
  height: number
  tickLabelH: number
  glyphTop: number
  rowHeight: number
  overviewTop: number
  overviewHeight: number
}

const OVERVIEW_HEIGHT = 48

export function computeLayout(height: number): TimelineLayout {
  return {
    height,
    tickLabelH: 18,
    glyphTop: 24,
    rowHeight: 16,
    overviewTop: height - OVERVIEW_HEIGHT,
    overviewHeight: OVERVIEW_HEIGHT,
  }
}

export function densityHeight(count: number, maxCount: number): number {
  if (maxCount <= 1) return 1
  return 0.4 + 0.6 * (Math.log(count + 1) / Math.log(maxCount + 1))
}

function parseHex(h: string): [number, number, number] {
  let s = h.replace('#', '')
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
}

export function mixHex(a: string, b: string, t: number): string {
  const k = Math.min(1, Math.max(0, t))
  const pa = parseHex(a)
  const pb = parseHex(b)
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${hex(pa[0] + (pb[0] - pa[0]) * k)}${hex(pa[1] + (pb[1] - pa[1]) * k)}${hex(pa[2] + (pb[2] - pa[2]) * k)}`
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: TimelineScene,
  colors: TimelineColors,
  layout: TimelineLayout,
): void {
  ctx.clearRect(0, 0, scene.width, layout.height)
  ctx.fillStyle = colors.bg
  ctx.fillRect(0, 0, scene.width, layout.height)
  ctx.font = '11px ui-monospace, monospace'
  ctx.lineWidth = 1

  // ticks (vertical guides + labels) across the detail area
  const detailBottom = layout.overviewTop - 4
  for (const t of scene.detail.ticks) {
    ctx.strokeStyle = colors.border
    ctx.beginPath()
    ctx.moveTo(t.x, layout.tickLabelH)
    ctx.lineTo(t.x, detailBottom)
    ctx.stroke()
    ctx.fillStyle = colors.muted
    ctx.fillText(t.label, t.x + 3, 12)
  }

  // glyphs
  for (const g of scene.detail.glyphs) {
    const y = layout.glyphTop + g.row * layout.rowHeight
    const color = g.selected ? colors.now : colors.accent
    // fuzzy whisker
    if (g.whiskerEnd > g.whiskerStart) {
      ctx.strokeStyle = colors.muted
      ctx.beginPath()
      ctx.moveTo(g.whiskerStart, y + 4)
      ctx.lineTo(g.whiskerEnd, y + 4)
      ctx.stroke()
    }
    ctx.fillStyle = color
    if (g.kind === 'span') {
      ctx.fillRect(g.xStart, y, Math.max(2, g.xEnd - g.xStart), 8)
    } else {
      ctx.beginPath()
      ctx.arc(g.xStart, y + 4, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = colors.text
    ctx.fillText(g.title, g.xEnd + 6, y + 8)
  }

  // overview band — surface, then a faint deep-time→now temperature wash
  ctx.fillStyle = colors.surface
  ctx.fillRect(0, layout.overviewTop, scene.width, layout.overviewHeight)
  const wash = ctx.createLinearGradient(0, 0, scene.width, 0)
  wash.addColorStop(0, colors.deepTime)
  wash.addColorStop(1, colors.now)
  ctx.globalAlpha = 0.1
  ctx.fillStyle = wash
  ctx.fillRect(0, layout.overviewTop, scene.width, layout.overviewHeight)
  ctx.globalAlpha = 1

  const midY = layout.overviewTop + layout.overviewHeight / 2
  const maxHalf = layout.overviewHeight / 2 - 6
  const maxCount = scene.overview.markers.reduce((m, k) => Math.max(m, k.count), 1)
  for (const m of scene.overview.markers) {
    const depth = scene.width > 0 ? m.x / scene.width : 0
    ctx.strokeStyle = mixHex(colors.deepTime, colors.now, depth)
    const half = maxHalf * densityHeight(m.count, maxCount)
    ctx.beginPath()
    ctx.moveTo(m.x, midY - half)
    ctx.lineTo(m.x, midY + half)
    ctx.stroke()
  }

  // lens window
  const { x0, x1 } = scene.overview.lens
  ctx.globalAlpha = 0.18
  ctx.fillStyle = colors.now
  ctx.fillRect(x0, layout.overviewTop, Math.max(2, x1 - x0), layout.overviewHeight)
  ctx.globalAlpha = 1
  ctx.strokeStyle = colors.now
  ctx.strokeRect(x0, layout.overviewTop, Math.max(2, x1 - x0), layout.overviewHeight)
}
