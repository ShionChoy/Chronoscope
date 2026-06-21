# Timeline — Plan 1: Domain Foundation (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the project scaffold and the pure, fully-unit-tested `domain/time` and `domain/model` modules — the foundation every later plan depends on.

**Architecture:** Pure TypeScript domain core with zero runtime dependencies, zero knowledge of React/IndexedDB/DOM. Time is represented as a decimal "year" (double) plus a precision bucket, with exact calendar fields for month-and-finer precision. All functions are deterministic and tested with Vitest.

**Tech Stack:** Vite + React + TypeScript (app shell only in this plan), Vitest (unit tests). No other runtime libs yet.

## Roadmap (this is Plan 1 of 5)

1. **Plan 1 — Domain Foundation** ← this document
2. Plan 2 — Data & State (repository interfaces, Dexie impl, HLC, merge, import/export, state)
3. Plan 3 — Shell + List view + Editor (first usable app)
4. Plan 4 — Timeline view (dual-axis Canvas renderer + interaction)
5. Plan 5 — Polish (PWA, links UI, markdown, mobile drawer, a11y, desktop auto-save)

## Global Constraints

- **Prerequisite:** Node ≥ 18 **with `npm` available**. This environment has `node` (via VS Code) but no `npm`; install a full Node toolchain before executing (e.g. `nvm install --lts`). Verify with `node -v && npm -v`.
- **TypeScript strict mode** on (`"strict": true`).
- **`src/domain/**` is pure:** no imports from React, Dexie, DOM, `Date`, or any other `src/` layer except within `domain/`. Functions that need "now" take it as a parameter (`nowYear`).
- **Year numbering:** decimal years, proleptic Gregorian, astronomical numbering — year `0` = 1 BCE, `-1` = 2 BCE, so `N BCE = 1 - N`.
- **Precision buckets (fine → coarse):** `second, minute, hour, day, month, year, decade, century, millennium, ka, Ma, Ga`.
- **`civil` calendar fields are present iff precision ∈ {month, day, hour, minute, second}**; `year` and coarser carry only the numeric `year`.
- **TDD:** every behavior gets a failing test first. Commit after each green task.
- **Commit trailer:** end every commit message with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Project scaffold & test runner

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working Vite app (`npm run dev`) and Vitest runner (`npm test`).

- [ ] **Step 1: Scaffold with Vite React-TS template**

Run:
```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D vitest
```
If `npm create` refuses because the directory is non-empty, scaffold in a temp dir and copy `src/`, `index.html`, `package.json`, `tsconfig*.json`, `vite.config.ts` over, then `npm install`.

- [ ] **Step 2: Add the test script and Vitest config to `vite.config.ts`**

Replace `vite.config.ts` with:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { globals: true, environment: 'node' },
})
```
Add to `package.json` `"scripts"`: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Write the smoke test**

Create `src/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('test runner', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Run the test suite**

Run: `npm test`
Expected: PASS, 1 test passed.

- [ ] **Step 5: Ensure `tsconfig.json` has strict mode**

Confirm `"strict": true` exists under `compilerOptions` (the Vite template sets it). Add it if missing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React-TS app with Vitest

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Precision model

**Files:**
- Create: `src/domain/time/precision.ts`
- Test: `src/domain/time/precision.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Precision = 'second'|'minute'|'hour'|'day'|'month'|'year'|'decade'|'century'|'millennium'|'ka'|'Ma'|'Ga'`
  - `const PRECISION_ORDER: Precision[]` (fine → coarse)
  - `const PRECISION_YEARS: Record<Precision, number>` (nominal length of one unit, in years)
  - `function comparePrecision(a: Precision, b: Precision): number` (negative if a finer)
  - `function isFiner(a: Precision, b: Precision): boolean`

- [ ] **Step 1: Write the failing test**

Create `src/domain/time/precision.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { PRECISION_ORDER, PRECISION_YEARS, comparePrecision, isFiner } from './precision'

describe('precision', () => {
  it('orders fine to coarse', () => {
    expect(PRECISION_ORDER[0]).toBe('second')
    expect(PRECISION_ORDER[PRECISION_ORDER.length - 1]).toBe('Ga')
  })
  it('maps units to years', () => {
    expect(PRECISION_YEARS.year).toBe(1)
    expect(PRECISION_YEARS.decade).toBe(10)
    expect(PRECISION_YEARS.Ma).toBe(1_000_000)
    expect(PRECISION_YEARS.day).toBeCloseTo(1 / 365.2425, 6)
  })
  it('compares precision', () => {
    expect(comparePrecision('second', 'year')).toBeLessThan(0)
    expect(isFiner('day', 'month')).toBe(true)
    expect(isFiner('Ga', 'year')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/time/precision.test.ts`
Expected: FAIL ("Cannot find module './precision'").

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/time/precision.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/time/precision.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time/precision.ts src/domain/time/precision.test.ts
git commit -m "feat(time): add precision model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Proleptic Gregorian calendar helpers

**Files:**
- Create: `src/domain/time/gregorian.ts`
- Test: `src/domain/time/gregorian.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `function isLeapYear(y: number): boolean`
  - `function daysInYear(y: number): number`
  - `function daysInMonth(y: number, mo: number): number` (mo 1–12)
  - `function dayOfYear(y: number, mo: number, d: number): number` (1-based)

- [ ] **Step 1: Write the failing test**

Create `src/domain/time/gregorian.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/time/gregorian.test.ts`
Expected: FAIL ("Cannot find module './gregorian'").

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/time/gregorian.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/time/gregorian.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time/gregorian.ts src/domain/time/gregorian.test.ts
git commit -m "feat(time): add proleptic Gregorian calendar helpers

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Civil → decimal year conversion

**Files:**
- Create: `src/domain/time/decimal.ts`
- Test: `src/domain/time/decimal.test.ts`

**Interfaces:**
- Consumes: `daysInYear`, `dayOfYear` from `./gregorian`.
- Produces:
  - `interface CivilTime { y: number; mo: number; d?: number; h?: number; mi?: number; s?: number }`
  - `function decimalFromCivil(c: CivilTime): number`

- [ ] **Step 1: Write the failing test**

Create `src/domain/time/decimal.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { decimalFromCivil } from './decimal'

describe('decimalFromCivil', () => {
  it('maps Jan 1 to the integer year', () => {
    expect(decimalFromCivil({ y: 2000, mo: 1, d: 1 })).toBe(2000)
    expect(decimalFromCivil({ y: 2001, mo: 1, d: 1 })).toBe(2001)
  })
  it('is monotonic within a year', () => {
    const jul = decimalFromCivil({ y: 2000, mo: 7, d: 1 })
    expect(jul).toBeGreaterThan(2000.4)
    expect(jul).toBeLessThan(2000.6)
  })
  it('treats missing day/time as start of bucket', () => {
    expect(decimalFromCivil({ y: 2000, mo: 1 })).toBe(2000)
  })
  it('advances with time of day', () => {
    const noon = decimalFromCivil({ y: 2023, mo: 1, d: 1, h: 12 })
    expect(noon).toBeCloseTo(2023 + 0.5 / 365, 6)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/time/decimal.test.ts`
Expected: FAIL ("Cannot find module './decimal'").

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/time/decimal.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/time/decimal.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time/decimal.ts src/domain/time/decimal.test.ts
git commit -m "feat(time): add civil-to-decimal-year conversion

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: TimePoint type, constructors, ordering

**Files:**
- Create: `src/domain/time/timepoint.ts`
- Test: `src/domain/time/timepoint.test.ts`

**Interfaces:**
- Consumes: `Precision` from `./precision`; `CivilTime`, `decimalFromCivil` from `./decimal`.
- Produces:
  - `interface TimePoint { year: number; precision: Precision; civil?: CivilTime }`
  - `function fromYear(year: number, precision: Precision): TimePoint`
  - `function fromCivil(civil: CivilTime, precision: Precision): TimePoint`
  - `function instantOf(tp: TimePoint): number` (canonical decimal year for ordering)
  - `function compareTimePoints(a: TimePoint, b: TimePoint): number`

- [ ] **Step 1: Write the failing test**

Create `src/domain/time/timepoint.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { fromYear, fromCivil, instantOf, compareTimePoints } from './timepoint'

describe('timepoint', () => {
  it('builds from a bare year', () => {
    const tp = fromYear(-2999, 'year')
    expect(tp.year).toBe(-2999)
    expect(tp.civil).toBeUndefined()
    expect(instantOf(tp)).toBe(-2999)
  })
  it('builds from civil and stores both', () => {
    const tp = fromCivil({ y: 2026, mo: 6, d: 21 }, 'day')
    expect(tp.civil).toEqual({ y: 2026, mo: 6, d: 21 })
    expect(instantOf(tp)).toBeGreaterThan(2026.4)
  })
  it('orders across scales', () => {
    const big = fromYear(-3.8e9, 'Ga')
    const recent = fromCivil({ y: 2026, mo: 6, d: 21 }, 'day')
    expect(compareTimePoints(big, recent)).toBeLessThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/time/timepoint.test.ts`
Expected: FAIL ("Cannot find module './timepoint'").

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/time/timepoint.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/time/timepoint.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time/timepoint.ts src/domain/time/timepoint.test.ts
git commit -m "feat(time): add TimePoint type, constructors, ordering

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Fuzzy span (precision → extent in years)

**Files:**
- Create: `src/domain/time/span.ts`
- Test: `src/domain/time/span.test.ts`

**Interfaces:**
- Consumes: `PRECISION_YEARS` from `./precision`; `TimePoint`, `instantOf` from `./timepoint`.
- Produces:
  - `function spanOf(tp: TimePoint): { start: number; end: number }`
  - Rule: calendar-aligned buckets (`second…millennium`, `decade`, `century`) → `[instant, instant + unit)`. Approximate scientific precisions (`ka`, `Ma`, `Ga`) → `[instant - unit/2, instant + unit/2]`.

- [ ] **Step 1: Write the failing test**

Create `src/domain/time/span.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { fromYear } from './timepoint'
import { spanOf } from './span'

describe('spanOf', () => {
  it('treats a year as a half-open bucket', () => {
    expect(spanOf(fromYear(1990, 'year'))).toEqual({ start: 1990, end: 1991 })
  })
  it('treats a decade as a 10-year bucket', () => {
    expect(spanOf(fromYear(1990, 'decade'))).toEqual({ start: 1990, end: 2000 })
  })
  it('centers approximate geological precisions', () => {
    const s = spanOf(fromYear(-3.8e9, 'Ga'))
    expect(s.start).toBe(-3.8e9 - 0.5e9)
    expect(s.end).toBe(-3.8e9 + 0.5e9)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/time/span.test.ts`
Expected: FAIL ("Cannot find module './span'").

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/time/span.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/time/span.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time/span.ts src/domain/time/span.test.ts
git commit -m "feat(time): add fuzzy span from precision

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Display formatting

**Files:**
- Create: `src/domain/time/format.ts`
- Test: `src/domain/time/format.test.ts`

**Interfaces:**
- Consumes: `Precision` from `./precision`; `TimePoint` from `./timepoint`; constructors in tests.
- Produces:
  - `function formatTimePoint(tp: TimePoint, nowYear: number): string` (Chinese)

- [ ] **Step 1: Write the failing test**

Create `src/domain/time/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { fromYear, fromCivil } from './timepoint'
import { formatTimePoint } from './format'

const NOW = 2026

describe('formatTimePoint', () => {
  it('formats civil precisions', () => {
    expect(formatTimePoint(fromCivil({ y: 2026, mo: 6, d: 21 }, 'day'), NOW)).toBe('2026-06-21')
    expect(formatTimePoint(fromCivil({ y: 2026, mo: 6 }, 'month'), NOW)).toBe('2026-06')
    expect(formatTimePoint(fromCivil({ y: 2026, mo: 6, d: 21, h: 15, mi: 30 }, 'minute'), NOW)).toBe('2026-06-21 15:30')
  })
  it('formats years and BCE', () => {
    expect(formatTimePoint(fromYear(1969, 'year'), NOW)).toBe('1969年')
    expect(formatTimePoint(fromYear(-2999, 'year'), NOW)).toBe('公元前3000年')
    expect(formatTimePoint(fromYear(1990, 'decade'), NOW)).toBe('1990年代')
  })
  it('formats geological precisions relative to now', () => {
    expect(formatTimePoint(fromYear(NOW - 3.8e9, 'Ga'), NOW)).toBe('约38.0亿年前')
    expect(formatTimePoint(fromYear(NOW - 66e6, 'Ma'), NOW)).toBe('约6600万年前')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/time/format.test.ts`
Expected: FAIL ("Cannot find module './format'").

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/time/format.ts`:
```ts
import type { Precision } from './precision'
import type { TimePoint } from './timepoint'

const RELATIVE: Precision[] = ['ka', 'Ma', 'Ga']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
function yearNum(y: number): string {
  return y > 0 ? `${y}` : `公元前${1 - y}`
}
function yearLabel(y: number): string {
  return y > 0 ? `${y}年` : `公元前${1 - y}年`
}

export function formatTimePoint(tp: TimePoint, nowYear: number): string {
  if (RELATIVE.includes(tp.precision)) {
    const ago = nowYear - tp.year
    if (ago >= 1e8) return `约${(ago / 1e8).toFixed(1)}亿年前`
    if (ago >= 1e4) return `约${Math.round(ago / 1e4)}万年前`
    return `约${Math.round(ago)}年前`
  }
  const c = tp.civil
  switch (tp.precision) {
    case 'second':
      return `${yearNum(c!.y)}-${pad(c!.mo)}-${pad(c!.d!)} ${pad(c!.h ?? 0)}:${pad(c!.mi ?? 0)}:${pad(c!.s ?? 0)}`
    case 'minute':
      return `${yearNum(c!.y)}-${pad(c!.mo)}-${pad(c!.d!)} ${pad(c!.h ?? 0)}:${pad(c!.mi ?? 0)}`
    case 'hour':
      return `${yearNum(c!.y)}-${pad(c!.mo)}-${pad(c!.d!)} ${pad(c!.h ?? 0)}时`
    case 'day':
      return `${yearNum(c!.y)}-${pad(c!.mo)}-${pad(c!.d!)}`
    case 'month':
      return `${yearNum(c!.y)}-${pad(c!.mo)}`
    case 'year':
      return yearLabel(tp.year)
    case 'decade':
      return tp.year > 0 ? `${tp.year}年代` : `公元前${1 - tp.year}年代`
    case 'century':
      return tp.year >= 0
        ? `${Math.floor(tp.year / 100) + 1}世纪`
        : `公元前${Math.floor(-tp.year / 100) + 1}世纪`
    case 'millennium':
      return `${yearLabel(tp.year)}起千年`
    default:
      return yearLabel(tp.year)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/time/format.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time/format.ts src/domain/time/format.test.ts
git commit -m "feat(time): add Chinese display formatting

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Free-text input parsing

**Files:**
- Create: `src/domain/time/parse.ts`
- Test: `src/domain/time/parse.test.ts`

**Interfaces:**
- Consumes: `fromYear`, `fromCivil` from `./timepoint`; `TimePoint`.
- Produces:
  - `function parseTimeInput(text: string, nowYear: number): TimePoint | null`
  - Supported forms (anything else → `null`; the structured picker built in Plan 3 is the always-available fallback): `YYYY-MM-DD HH:MM[:SS]`, `YYYY-MM-DD`, `YYYY-MM`, bare `YYYY` (CE year), `公元前N年` / `前N年`, `YYYY年代`, `约?X[.X]亿年前`, `约?X[.X]万年前`, `约?N年前`.

- [ ] **Step 1: Write the failing test**

Create `src/domain/time/parse.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseTimeInput } from './parse'
import { instantOf } from './timepoint'

const NOW = 2026

describe('parseTimeInput', () => {
  it('parses ISO-ish datetimes', () => {
    expect(parseTimeInput('2026-06-21 15:30', NOW)).toMatchObject({
      precision: 'minute', civil: { y: 2026, mo: 6, d: 21, h: 15, mi: 30 },
    })
    expect(parseTimeInput('2026-06-21', NOW)).toMatchObject({ precision: 'day' })
    expect(parseTimeInput('2026-06', NOW)).toMatchObject({ precision: 'month' })
    expect(parseTimeInput('2026', NOW)).toMatchObject({ precision: 'year', year: 2026 })
  })
  it('parses BCE and decades', () => {
    expect(parseTimeInput('公元前3000年', NOW)).toMatchObject({ precision: 'year', year: -2999 })
    expect(parseTimeInput('1990年代', NOW)).toMatchObject({ precision: 'decade', year: 1990 })
  })
  it('parses geological "ago" forms', () => {
    const ga = parseTimeInput('约38亿年前', NOW)!
    expect(ga.precision).toBe('Ga')
    expect(instantOf(ga)).toBeCloseTo(NOW - 3.8e9, 0)
    const wan = parseTimeInput('30万年前', NOW)! // 3e5 yr ago ⇒ ka (< 1e6)
    expect(wan.precision).toBe('ka')
    expect(instantOf(wan)).toBeCloseTo(NOW - 3e5, 0)
  })
  it('returns null for unrecognized input', () => {
    expect(parseTimeInput('sometime last summer', NOW)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/time/parse.test.ts`
Expected: FAIL ("Cannot find module './parse'").

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/time/parse.ts`:
```ts
import { type TimePoint, fromYear, fromCivil } from './timepoint'

export function parseTimeInput(text: string, nowYear: number): TimePoint | null {
  const t = text.trim()

  let m = /^(-?\d{1,})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t)
  if (m) {
    const [, y, mo, d, h, mi, s] = m
    const civil = { y: +y, mo: +mo, d: +d, h: +h, mi: +mi, ...(s ? { s: +s } : {}) }
    return fromCivil(civil, s ? 'second' : 'minute')
  }
  m = /^(-?\d{1,})-(\d{1,2})-(\d{1,2})$/.exec(t)
  if (m) return fromCivil({ y: +m[1], mo: +m[2], d: +m[3] }, 'day')

  m = /^(-?\d{1,})-(\d{1,2})$/.exec(t)
  if (m) return fromCivil({ y: +m[1], mo: +m[2] }, 'month')

  m = /^公元前(\d+)年$|^前(\d+)年$/.exec(t)
  if (m) return fromYear(1 - +(m[1] ?? m[2]), 'year')

  m = /^(\d+)年代$/.exec(t)
  if (m) return fromYear(+m[1], 'decade')

  m = /^约?(\d+(?:\.\d+)?)亿年前$/.exec(t)
  if (m) {
    const ago = +m[1] * 1e8
    return fromYear(nowYear - ago, ago >= 1e9 ? 'Ga' : 'Ma')
  }
  m = /^约?(\d+(?:\.\d+)?)万年前$/.exec(t)
  if (m) {
    const ago = +m[1] * 1e4
    return fromYear(nowYear - ago, ago >= 1e6 ? 'Ma' : 'ka')
  }
  m = /^约?(\d+)年前$/.exec(t)
  if (m) return fromYear(nowYear - +m[1], 'year')

  m = /^(-?\d{1,})$/.exec(t)
  if (m) return fromYear(+m[1], 'year')

  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/time/parse.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time/parse.ts src/domain/time/parse.test.ts
git commit -m "feat(time): add free-text time input parsing

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Axis projections (linear + logarithmic)

**Files:**
- Create: `src/domain/time/project.ts`
- Test: `src/domain/time/project.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface LinearView { min: number; max: number }`
  - `function projectLinear(year: number, view: LinearView): number` (fraction 0..1; min→0, max→1)
  - `function projectLog(year: number, nowYear: number): number` (fraction 0..1; oldest bound→0, now→1)
  - `const LOG_AGO_MIN = 1`, `const LOG_AGO_MAX = 14e9` (clamp bounds for the log overview)

- [ ] **Step 1: Write the failing test**

Create `src/domain/time/project.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { projectLinear, projectLog, LOG_AGO_MAX } from './project'

describe('projectLinear', () => {
  it('maps endpoints to 0 and 1', () => {
    const view = { min: 1900, max: 2000 }
    expect(projectLinear(1900, view)).toBe(0)
    expect(projectLinear(2000, view)).toBe(1)
    expect(projectLinear(1950, view)).toBeCloseTo(0.5, 6)
  })
})

describe('projectLog', () => {
  const NOW = 2026
  it('puts now near 1 and the oldest bound at 0', () => {
    expect(projectLog(NOW, NOW)).toBeCloseTo(1, 6)
    expect(projectLog(NOW - LOG_AGO_MAX, NOW)).toBeCloseTo(0, 6)
  })
  it('is monotonic: older ⇒ smaller fraction', () => {
    expect(projectLog(NOW - 100, NOW)).toBeGreaterThan(projectLog(NOW - 1e6, NOW))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/time/project.test.ts`
Expected: FAIL ("Cannot find module './project'").

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/time/project.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/time/project.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time/project.ts src/domain/time/project.test.ts
git commit -m "feat(time): add linear and logarithmic axis projections

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Adaptive tick generation

**Files:**
- Create: `src/domain/time/ticks.ts`
- Test: `src/domain/time/ticks.test.ts`

**Interfaces:**
- Consumes: `Precision`, `PRECISION_ORDER`, `PRECISION_YEARS` from `./precision`; `LinearView` from `./project`.
- Produces:
  - `function chooseTickPrecision(rangeYears: number, maxTicks?: number): Precision`
  - `function generateTicks(view: LinearView, maxTicks?: number): { year: number; precision: Precision }[]`
  - (Labels are produced by the caller via `formatTimePoint(fromYear(year, precision), nowYear)`; ticks carry `precision` so callers can format them. Kept label-free here to stay pure of "now".)

- [ ] **Step 1: Write the failing test**

Create `src/domain/time/ticks.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { chooseTickPrecision, generateTicks } from './ticks'

describe('chooseTickPrecision', () => {
  it('picks a unit giving a readable number of ticks', () => {
    expect(chooseTickPrecision(100)).toBe('decade')   // 100yr / 10 = 10 ticks
    expect(chooseTickPrecision(5)).toBe('year')       // 5yr / 1 = 5 ticks
    expect(chooseTickPrecision(5e9)).toBe('Ga')       // huge range
  })
})

describe('generateTicks', () => {
  it('produces aligned ticks within the view', () => {
    const ticks = generateTicks({ min: 1995, max: 2025 })
    expect(ticks.length).toBeGreaterThanOrEqual(3)
    expect(ticks.length).toBeLessThanOrEqual(12)
    expect(ticks[0].year).toBeGreaterThanOrEqual(1995)
    expect(ticks[ticks.length - 1].year).toBeLessThanOrEqual(2025)
    for (const t of ticks) expect(t.precision).toBe('decade')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/time/ticks.test.ts`
Expected: FAIL ("Cannot find module './ticks'").

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/time/ticks.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/time/ticks.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time/ticks.ts src/domain/time/ticks.test.ts
git commit -m "feat(time): add adaptive tick generation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: Time module barrel export

**Files:**
- Create: `src/domain/time/index.ts`
- Test: `src/domain/time/index.test.ts`

**Interfaces:**
- Consumes: all sibling modules.
- Produces: a single import surface `@/domain/time` re-exporting `Precision`, `TimePoint`, `CivilTime`, and every public function.

- [ ] **Step 1: Write the failing test**

Create `src/domain/time/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import * as time from './index'

describe('time barrel', () => {
  it('re-exports the public surface', () => {
    expect(typeof time.fromYear).toBe('function')
    expect(typeof time.fromCivil).toBe('function')
    expect(typeof time.formatTimePoint).toBe('function')
    expect(typeof time.parseTimeInput).toBe('function')
    expect(typeof time.spanOf).toBe('function')
    expect(typeof time.projectLinear).toBe('function')
    expect(typeof time.projectLog).toBe('function')
    expect(typeof time.generateTicks).toBe('function')
    expect(typeof time.compareTimePoints).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/time/index.test.ts`
Expected: FAIL ("Cannot find module './index'").

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/time/index.ts`:
```ts
export * from './precision'
export * from './gregorian'
export * from './decimal'
export * from './timepoint'
export * from './span'
export * from './format'
export * from './parse'
export * from './project'
export * from './ticks'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/time/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time/index.ts src/domain/time/index.test.ts
git commit -m "feat(time): add module barrel export

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: Domain model types & validation

**Files:**
- Create: `src/domain/model/types.ts`, `src/domain/model/validate.ts`, `src/domain/model/index.ts`
- Test: `src/domain/model/validate.test.ts`

**Interfaces:**
- Consumes: `TimePoint` from `../time`.
- Produces:
  - `type Id = string`
  - `interface EventRecord { id: Id; title: string; start?: TimePoint; end?: TimePoint; note: string; categoryId: Id | null; tagIds: Id[]; links: Id[]; createdAt: string; updatedAt: string; deleted: boolean }` (timestamps are HLC strings, produced by Plan 2; the domain only declares the shape)
  - `interface Category { id: Id; name: string; parentId: Id | null; color: string; order: number }`
  - `interface Tag { id: Id; name: string; color: string }`
  - `function validateEvent(e: Pick<EventRecord, 'title' | 'start' | 'end'>): { ok: boolean; errors: string[] }`

> Naming note: the entity is `EventRecord`, not `Event` — `Event` is a DOM global and would shadow it. Plan 2 and later refer to `EventRecord`.

- [ ] **Step 1: Write the failing test**

Create `src/domain/model/validate.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { fromYear } from '../time'
import { validateEvent } from './validate'

describe('validateEvent', () => {
  it('requires a title', () => {
    const r = validateEvent({ title: '  ', start: fromYear(2000, 'year') })
    expect(r.ok).toBe(false)
    expect(r.errors).toContain('标题不能为空')
  })
  it('requires at least one of start/end', () => {
    const r = validateEvent({ title: '事件' })
    expect(r.ok).toBe(false)
    expect(r.errors).toContain('至少需要起点或终点')
  })
  it('rejects end before start', () => {
    const r = validateEvent({
      title: '事件',
      start: fromYear(2000, 'year'),
      end: fromYear(1990, 'year'),
    })
    expect(r.ok).toBe(false)
    expect(r.errors).toContain('终点不能早于起点')
  })
  it('accepts a valid point event', () => {
    const r = validateEvent({ title: '事件', start: fromYear(2000, 'year') })
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/model/validate.test.ts`
Expected: FAIL ("Cannot find module './validate'").

- [ ] **Step 3: Write minimal implementation**

Create `src/domain/model/types.ts`:
```ts
import type { TimePoint } from '../time'

export type Id = string

export interface EventRecord {
  id: Id
  title: string
  start?: TimePoint
  end?: TimePoint
  note: string
  categoryId: Id | null
  tagIds: Id[]
  links: Id[]
  createdAt: string // HLC timestamp (Plan 2)
  updatedAt: string // HLC timestamp (Plan 2)
  deleted: boolean
}

export interface Category {
  id: Id
  name: string
  parentId: Id | null
  color: string
  order: number
}

export interface Tag {
  id: Id
  name: string
  color: string
}
```

Create `src/domain/model/validate.ts`:
```ts
import { compareTimePoints, type TimePoint } from '../time'

export function validateEvent(e: {
  title: string
  start?: TimePoint
  end?: TimePoint
}): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (!e.title || e.title.trim() === '') errors.push('标题不能为空')
  if (!e.start && !e.end) errors.push('至少需要起点或终点')
  if (e.start && e.end && compareTimePoints(e.end, e.start) < 0) {
    errors.push('终点不能早于起点')
  }
  return { ok: errors.length === 0, errors }
}
```

Create `src/domain/model/index.ts`:
```ts
export * from './types'
export * from './validate'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/model/validate.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the whole suite and commit**

Run: `npm test`
Expected: PASS (all suites green).

```bash
git add src/domain/model/
git commit -m "feat(model): add domain entity types and event validation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage (for the foundation slice):**
- Time model (decimal year + precision + civil) → Tasks 2–5. ✅
- Fuzzy/partial times (optional start/end, precision span) → Tasks 5, 6, 12. ✅
- BCE/geological scale → Tasks 3, 4, 7, 8 (astronomical numbering tested). ✅
- Parsing the example inputs ("约38亿年前", "公元前3000年", "1990年代", "2026-06-21 15:30") → Task 8. ✅
- Dual-axis projection math (log overview + linear detail) → Tasks 9, 10. ✅
- Entity model (Event/Category/Tag, nested via parentId, multi-tag, links, tombstone) → Task 12. ✅
- *Deferred to later plans (correctly out of scope here):* storage/Dexie, HLC generation, merge/import-export (Plan 2); UI/views/themes (Plans 3–5). HLC fields are declared as shapes in Task 12 but produced in Plan 2 — consistent.

**2. Placeholder scan:** No "TBD/TODO". Every code step has complete, runnable code and tests. ✅

**3. Type consistency:** `Precision`, `TimePoint`, `CivilTime` names consistent across tasks. `instantOf` used by span/timepoint/parse consistently. Entity named `EventRecord` (not `Event`) — flagged for later plans. `fromYear`/`fromCivil`/`formatTimePoint`/`parseTimeInput`/`spanOf`/`projectLinear`/`projectLog`/`generateTicks`/`compareTimePoints` names match between producer tasks and the barrel (Task 11) and model (Task 12). ✅
