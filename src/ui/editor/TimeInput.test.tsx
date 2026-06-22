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
})
