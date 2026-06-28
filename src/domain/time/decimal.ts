import { daysInYear, dayOfYear, daysInMonth } from './gregorian'

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

// Inverse of decimalFromCivil: break a decimal year back into civil components.
export function civilFromDecimal(dec: number): Required<CivilTime> {
  const y = Math.floor(dec)
  const maxSec = daysInYear(y) * 86400
  // Round to a whole second of the year first, so fp drift can't split a clean
  // boundary into e.g. 23:59:59 of the previous day (or a negative second).
  let secOfYear = Math.round((dec - y) * maxSec)
  if (secOfYear < 0) secOfYear = 0
  else if (secOfYear >= maxSec) secOfYear = maxSec - 1
  let doy = Math.floor(secOfYear / 86400) // 0-based day index into the year
  const sec = secOfYear - doy * 86400
  let mo = 1
  while (doy >= daysInMonth(y, mo)) {
    doy -= daysInMonth(y, mo)
    mo++
  }
  return {
    y,
    mo,
    d: doy + 1,
    h: Math.floor(sec / 3600),
    mi: Math.floor((sec % 3600) / 60),
    s: sec % 60,
  }
}
