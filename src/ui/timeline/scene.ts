import type { EventRecord, Id } from '../../domain/model'
import {
  type LinearView,
  projectLinear,
  projectLog,
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
  eventId: Id
}

export interface TimelineScene {
  width: number
  detail: { ticks: SceneTick[]; glyphs: SceneGlyph[]; rowCount: number }
  overview: { markers: SceneMarker[]; lens: { x0: number; x1: number } }
}

export interface BuildSceneInput {
  events: EventRecord[]
  view: LinearView
  nowYear: number
  width: number
  selectedId: Id | null
}

const LABEL_GAP = 80

export function eventInstant(e: EventRecord): number | null {
  if (e.start) return instantOf(e.start)
  if (e.end) return instantOf(e.end)
  return null
}

export function buildScene(input: BuildSceneInput): TimelineScene {
  const { events, view, nowYear, width, selectedId } = input
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

  const markers: SceneMarker[] = []
  for (const e of events) {
    const inst = eventInstant(e)
    if (inst === null) continue
    markers.push({ x: projectLog(inst, nowYear) * width, eventId: e.id })
  }

  const lens = lensFromView(view, nowYear)
  return {
    width,
    detail: { ticks, glyphs, rowCount },
    overview: { markers, lens: { x0: lens.f0 * width, x1: lens.f1 * width } },
  }
}
