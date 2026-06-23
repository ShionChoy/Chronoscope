import { describe, it, expect, vi } from 'vitest'
import { writeSnapshot, readSnapshot, debounce, type FileHandleLike } from './file-store'
import type { ExportFile } from './transfer'

const SAMPLE: ExportFile = { version: 1, exportedAt: '2026-06-24T00:00:00.000Z', events: [], categories: [], tags: [] }

function fakeHandle(initialText = '') {
  const writes: string[] = []
  let closed = false
  let content = initialText
  const handle: FileHandleLike = {
    async createWritable() {
      return {
        async write(data: string) {
          writes.push(data)
          content = data
        },
        async close() {
          closed = true
        },
      }
    },
    async getFile() {
      return { text: async () => content }
    },
  }
  return { handle, writes, isClosed: () => closed }
}

describe('file-store', () => {
  it('writeSnapshot serializes the file and closes the stream', async () => {
    const h = fakeHandle()
    await writeSnapshot(h.handle, SAMPLE)
    expect(h.writes).toHaveLength(1)
    expect(JSON.parse(h.writes[0])).toEqual(SAMPLE)
    expect(h.isClosed()).toBe(true)
  })

  it('readSnapshot parses the file contents back into an ExportFile', async () => {
    const h = fakeHandle(JSON.stringify(SAMPLE))
    expect(await readSnapshot(h.handle)).toEqual(SAMPLE)
  })

  it('debounce calls the function once, with the latest args, after the delay', () => {
    vi.useFakeTimers()
    const spy = vi.fn()
    const d = debounce(spy, 500)
    d(1)
    d(2)
    expect(spy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(500)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(2)
    vi.useRealTimers()
  })
})
