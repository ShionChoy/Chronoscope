import { type TimePoint, instantOf } from './timepoint'

// The explicit uncertainty interval around a point: how far earlier/later the
// instant could be, per the point's own `fuzz`. No fuzz → zero width.
export function fuzzRangeOf(tp: TimePoint): { earliest: number; latest: number } {
  const at = instantOf(tp)
  const before = Math.max(0, tp.fuzz?.before ?? 0)
  const after = Math.max(0, tp.fuzz?.after ?? 0)
  return { earliest: at - before, latest: at + after }
}
