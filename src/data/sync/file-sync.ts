import { writeSnapshot, readSnapshot, type FileHandleLike } from './file-store'
import type { PermissionedHandle } from './file-handle'
import type { ExportFile } from './transfer'

export type BoundHandle = FileHandleLike & PermissionedHandle

export interface FileSyncDeps {
  supported: boolean
  pickFile(): Promise<BoundHandle>
  loadHandle(): Promise<BoundHandle | null>
  saveHandle(handle: BoundHandle): Promise<void>
  ensureWritable(handle: PermissionedHandle): Promise<boolean>
  getSnapshot(): Promise<ExportFile>
  applySnapshot(file: ExportFile): Promise<void>
  subscribe(listener: () => void): () => void
  debounceMs?: number
}

export interface FileSync {
  readonly supported: boolean
  isBound(): boolean
  subscribe(cb: () => void): () => void
  bind(): Promise<void>
  reload(): Promise<void>
  reconnect(): Promise<boolean>
}

export function createFileSync(deps: FileSyncDeps): FileSync {
  const debounceMs = deps.debounceMs ?? 800
  let handle: BoundHandle | null = null
  let watching = false
  let timer: ReturnType<typeof setTimeout> | null = null
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((l) => l())

  async function flush(): Promise<void> {
    if (!handle) return
    await writeSnapshot(handle, await deps.getSnapshot())
  }

  function scheduleWrite(): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      void flush()
    }, debounceMs)
  }

  function startWatching(): void {
    if (watching) return
    watching = true
    deps.subscribe(() => scheduleWrite())
  }

  return {
    supported: deps.supported,
    isBound: () => handle !== null,
    subscribe(cb) {
      listeners.add(cb)
      return () => {
        listeners.delete(cb)
      }
    },
    async bind() {
      const picked = await deps.pickFile()
      if (!(await deps.ensureWritable(picked))) return
      handle = picked
      await deps.saveHandle(picked)
      await flush() // mirror current state into the freshly bound file
      startWatching()
      notify()
    },
    async reload() {
      if (!handle) return
      await deps.applySnapshot(await readSnapshot(handle))
    },
    async reconnect() {
      const loaded = await deps.loadHandle()
      if (!loaded) return false
      if (!(await deps.ensureWritable(loaded))) return false
      handle = loaded
      startWatching()
      notify()
      return true
    },
  }
}
