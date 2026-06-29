// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorPicker } from './ColorPicker'

describe('ColorPicker', () => {
  it('calls onPick when a preset swatch is clicked', async () => {
    const onPick = vi.fn()
    render(<ColorPicker value="#000000" presets={['#abcdef', '#123456']} custom={[]} onPick={onPick} onAddCustom={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('颜色 #abcdef'))
    expect(onPick).toHaveBeenCalledWith('#abcdef')
  })

  it('renders custom swatches', () => {
    render(<ColorPicker value="#000000" presets={[]} custom={['#999999']} onPick={vi.fn()} onAddCustom={vi.fn()} />)
    expect(screen.getByLabelText('颜色 #999999')).toBeTruthy()
  })

  it('adds and applies a color from the custom input', () => {
    const onPick = vi.fn()
    const onAddCustom = vi.fn()
    const { container } = render(
      <ColorPicker value="#000000" presets={[]} custom={[]} onPick={onPick} onAddCustom={onAddCustom} />,
    )
    const input = container.querySelector('input[type="color"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: '#abcdef' } })
    expect(onAddCustom).toHaveBeenCalledWith('#abcdef')
    expect(onPick).toHaveBeenCalledWith('#abcdef')
  })

  it('marks the swatch matching value as selected (case-insensitive)', () => {
    render(<ColorPicker value="#ABCDEF" presets={['#abcdef', '#123456']} custom={[]} onPick={vi.fn()} onAddCustom={vi.fn()} />)
    expect(screen.getByLabelText('颜色 #abcdef').className).toContain('selected')
    expect(screen.getByLabelText('颜色 #123456').className).not.toContain('selected')
  })
})
