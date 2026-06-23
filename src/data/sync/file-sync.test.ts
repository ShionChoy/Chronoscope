import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createFileSync, type BoundHandle, type FileSyncDeps } from './file-sync'
import type { ExportFile } from './transfer'

const SNAP: ExportFile = { version: 1, exportedAt: 'x', events: [], categories: [], tags: [] }

function fakeHandle() {
  const writes: string[] = []
  const handle: BoundHandle = {
    async createWritable() {
      return { async write(d: string) { writes.push(d) }, async close() {} }
    },
    async getFile() {
      return { text: async () => JSON.stringify(SNAP) }
    },
    async queryPermission() { return 'granted' },
    async requestPermission() { return 'granted' },
  }
  return { handle, writes }
}

function makeDeps(over: Partial<FileSyncDeps> = {}) {
  const listeners = new Set<() => void>()
  const fh = fakeHandle()
  const applied: ExportFile[] = []
  const deps: FileSyncDeps = {
    supported: true,
    pickFile: vi.fn(async () => fh.handle),
    loadHandle: vi.fn(async () => null),
    saveHandle: vi.fn(async () => {}),
    ensureWritable: vi.fn(async () => true),
    getSnapshot: vi.fn(async () => SNAP),
    applySnapshot: vi.fn(async (f: ExportFile) => { applied.push(f) }),
    subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l) },
    debounceMs: 100,
    ...over,
  }
  const fire = () => listeners.forEach((l) => l())
  return { deps, fire, writes: fh.writes, applied }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('createFileSync', () => {
  it('reports the supported flag', () => {
    expect(createFileSync(makeDeps({ supported: false }).deps).supported).toBe(false)
  })

  it('bind persists the handle, writes once, and becomes bound', async () => {
    const ctx = makeDeps()
    const fs = createFileSync(ctx.deps)
    await fs.bind()
    expect(ctx.deps.saveHandle).toHaveBeenCalledOnce()
    expect(ctx.writes).toHaveLength(1) // initial write
    expect(fs.isBound()).toBe(true)
  })

  it('does not bind when permission is denied', async () => {
    const ctx = makeDeps({ ensureWritable: vi.fn(async () => false) })
    const fs = createFileSync(ctx.deps)
    await fs.bind()
    expect(fs.isBound()).toBe(false)
    expect(ctx.writes).toHaveLength(0)
  })

  it('debounce-writes when the store changes after binding', async () => {
    const ctx = makeDeps()
    const fs = createFileSync(ctx.deps)
    await fs.bind() // write #1
    ctx.fire()
    ctx.fire() // coalesced
    await vi.advanceTimersByTimeAsync(100)
    expect(ctx.writes).toHaveLength(2) // one more, coalesced
  })

  it('reload reads the file and applies the snapshot', async () => {
    const ctx = makeDeps()
    const fs = createFileSync(ctx.deps)
    await fs.bind()
    await fs.reload()
    expect(ctx.applied).toEqual([SNAP])
  })

  it('reconnect rebinds a persisted handle and starts watching', async () => {
    const fh = fakeHandle()
    const ctx = makeDeps({ loadHandle: vi.fn(async () => fh.handle) })
    const fs = createFileSync(ctx.deps)
    expect(await fs.reconnect()).toBe(true)
    expect(fs.isBound()).toBe(true)
  })

  it('reconnect returns false when no handle is persisted', async () => {
    const ctx = makeDeps()
    const fs = createFileSync(ctx.deps)
    expect(await fs.reconnect()).toBe(false)
    expect(fs.isBound()).toBe(false)
  })
})
