export function packRows<T extends { left: number; right: number }>(items: T[]): (T & { row: number })[] {
  const rowEnds: number[] = []
  const sorted = [...items].sort((a, b) => a.left - b.left)
  return sorted.map((item) => {
    let row = rowEnds.findIndex((end) => end <= item.left)
    if (row === -1) {
      row = rowEnds.length
      rowEnds.push(item.right)
    } else {
      rowEnds[row] = item.right
    }
    return { ...item, row }
  })
}
