import { useState } from 'react'
import {
  parseTimeInput,
  formatTimePoint,
  fromYear,
  PRECISION_ORDER,
  type TimePoint,
  type Precision,
} from '../../domain/time'

export interface TimeInputProps {
  label: string
  value: TimePoint | null
  nowYear: number
  onChange: (tp: TimePoint | null) => void
}

export function TimeInput({ label, value, nowYear, onChange }: TimeInputProps) {
  const [text, setText] = useState('')
  const [precision, setPrecision] = useState<Precision>(value?.precision ?? 'year')
  const [year, setYear] = useState<string>(value ? String(value.year) : '')

  const parsed = text.trim() ? parseTimeInput(text, nowYear) : null
  const freeTextPreview = text.trim() ? (parsed ? formatTimePoint(parsed, nowYear) : '无法识别') : ''

  const onText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setText(next)
    if (!next.trim()) return onChange(null)
    onChange(parseTimeInput(next, nowYear))
  }

  const emitStructured = (p: Precision, yStr: string) => {
    if (yStr.trim() === '' || Number.isNaN(Number(yStr))) return onChange(null)
    onChange(fromYear(Number(yStr), p))
  }

  return (
    <fieldset className="time-input">
      <legend>{label}</legend>
      <label>
        {label}
        <input value={text} onChange={onText} placeholder="如 公元前3000年 / 2026-06-21 / 约38亿年前" />
      </label>
      {freeTextPreview && <span className="mono preview">{freeTextPreview}</span>}

      <div className="structured">
        <label>
          {`${label} 精度`}
          <select
            value={precision}
            onChange={(e) => {
              const p = e.target.value as Precision
              setPrecision(p)
              emitStructured(p, year)
            }}
          >
            {PRECISION_ORDER.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          {`${label} 年份`}
          <input
            type="number"
            value={year}
            onChange={(e) => {
              setYear(e.target.value)
              emitStructured(precision, e.target.value)
            }}
          />
        </label>
      </div>
    </fieldset>
  )
}
