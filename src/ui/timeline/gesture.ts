// Pure helpers for interpreting multi-touch pinch on the timeline canvas.
// The view layer owns the pointer Map; these turn raw x-coordinates into the
// scalar inputs (span, scale, midpoint) the zoom math needs.

export function spanOf(xs: number[]): number {
  if (xs.length < 2) return 0
  return Math.max(...xs) - Math.min(...xs)
}

export function pinchScale(prevSpan: number, nextSpan: number): number {
  if (prevSpan <= 0) return 1
  return nextSpan / prevSpan
}

export function midpoint(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}
