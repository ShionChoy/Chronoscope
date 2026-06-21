export type Precision =
  | 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'
  | 'decade' | 'century' | 'millennium' | 'ka' | 'Ma' | 'Ga'

export const PRECISION_ORDER: Precision[] = [
  'second', 'minute', 'hour', 'day', 'month', 'year',
  'decade', 'century', 'millennium', 'ka', 'Ma', 'Ga',
]

const YEAR_SECONDS = 31_556_952 // 365.2425 * 86400

export const PRECISION_YEARS: Record<Precision, number> = {
  second: 1 / YEAR_SECONDS,
  minute: 60 / YEAR_SECONDS,
  hour: 3600 / YEAR_SECONDS,
  day: 1 / 365.2425,
  month: 1 / 12,
  year: 1,
  decade: 10,
  century: 100,
  millennium: 1000,
  ka: 1000,
  Ma: 1_000_000,
  Ga: 1_000_000_000,
}

export function comparePrecision(a: Precision, b: Precision): number {
  return PRECISION_ORDER.indexOf(a) - PRECISION_ORDER.indexOf(b)
}

export function isFiner(a: Precision, b: Precision): boolean {
  return comparePrecision(a, b) < 0
}
