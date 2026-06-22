export interface LinearView {
  min: number
  max: number
}

export const LOG_AGO_MIN = 1
export const LOG_AGO_MAX = 14e9

export function projectLinear(year: number, view: LinearView): number {
  return (year - view.min) / (view.max - view.min)
}

export function projectLog(year: number, nowYear: number): number {
  const ago = Math.min(Math.max(nowYear - year, LOG_AGO_MIN), LOG_AGO_MAX)
  const span = Math.log10(LOG_AGO_MAX) - Math.log10(LOG_AGO_MIN)
  return 1 - (Math.log10(ago) - Math.log10(LOG_AGO_MIN)) / span
}

export function unprojectLinear(fraction: number, view: LinearView): number {
  return view.min + fraction * (view.max - view.min)
}

export function unprojectLog(fraction: number, nowYear: number): number {
  if (fraction === 0) return nowYear - LOG_AGO_MAX
  if (fraction === 1) return nowYear - LOG_AGO_MIN
  const span = Math.log10(LOG_AGO_MAX) - Math.log10(LOG_AGO_MIN)
  const ago = Math.pow(10, Math.log10(LOG_AGO_MIN) + (1 - fraction) * span)
  return nowYear - ago
}
