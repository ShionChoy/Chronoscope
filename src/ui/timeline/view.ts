import { type LinearView, projectLog, unprojectLog, LOG_AGO_MAX } from '../../domain/time'

export interface Lens {
  f0: number
  f1: number
}

export const MIN_RANGE_YEARS = 1 / 365

export function initialView(instants: number[], nowYear: number): LinearView {
  if (instants.length === 0) return { min: nowYear - 100, max: nowYear + 10 }
  let lo = Math.min(...instants)
  let hi = Math.max(...instants)
  if (hi - lo < MIN_RANGE_YEARS) {
    lo -= 50
    hi += 50
  }
  const pad = (hi - lo) * 0.05
  return { min: lo - pad, max: hi + pad }
}

export function zoomView(view: LinearView, anchorFraction: number, factor: number): LinearView {
  const range = view.max - view.min
  const anchorYear = view.min + anchorFraction * range
  const newRange = Math.max(range * factor, MIN_RANGE_YEARS)
  return {
    min: anchorYear - anchorFraction * newRange,
    max: anchorYear + (1 - anchorFraction) * newRange,
  }
}

export function panView(view: LinearView, deltaFraction: number): LinearView {
  const shift = (view.max - view.min) * deltaFraction
  return { min: view.min + shift, max: view.max + shift }
}

export function clampView(view: LinearView, nowYear: number): LinearView {
  const minYear = nowYear - LOG_AGO_MAX
  const min = Math.max(view.min, minYear)
  let max = view.max
  if (max - min < MIN_RANGE_YEARS) {
    max = min + MIN_RANGE_YEARS
  }
  return { min, max }
}

export function lensFromView(view: LinearView, nowYear: number): Lens {
  const a = projectLog(view.min, nowYear)
  const b = projectLog(view.max, nowYear)
  return { f0: Math.min(a, b), f1: Math.max(a, b) }
}

// NOTE: the log overview only represents the past (ago clamped to [1, 14e9]),
// so a lens at f1=1 maps back to nowYear-1. Dragging the lens on a view that
// extends to/past "now" therefore snaps max to ~nowYear-1; pan/zoom are
// unaffected (the view is the source of truth there). Acceptable for a
// deep-time overview; revisit if precise near-now lens dragging is needed.
export function viewFromLens(lens: Lens, nowYear: number): LinearView {
  return { min: unprojectLog(lens.f0, nowYear), max: unprojectLog(lens.f1, nowYear) }
}
