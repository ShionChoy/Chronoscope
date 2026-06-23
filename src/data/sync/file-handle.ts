import type { ChronoscopeDB } from '../dexie/db'

// queryPermission / requestPermission aren't in every TS DOM lib yet, so we
// describe just the slice we use. A real FileSystemFileHandle satisfies it.
export interface PermissionedHandle {
  queryPermission?(descriptor: { mode: 'readwrite' }): Promise<PermissionState>
  requestPermission?(descriptor: { mode: 'readwrite' }): Promise<PermissionState>
}

export type StoredHandle = FileSystemFileHandle

const HANDLE_KEY = 'autosave'

export async function ensureWritable(handle: PermissionedHandle): Promise<boolean> {
  const descriptor = { mode: 'readwrite' } as const
  if ((await handle.queryPermission?.(descriptor)) === 'granted') return true
  return (await handle.requestPermission?.(descriptor)) === 'granted'
}

interface SaveFilePickerWindow extends Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string
    types?: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<FileSystemFileHandle>
}

export function fileAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as SaveFilePickerWindow).showSaveFilePicker === 'function'
}

export async function pickSaveFile(suggestedName: string): Promise<StoredHandle> {
  const picker = (window as SaveFilePickerWindow).showSaveFilePicker
  if (!picker) throw new Error('File System Access API is unsupported')
  return picker({
    suggestedName,
    types: [{ description: 'Chronoscope snapshot', accept: { 'application/json': ['.json'] } }],
  })
}

// A FileSystemFileHandle is structured-cloneable, so IndexedDB can persist it.
export async function saveHandle(db: ChronoscopeDB, handle: StoredHandle): Promise<void> {
  await db.handles.put({ key: HANDLE_KEY, handle })
}

export async function loadHandle(db: ChronoscopeDB): Promise<StoredHandle | null> {
  const row = await db.handles.get(HANDLE_KEY)
  return row?.handle ?? null
}
