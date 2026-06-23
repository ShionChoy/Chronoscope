// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventDetailCard } from './EventDetailCard'
import type { EventCardData } from './card'

const data: EventCardData = {
  id: 'a', title: '阿波罗11号', timeLabel: '1969年', note: '**首次**登月',
  categoryName: '航天', tagNames: ['里程碑'], links: [{ id: 'b', title: '土星五号' }],
}

describe('EventDetailCard', () => {
  it('shows title, time, category, tags, and the rendered markdown note', () => {
    render(<EventDetailCard data={data} onEdit={() => {}} onClose={() => {}} onSelectLink={() => {}} />)
    expect(screen.getByText('阿波罗11号')).toBeTruthy()
    expect(screen.getByText('1969年')).toBeTruthy()
    expect(screen.getByText('航天')).toBeTruthy()
    expect(screen.getByText('里程碑')).toBeTruthy()
    expect(document.querySelector('.markdown strong')?.textContent).toBe('首次')
  })
  it('fires onSelectLink with the link id when a link button is clicked', async () => {
    let picked = ''
    render(<EventDetailCard data={data} onEdit={() => {}} onClose={() => {}} onSelectLink={(id) => (picked = id)} />)
    await userEvent.click(screen.getByRole('button', { name: '土星五号' }))
    expect(picked).toBe('b')
  })
  it('fires onEdit and onClose', async () => {
    let edited = false
    let closed = false
    render(<EventDetailCard data={data} onEdit={() => (edited = true)} onClose={() => (closed = true)} onSelectLink={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: '编辑' }))
    await userEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(edited).toBe(true)
    expect(closed).toBe(true)
  })
})
