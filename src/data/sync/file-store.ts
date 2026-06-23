import type { ExportFile } from './transfer'

export interface WritableFileLike {
  write(data: string): Promise<void>
  close(): Promise<void>
}

// The narrow slice of FileSystemFileHandle we depend on — kept minimal so it
// is trivially fakeable in tests and free of browser-only types.
export interface FileHandleLike {
  createWritable(): Promise<WritableFileLike>
  getFile(): Promise<{ text(): Promise<string> }>
}

const defaultSerialize = (file: ExportFile): string => JSON.stringify(file, null, 2)
const defaultParse = (text: string): ExportFile => JSON.parse(text) as ExportFile

export async function writeSnapshot(
  handle: FileHandleLike,
  file: ExportFile,
  serialize: (f: ExportFile) => string = defaultSerialize,
): Promise<void> {
  const writable = await handle.createWritable()
  await writable.write(serialize(file))
  await writable.close()
}

export async function readSnapshot(
  handle: FileHandleLike,
  parse: (text: string) => ExportFile = defaultParse,
): Promise<ExportFile> {
  const file = await handle.getFile()
  return parse(await file.text())
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, ms)
  }
}
