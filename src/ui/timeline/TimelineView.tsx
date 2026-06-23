import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore, useAppState, visibleEvents } from '../../state'
import type { LinearView } from '../../domain/time'
import { initialView, zoomView, panView, clampView, viewFromLens } from './view'
import { spanOf, pinchScale, midpoint } from './gesture'
import { buildScene, eventInstant, type TimelineScene } from './scene'
import { drawScene, computeLayout, type TimelineColors } from './renderer'
import type { Id } from '../../domain/model'
import { buildEventCard } from './card'
import { EventDetailCard } from './EventDetailCard'

export interface TimelineViewProps {
  onEdit: (id: Id) => void
}

function readColors(el: Element): TimelineColors {
  const s = getComputedStyle(el)
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback
  return {
    bg: v('--bg', '#fff'),
    surface: v('--surface', '#f0f0f0'),
    text: v('--text', '#000'),
    muted: v('--muted', '#888'),
    border: v('--border', '#ccc'),
    accent: v('--accent', '#0aa'),
    now: v('--now', '#0cf'),
    deepTime: v('--deep-time', '#b4541f'),
  }
}

export function TimelineView({ onEdit }: TimelineViewProps) {
  const app = useAppStore()
  const state = useAppState()
  const events = useMemo(() => visibleEvents(state), [state])
  const nowYear = state.nowYear

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<TimelineScene | null>(null)
  const layoutRef = useRef(computeLayout(0))
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState<LinearView>(() =>
    initialView(events.map(eventInstant).filter((n): n is number => n !== null), nowYear),
  )

  // track element size
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    if (typeof ResizeObserver === 'undefined') return // jsdom has no ResizeObserver
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // build + draw whenever inputs change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.w === 0 || size.h === 0) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size.w * dpr
    canvas.height = size.h * dpr
    const scene = buildScene({ events, view, nowYear, width: size.w, selectedId: state.selectedId })
    const layout = computeLayout(size.h)
    sceneRef.current = scene
    layoutRef.current = layout
    const ctx = canvas.getContext('2d')
    if (!ctx) return // jsdom / unsupported: scene is still computed, just not painted
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawScene(ctx, scene, readColors(canvas), layout)
  }, [events, view, nowYear, size, state.selectedId, state.theme])

  // pointer interactions
  const drag = useRef<{ x: number; mode: 'pan' | 'lens'; moved: boolean } | null>(null)
  // active pointers by id → clientX, for multi-touch pinch
  const pointers = useRef(new Map<number, number>())

  const fractionAt = (clientX: number): number => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return 0
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 0.85 : 1.18
    setView((v) => clampView(zoomView(v, fractionAt(e.clientX), factor), nowYear))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, e.clientX)
    if (pointers.current.size >= 2) {
      drag.current = null // a pinch began; stop panning/lens-dragging
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      return
    }
    const rect = canvasRef.current?.getBoundingClientRect()
    const localY = rect ? e.clientY - rect.top : 0
    const inOverview = localY >= layoutRef.current.overviewTop
    drag.current = { x: e.clientX, mode: inOverview ? 'lens' : 'pan', moved: false }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.size >= 2) {
      const prev = [...pointers.current.values()]
      pointers.current.set(e.pointerId, e.clientX)
      const next = [...pointers.current.values()]
      const scale = pinchScale(spanOf(prev), spanOf(next))
      if (scale !== 1) {
        const rect = canvasRef.current?.getBoundingClientRect()
        const width = rect?.width || 1
        const frac = Math.min(Math.max((midpoint(next) - (rect?.left ?? 0)) / width, 0), 1)
        // fingers apart (scale > 1) → zoom in → factor < 1
        setView((v) => clampView(zoomView(v, frac, 1 / scale), nowYear))
      }
      return
    }
    const d = drag.current
    if (!d) return
    const rect = canvasRef.current?.getBoundingClientRect()
    const width = rect?.width || 1
    const dxFrac = (e.clientX - d.x) / width
    if (Math.abs(e.clientX - d.x) > 3) d.moved = true
    d.x = e.clientX
    if (d.mode === 'pan') {
      setView((v) => clampView(panView(v, -dxFrac), nowYear))
    } else {
      // shift the lens by dxFrac, i.e. move the detail window in log space
      const lens = sceneRef.current?.overview.lens
      const w = sceneRef.current?.width || 1
      if (lens) {
        const f0 = Math.min(Math.max(lens.x0 / w + dxFrac, 0), 1)
        const f1 = Math.min(Math.max(lens.x1 / w + dxFrac, 0), 1)
        setView(() => clampView(viewFromLens({ f0, f1 }, nowYear), nowYear))
      }
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    const d = drag.current
    drag.current = null
    if (!d || d.moved) return
    // a click (no drag): hit-test detail glyphs
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const layout = layoutRef.current
    const scene = sceneRef.current
    if (!scene || y >= layout.overviewTop) return
    for (const g of scene.detail.glyphs) {
      const gy = layout.glyphTop + g.row * layout.rowHeight
      const within = x >= g.xStart - 6 && x <= Math.max(g.xEnd, g.xStart) + 6 && y >= gy - 4 && y <= gy + 12
      if (within) {
        app.select(g.eventId)
        return
      }
    }
    app.select(null) // clicked empty detail space → dismiss the card
  }

  const onPointerCancel = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    drag.current = null
  }

  const selectedEvent =
    state.selectedId != null ? state.events.find((e) => e.id === state.selectedId && !e.deleted) ?? null : null

  return (
    <div ref={wrapRef} className="timeline-view" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />
      {selectedEvent && (
        <EventDetailCard
          data={buildEventCard(
            selectedEvent,
            { categories: state.categories, tags: state.tags, events: state.events },
            nowYear,
          )}
          onEdit={() => onEdit(selectedEvent.id)}
          onClose={() => app.select(null)}
          onSelectLink={(id) => app.select(id)}
        />
      )}
    </div>
  )
}
