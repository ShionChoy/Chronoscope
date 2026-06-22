// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeInput } from './TimeInput'
import { fromYear } from '../../domain/time'

describe('TimeInput', () => {
  it('parses free text and emits a TimePoint with a preview', async () => {
    const onChange = vi.fn()
    render(<TimeInput label="起点" value={null} nowYear={2026} onChange={onChange} />)
    const field = screen.getByLabelText('起点')
    await userEvent.type(field, '公元前3000年')
    expect(onChange).toHaveBeenLastCalledWith(fromYear(-2999, 'year'))
    expect(screen.getByText('公元前3000年')).toBeTruthy() // preview
  })

  it('shows 无法识别 and emits null for unparseable text', async () => {
    const onChange = vi.fn()
    render(<TimeInput label="起点" value={null} nowYear={2026} onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('起点'), 'qwerty')
    expect(screen.getByText('无法识别')).toBeTruthy()
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('emits via the structured precision + year controls', async () => {
    const onChange = vi.fn()
    render(<TimeInput label="起点" value={null} nowYear={2026} onChange={onChange} />)
    await userEvent.clear(screen.getByLabelText('起点 年份'))
    await userEvent.type(screen.getByLabelText('起点 年份'), '1969')
    expect(onChange).toHaveBeenLastCalledWith(fromYear(1969, 'year'))
  })

  it('the structured precision dropdown offers only year-and-coarser precisions', () => {
    // The structured "year" control cannot express civil sub-fields, so it must
    // not offer fine precisions (day/month/hour/minute/second) — picking one
    // there would build a civil-less, malformed TimePoint. Fine times go via
    // the free-text field. (Coarse deep-time precisions stay available.)
    render(<TimeInput label="起点" value={null} nowYear={2026} onChange={vi.fn()} />)
    const select = screen.getByLabelText('起点 精度')
    const options = [...select.querySelectorAll('option')].map((o) => o.value)
    expect(options).toEqual(['year', 'decade', 'century', 'millennium', 'ka', 'Ma', 'Ga'])
    for (const fine of ['second', 'minute', 'hour', 'day', 'month']) {
      expect(options).not.toContain(fine)
    }
  })

  it('clamps an incoming fine precision to year so the structured control stays valid', async () => {
    // Editing an event whose start was entered as a fine precision: the
    // structured precision must clamp to 'year' (not the fine one), so changing
    // the year emits a valid coarse TimePoint rather than a civil-less fine one.
    const onChange = vi.fn()
    render(
      <TimeInput label="起点" value={{ year: 2026, precision: 'day' }} nowYear={2026} onChange={onChange} />,
    )
    await userEvent.clear(screen.getByLabelText('起点 年份'))
    await userEvent.type(screen.getByLabelText('起点 年份'), '2000')
    expect(onChange).toHaveBeenLastCalledWith(fromYear(2000, 'year'))
  })
})
