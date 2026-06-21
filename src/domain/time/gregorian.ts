export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

export function daysInYear(y: number): number {
  return isLeapYear(y) ? 366 : 365
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export function daysInMonth(y: number, mo: number): number {
  if (mo === 2 && isLeapYear(y)) return 29
  return MONTH_DAYS[mo - 1]
}

export function dayOfYear(y: number, mo: number, d: number): number {
  let n = d
  for (let m = 1; m < mo; m++) n += daysInMonth(y, m)
  return n
}
