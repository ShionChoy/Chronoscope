import { PRECISION_ORDER, PRECISION_YEARS, type Precision } from './precision'
import type { LinearView } from './project'

export function chooseTickPrecision(rangeYears: number, maxTicks = 10): Precision {
  for (const p of PRECISION_ORDER) {
    if (rangeYears / PRECISION_YEARS[p] <= maxTicks) return p
  }
  return 'Ga'
}

export function generateTicks(
  view: LinearView,
  maxTicks = 10,
): { year: number; precision: Precision }[] {
  const range = view.max - view.min
  const precision = chooseTickPrecision(range, maxTicks)
  const unit = PRECISION_YEARS[precision]
  const ticks: { year: number; precision: Precision }[] = []
  const start = Math.ceil(view.min / unit) * unit
  for (let y = start; y <= view.max; y += unit) {
    ticks.push({ year: Math.round(y / unit) * unit, precision })
  }
  return ticks
}
