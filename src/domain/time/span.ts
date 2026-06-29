import { type TimePoint, instantOf } from './timepoint'

// The explicit uncertainty interval around a point: how far earlier/later the
// instant could be, per the point's own `fuzz`. No fuzz → zero width.
export function fuzzRangeOf(tp: TimePoint): { earliest: number; latest: number } {
  const at = instantOf(tp)
  return { earliest: at - (tp.fuzz?.before ?? 0), latest: at + (tp.fuzz?.after ?? 0) }
}
