import { daysInYear, dayOfYear } from './gregorian'

export interface CivilTime {
  y: number
  mo: number
  d?: number
  h?: number
  mi?: number
  s?: number
}

export function decimalFromCivil(c: CivilTime): number {
  const doy = dayOfYear(c.y, c.mo, c.d ?? 1) // 1-based
  const secondsIntoDay = (c.h ?? 0) * 3600 + (c.mi ?? 0) * 60 + (c.s ?? 0)
  const dayFraction = secondsIntoDay / 86400
  return c.y + (doy - 1 + dayFraction) / daysInYear(c.y)
}
