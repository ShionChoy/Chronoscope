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

  // overview band
  ctx.fillStyle = colors.surface
  ctx.fillRect(0, layout.overviewTop, scene.width, layout.overviewHeight)
  const markY0 = layout.overviewTop + 6
  const markY1 = layout.overviewTop + layout.overviewHeight - 6
  ctx.strokeStyle = colors.deepTime
  for (const m of scene.overview.markers) {
    ctx.beginPath()
    ctx.moveTo(m.x, markY0)
    ctx.lineTo(m.x, markY1)
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
