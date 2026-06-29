import type { Category, Id } from '../../domain/model'

export interface MoveMenuProps {
  targets: { category: Category; depth: number }[]
  onMove: (parentId: Id | null) => void
  topLabel?: string
}

export function MoveMenu({ targets, onMove, topLabel = '顶级' }: MoveMenuProps) {
  return (
    <div className="move-menu" role="menu">
      <button type="button" role="menuitem" onClick={() => onMove(null)}>
        {topLabel}
      </button>
      {targets.map((t) => (
        <button key={t.category.id} type="button" role="menuitem" onClick={() => onMove(t.category.id)}>
          {'　'.repeat(t.depth) + `「${t.category.name}」`}
        </button>
      ))}
    </div>
  )
}
