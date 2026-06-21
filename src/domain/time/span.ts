import { PRECISION_YEARS, type Precision } from './precision'
import { type TimePoint, instantOf } from './timepoint'

const APPROX: Precision[] = ['ka', 'Ma', 'Ga']

export function spanOf(tp: TimePoint): { start: number; end: number } {
  const unit = PRECISION_YEARS[tp.precision]
  const base = instantOf(tp)
  if (APPROX.includes(tp.precision)) {
    return { start: base - unit / 2, end: base + unit / 2 }
  }
  return { start: base, end: base + unit }
}
