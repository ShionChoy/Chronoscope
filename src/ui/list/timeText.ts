import { formatTimePoint, type TimePoint } from '../../domain/time'

// The list's time column shows the full span: both ends → "start → end"; a lone
// end → an open interval "→ end"; a lone start → just the start; neither → "—".
export function formatTimeRange(
  start: TimePoint | undefined,
  end: TimePoint | undefined,
  nowYear: number,
): string {
  const s = start ? formatTimePoint(start, nowYear) : ''
  const e = end ? formatTimePoint(end, nowYear) : ''
  if (s && e) return `${s} → ${e}`
  if (s) return s
  if (e) return `→ ${e}`
  return '—'
}

// The 更新 column stores a raw HLC string ("<epoch-ms>-<counter>-<nodeId>"),
// which is far too wide to show verbatim. Its leading field is the physical
// timestamp (ms since epoch) — render that as a compact local "Y-M-D H:m".
// Non-HLC stamps (e.g. test seeds like "t0001") fall back to a dash.
export function formatUpdatedAt(updatedAt: string): string {
  const ms = Number(updatedAt.split('-')[0])
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
