// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoveMenu } from './MoveMenu'
import { cat } from '../../test/fixtures'

describe('MoveMenu', () => {
  it('renders 顶级 plus a menuitem per target and reports the chosen parent', async () => {
    const onMove = vi.fn()
    const targets = [
      { category: cat({ id: 'a', name: 'A' }), depth: 0 },
      { category: cat({ id: 'b', name: 'B' }), depth: 1 },
    ]
    render(<MoveMenu targets={targets} onMove={onMove} />)
    await userEvent.click(screen.getByRole('menuitem', { name: '顶级' }))
    expect(onMove).toHaveBeenCalledWith(null)
    await userEvent.click(screen.getByRole('menuitem', { name: /「B」/ }))
    expect(onMove).toHaveBeenCalledWith('b')
  })
})
