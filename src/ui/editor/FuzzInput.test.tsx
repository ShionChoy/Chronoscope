// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FuzzInput } from './FuzzInput'

describe('FuzzInput', () => {
  it('emits a symmetric range from ± (default unit 年)', async () => {
    const onChange = vi.fn()
    render(<FuzzInput label="起点" onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('起点 模糊±'), '5')
    expect(onChange).toHaveBeenLastCalledWith({ before: 5, after: 5 })
  })
  it('expands to asymmetric, carrying the ± value across', async () => {
    const onChange = vi.fn()
    render(<FuzzInput label="起点" value={{ before: 3, after: 3 }} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('起点 不对称'))
    const after = screen.getByLabelText('起点 模糊向后')
    await userEvent.clear(after)
    await userEvent.type(after, '9')
    expect(onChange).toHaveBeenLastCalledWith({ before: 3, after: 9 })
  })
  it('clears to undefined when emptied', async () => {
    const onChange = vi.fn()
    render(<FuzzInput label="起点" value={{ before: 5, after: 5 }} onChange={onChange} />)
    await userEvent.clear(screen.getByLabelText('起点 模糊±'))
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })
})
