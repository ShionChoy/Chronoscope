import type { ExportFile } from '../../data'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function exportFilename(now: Date): string {
  return `chronoscope-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}

export function serializeSnapshot(file: ExportFile): string {
  return JSON.stringify(file, null, 2)
}

export function parseSnapshot(text: string): ExportFile {
  const data = JSON.parse(text) as unknown
  const ok =
    typeof data === 'object' &&
    data !== null &&
    'version' in data &&
    Array.isArray((data as ExportFile).events) &&
    Array.isArray((data as ExportFile).categories) &&
    Array.isArray((data as ExportFile).tags)
  if (!ok) throw new Error('无效的导入文件')
  return data as ExportFile
}
