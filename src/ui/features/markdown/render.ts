// src/ui/features/markdown/render.ts
import { micromark } from 'micromark'

// micromark defaults are safe for single-user note content: raw HTML is
// omitted (allowDangerousHtml is off) and dangerous link protocols like
// javascript: are dropped (allowDangerousProtocol is off) — so we render
// without bundling a separate sanitizer. ESM-native, so no CJS interop.
export function renderMarkdown(src: string): string {
  if (!src) return ''
  return micromark(src)
}
