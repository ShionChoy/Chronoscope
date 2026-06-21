import { describe, it, expect } from 'vitest'
import { isLeapYear, daysInYear, daysInMonth, dayOfYear } from './gregorian'

describe('gregorian', () => {
  it('applies proleptic leap rule incl. astronomical years', () => {
    expect(isLeapYear(2000)).toBe(true)
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(0)).toBe(true)      // 1 BCE
    expect(isLeapYear(-4)).toBe(true)     // 5 BCE
  })
  it('counts days in year/month', () => {
    expect(daysInYear(2024)).toBe(366)
    expect(daysInYear(2023)).toBe(365)
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2023, 2)).toBe(28)
    expect(daysInMonth(2023, 4)).toBe(30)
  })
  it('computes day of year (1-based)', () => {
    expect(dayOfYear(2023, 1, 1)).toBe(1)
    expect(dayOfYear(2023, 12, 31)).toBe(365)
    expect(dayOfYear(2024, 3, 1)).toBe(61) // 31 + 29 + 1
  })
})
