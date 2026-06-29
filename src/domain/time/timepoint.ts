import type { Precision } from './precision'
import { type CivilTime, decimalFromCivil } from './decimal'

export interface TimePoint {
  year: number
  precision: Precision
  civil?: CivilTime
  fuzz?: { before: number; after: number }
}

export function fromYear(year: number, precision: Precision): TimePoint {
  return { year, precision }
}

export function fromCivil(civil: CivilTime, precision: Precision): TimePoint {
  return { year: decimalFromCivil(civil), precision, civil }
}

export function instantOf(tp: TimePoint): number {
  return tp.civil ? decimalFromCivil(tp.civil) : tp.year
}

export function compareTimePoints(a: TimePoint, b: TimePoint): number {
  return instantOf(a) - instantOf(b)
}

// Attach (or clear) an explicit uncertainty range, in decimal years before/after
// the instant. A zero, negative, or undefined range normalizes to "no fuzz".
export function withFuzz(
  tp: TimePoint,
  fuzz: { before: number; after: number } | undefined,
): TimePoint {
  const before = fuzz && fuzz.before > 0 ? fuzz.before : 0
  const after = fuzz && fuzz.after > 0 ? fuzz.after : 0
  if (before === 0 && after === 0) {
    if (!tp.fuzz) return tp
    const copy = { ...tp }
    delete copy.fuzz
    return copy
  }
  return { ...tp, fuzz: { before, after } }
}
