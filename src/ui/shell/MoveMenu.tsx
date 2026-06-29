import type { Category, Id } from '../../domain/model'

export interface MoveMenuProps {
  targets: { category: Category; depth: number }[]
  onMove: (parentId: Id | null) => void
}

export function MoveMenu({ targets, onMove }: MoveMenuProps) {
  return (
    <div className="move-menu" role="menu">
      <button type="button" role="menuitem" onClick={() => onMove(null)}>
        顶级
      </button>
      {targets.map((t) => (
        <button key={t.category.id} type="button" role="menuitem" onClick={() => onMove(t.category.id)}>
          {'　'.repeat(t.depth) + `「${t.category.name}」`}
        </button>
      ))}
    </div>
  )
}
