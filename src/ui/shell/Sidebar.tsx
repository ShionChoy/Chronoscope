import { useAppStore, useAppState, buildCategoryTree } from '../../state'
import type { CategoryNode } from '../../state'
import type { Id } from '../../domain/model'

function CategoryTree({
  nodes,
  selectedId,
  onPick,
}: {
  nodes: CategoryNode[]
  selectedId: Id | null
  onPick: (id: Id) => void
}) {
  if (nodes.length === 0) return null
  return (
    <ul className="category-tree">
      {nodes.map((n) => (
        <li key={n.category.id}>
          <button
            type="button"
            className={selectedId === n.category.id ? 'active' : ''}
            onClick={() => onPick(n.category.id)}
          >
            {n.category.name}
          </button>
          <CategoryTree nodes={n.children} selectedId={selectedId} onPick={onPick} />
        </li>
      ))}
    </ul>
  )
}

export function Sidebar({ open = false }: { open?: boolean }) {
  const app = useAppStore()
  const state = useAppState()
  const tree = buildCategoryTree(state.categories)
  const liveTags = state.tags.filter((t) => !t.deleted)

  const pickCategory = (id: Id) =>
    app.setFilter({ categoryId: state.filter.categoryId === id ? null : id })

  const toggleTag = (id: Id) => {
    const cur = state.filter.tagIds
    app.setFilter({ tagIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] })
  }

  return (
    <aside id="sidebar" className={open ? 'sidebar open' : 'sidebar'}>
      <section>
        <label>
          搜索
          <input
            value={state.filter.query}
            onChange={(e) => app.setFilter({ query: e.target.value })}
            placeholder="标题或备注"
          />
        </label>
      </section>

      <section>
        <h2 className="display">分类</h2>
        <button type="button" onClick={() => app.setFilter({ categoryId: null })}>
          全部
        </button>
        <CategoryTree nodes={tree} selectedId={state.filter.categoryId} onPick={pickCategory} />
      </section>

      <section>
        <h2 className="display">标签</h2>
        <button type="button" onClick={() => app.setFilter({ tagMode: state.filter.tagMode === 'or' ? 'and' : 'or' })}>
          {state.filter.tagMode === 'or' ? 'OR' : 'AND'}
        </button>
        {liveTags.map((t) => (
          <label key={t.id}>
            <input
              type="checkbox"
              checked={state.filter.tagIds.includes(t.id)}
              onChange={() => toggleTag(t.id)}
            />
            {t.name}
          </label>
        ))}
      </section>
    </aside>
  )
}
