// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createStore } from './store'
import { useStore } from './useStore'

describe('useStore', () => {
  it('re-renders when the store changes', () => {
    const store = createStore({ n: 1 })
    function View() {
      const s = useStore(store)
      return <span>n={s.n}</span>
    }
    render(<View />)
    expect(screen.getByText('n=1')).toBeTruthy()
    act(() => store.setState((p) => ({ n: p.n + 1 })))
    expect(screen.getByText('n=2')).toBeTruthy()
  })
})
