import type { Precision } from './precision'
import { type CivilTime, decimalFromCivil } from './decimal'

export interface TimePoint {
  year: number
  precision: Precision
  civil?: CivilTime
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
