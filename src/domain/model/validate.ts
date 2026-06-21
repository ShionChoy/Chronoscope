import { compareTimePoints, type TimePoint } from '../time'

export function validateEvent(e: {
  title: string
  start?: TimePoint
  end?: TimePoint
}): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (!e.title || e.title.trim() === '') errors.push('标题不能为空')
  if (!e.start && !e.end) errors.push('至少需要起点或终点')
  if (e.start && e.end && compareTimePoints(e.end, e.start) < 0) {
    errors.push('终点不能早于起点')
  }
  return { ok: errors.length === 0, errors }
}
