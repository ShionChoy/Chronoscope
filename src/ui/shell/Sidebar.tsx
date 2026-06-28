import { useState } from 'react'
import { useAppStore, useAppState, buildCategoryTree, categoryEventCounts, descendantCategoryIds } from '../../state'
import type { CategoryNode } from '../../state'
import type { Id } from '../../domain/model'

function CategoryTree({
  nodes,
  selectedId,
  counts,
  collapsed,
  onPick,
  onDelete,
  onToggle,
}: {
  nodes: CategoryNode[]
  selectedId: Id | null
  counts: Map<Id, number>
  collapsed: Set<Id>
  onPick: (id: Id) => void
  onDelete: (id: Id, name: string) => void
  onToggle: (id: Id) => void
}) {
  if (nodes.length === 0) return null
  return (
    <ul className="category-tree">
      {nodes.map((n) => {
        const id = n.category.id
        const hasChildren = n.children.length > 0
        const isCollapsed = collapsed.has(id)
        return (
          <li key={id}>
            <div className="row">
              {hasChildren ? (
                <button
                  type="button"
                  className="twisty"
                  aria-label={`${isCollapsed ? '展开' : '折叠'}「${n.category.name}」`}
                  aria-expanded={!isCollapsed}
                  onClick={() => onToggle(id)}
                >
                  {isCollapsed ? '▸' : '▾'}
                </button>
              ) : (
                <span className="twisty-spacer" />
              )}
              <button
                type="button"
                className={selectedId === id ? 'active' : ''}
                onClick={() => onPick(id)}
              >
                {n.category.name}
              </button>
              <span className="count">{counts.get(id) ?? 0}</span>
              <button
                type="button"
                className="del"
                aria-label={`删除分类「${n.category.name}」`}
                onClick={() => onDelete(id, n.category.name)}
              >
                ×
              </button>
            </div>
            {hasChildren && !isCollapsed && (
              <CategoryTree
                nodes={n.children}
                selectedId={selectedId}
                counts={counts}
                collapsed={collapsed}
                onPick={onPick}
                onDelete={onDelete}
                onToggle={onToggle}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function Sidebar({ open = false }: { open?: boolean }) {
  const app = useAppStore()
  const state = useAppState()
  const tree = buildCategoryTree(state.categories)
  const counts = categoryEventCounts(state)
  const liveEvents = state.events.filter((e) => !e.deleted)
  const totalCount = liveEvents.length
  const uncategorizedCount = liveEvents.filter((e) => e.categoryId == null).length
  const liveTags = state.tags.filter((t) => !t.deleted)

  const [collapsed, setCollapsed] = useState<Set<Id>>(new Set())
  const [newCat, setNewCat] = useState('')
  const [newTag, setNewTag] = useState('')

  const toggleCollapse = (id: Id) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const pickCategory = (id: Id) =>
    app.setFilter({ categoryId: state.filter.categoryId === id ? null : id, uncategorized: false })

  const toggleTag = (id: Id) => {
    const cur = state.filter.tagIds
    app.setFilter({ tagIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] })
  }

  const addCategory = async () => {
    const name = newCat.trim()
    if (!name) return
    await app.createCategory({ name })
    setNewCat('')
  }

  const deleteCategory = (id: Id, name: string) => {
    const ids = descendantCategoryIds(state.categories, id)
    const n = liveEvents.filter((e) => e.categoryId != null && ids.has(e.categoryId)).length
    const msg =
      n > 0
        ? `删除分类「${name}」会同时删除其下 ${n} 个事件（含子分类），此操作不可撤销。确定？`
        : `删除分类「${name}」？`
    if (!window.confirm(msg)) return
    app.deleteCategory(id)
    if (state.filter.categoryId != null && ids.has(state.filter.categoryId)) app.setFilter({ categoryId: null })
  }

  const addTag = async () => {
    const name = newTag.trim()
    if (!name) return
    await app.createTag({ name })
    setNewTag('')
  }

  const deleteTag = (id: Id, name: string) => {
    if (!window.confirm(`删除标签「${name}」？`)) return
    app.deleteTag(id)
    if (state.filter.tagIds.includes(id)) app.setFilter({ tagIds: state.filter.tagIds.filter((x) => x !== id) })
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
        <div className="row">
          <span className="twisty-spacer" />
          <button
            type="button"
            className={state.filter.categoryId == null && !state.filter.uncategorized ? 'active' : ''}
            onClick={() => app.setFilter({ categoryId: null, uncategorized: false })}
          >
            全部
          </button>
          <span className="count">{totalCount}</span>
        </div>
        <div className="row">
          <span className="twisty-spacer" />
          <button
            type="button"
            className={state.filter.uncategorized ? 'active' : ''}
            onClick={() => app.setFilter({ categoryId: null, uncategorized: true })}
          >
            未分类
          </button>
          <span className="count">{uncategorizedCount}</span>
        </div>
        <CategoryTree
          nodes={tree}
          selectedId={state.filter.categoryId}
          counts={counts}
          collapsed={collapsed}
          onPick={pickCategory}
          onDelete={deleteCategory}
          onToggle={toggleCollapse}
        />
        <div className="add-row">
          <input
            aria-label="新建分类"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addCategory()
            }}
            placeholder="新建分类"
          />
          <button type="button" onClick={addCategory}>
            添加
          </button>
        </div>
      </section>

      <section>
        <h2 className="display">标签</h2>
        <button
          type="button"
          onClick={() => app.setFilter({ tagMode: state.filter.tagMode === 'or' ? 'and' : 'or' })}
        >
          {state.filter.tagMode === 'or' ? 'OR' : 'AND'}
        </button>
        {liveTags.map((t) => (
          <div className="row" key={t.id}>
            <label>
              <input
                type="checkbox"
                checked={state.filter.tagIds.includes(t.id)}
                onChange={() => toggleTag(t.id)}
              />
              {t.name}
            </label>
            <button
              type="button"
              className="del"
              aria-label={`删除标签「${t.name}」`}
              onClick={() => deleteTag(t.id, t.name)}
            >
              ×
            </button>
          </div>
        ))}
        <div className="add-row">
          <input
            aria-label="新建标签"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTag()
            }}
            placeholder="新建标签"
          />
          <button type="button" onClick={addTag}>
            添加
          </button>
        </div>
      </section>
    </aside>
  )
}
