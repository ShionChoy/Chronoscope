import type { EventRecord, Id } from '../../domain/model'
import {
  type LinearView,
  projectLinear,
  generateTicks,
  spanOf,
  instantOf,
  formatTimePoint,
  fromYear,
} from '../../domain/time'
import { packRows } from './packing'
import { lensFromView } from './view'

export interface SceneTick {
  x: number
  label: string
}

export interface SceneGlyph {
  eventId: Id
  kind: 'point' | 'span'
  xStart: number
  xEnd: number
  whiskerStart: number
  whiskerEnd: number
  row: number
  selected: boolean
  title: string
}

export interface SceneMarker {
  x: number
  count: number
  eventId?: Id
}

export interface TimelineScene {
  width: number
  detail: { ticks: SceneTick[]; glyphs: SceneGlyph[]; rowCount: number }
  overview: {
    markers: SceneMarker[]
    lens: { x0: number; x1: number }
    range: { start: string; end: string }
  }
}

export interface BuildSceneInput {
  events: EventRecord[]
  view: LinearView
  // The overview band's currently shown extent (linear). The lens and the event
  // markers are projected onto this, so the user can zoom/pan it to spread out a
  // crowded era without changing the detail view.
  overview: LinearView
  nowYear: number
  width: number
  selectedId: Id | null
}

const LABEL_GAP = 80
const MARKER_BUCKET_PX = 6
const MIN_LENS_PX = 2 // keep the lens visible even when it degenerates at a band edge

export function aggregateMarkers(items: { x: number; eventId: Id }[], bucketPx: number): SceneMarker[] {
  const buckets = new Map<number, { x: number; eventId: Id }[]>()
  for (const it of items) {
    const key = Math.floor(it.x / bucketPx)
    const arr = buckets.get(key)
    if (arr) arr.push(it)
    else buckets.set(key, [it])
  }
  const out: SceneMarker[] = []
  for (const arr of buckets.values()) {
    const x = arr.reduce((s, it) => s + it.x, 0) / arr.length
    out.push({ x, count: arr.length, eventId: arr.length === 1 ? arr[0].eventId : undefined })
  }
  out.sort((a, b) => a.x - b.x)
  return out
}

export function eventInstant(e: EventRecord): number | null {
  if (e.start) return instantOf(e.start)
  if (e.end) return instantOf(e.end)
  return null
}

// Label a decimal year for the overview's range readout: an absolute year near
// the present, a relative "约X…年前/后" deeper in time (the formatter picks the
// 亿/万/年 unit automatically for relative precisions).
function rangeLabel(year: number, nowYear: number): string {
  const precision = Math.abs(nowYear - year) >= 1000 ? 'ka' : 'year'
  return formatTimePoint(fromYear(year, precision), nowYear)
}

export function buildScene(input: BuildSceneInput): TimelineScene {
  const { events, view, overview, nowYear, width, selectedId } = input
  const xOf = (year: number) => projectLinear(year, view) * width

  const ticks: SceneTick[] = generateTicks(view)
    .map((t) => ({ x: xOf(t.year), label: formatTimePoint(fromYear(t.year, t.precision), nowYear) }))
    .filter((t) => t.x >= 0 && t.x <= width)

  type Raw = Omit<SceneGlyph, 'row'> & { left: number; right: number }
  const raws: Raw[] = []
  for (const e of events) {
    if (!e.start && !e.end) continue
    let kind: 'point' | 'span'
    let xStart: number
    let xEnd: number
    let whiskerStart: number
    let whiskerEnd: number
    if (e.start && e.end) {
      kind = 'span'
      xStart = xOf(instantOf(e.start))
      xEnd = xOf(instantOf(e.end))
      whiskerStart = xOf(spanOf(e.start).start)
      whiskerEnd = xOf(spanOf(e.end).end)
    } else {
      kind = 'point'
      const tp = (e.start ?? e.end)!
      xStart = xOf(instantOf(tp))
      xEnd = xStart
      const s = spanOf(tp)
      whiskerStart = xOf(s.start)
      whiskerEnd = xOf(s.end)
    }
    const left = Math.min(xStart, whiskerStart)
    const right = Math.max(xEnd, whiskerEnd)
    if (right < 0 || left > width) continue
    raws.push({
      eventId: e.id,
      kind,
      xStart,
      xEnd,
      whiskerStart,
      whiskerEnd,
      selected: e.id === selectedId,
      title: e.title,
      left,
      right: right + LABEL_GAP,
    })
  }

  const packed = packRows(raws)
  const glyphs: SceneGlyph[] = packed.map((p) => ({
    eventId: p.eventId,
    kind: p.kind,
    xStart: p.xStart,
    xEnd: p.xEnd,
    whiskerStart: p.whiskerStart,
    whiskerEnd: p.whiskerEnd,
    row: p.row,
    selected: p.selected,
    title: p.title,
  }))
  const rowCount = glyphs.reduce((m, g) => Math.max(m, g.row + 1), 0)

  const rawMarkers: { x: number; eventId: Id }[] = []
  for (const e of events) {
    const inst = eventInstant(e)
    if (inst === null) continue
    const f = projectLinear(inst, overview)
    if (f < 0 || f > 1) continue // event lies outside the overview's current extent
    rawMarkers.push({ x: f * width, eventId: e.id })
  }
  const markers = aggregateMarkers(rawMarkers, MARKER_BUCKET_PX)

  // Lens = the detail view projected onto the (linear) overview. Clamp it into
  // the band, keep a minimum visible width, then shift it fully inside — so it
  // never spills past an edge when the view sits outside the overview's current
  // (zoomed) extent.
  const lens = lensFromView(view, overview)
  const lx0 = Math.min(Math.max(lens.f0, 0), 1) * width
  const lx1 = Math.min(Math.max(lens.f1, 0), 1) * width
  const lensW = Math.min(Math.max(lx1 - lx0, MIN_LENS_PX), width)
  const x0 = Math.max(0, Math.min(lx0, width - lensW))
  const x1 = x0 + lensW
  const range = { start: rangeLabel(overview.min, nowYear), end: rangeLabel(overview.max, nowYear) }
  return {
    width,
    detail: { ticks, glyphs, rowCount },
    overview: { markers, lens: { x0, x1 }, range },
  }
}
