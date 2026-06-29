import { useEffect, useState } from 'react'
import {
  useAppStore,
  useAppState,
  buildCategoryTree,
  categoryEventCounts,
  descendantCategoryIds,
  flattenCategoryTree,
  assignableParents,
} from '../../state'
import type { CategoryNode } from '../../state'
import type { Category, Id } from '../../domain/model'
import { CATEGORY_PRESETS, nextPresetColor, loadCustomColors, persistCustomColors, addToPalette } from '../categoryColors'
import { ColorPicker } from './ColorPicker'

function CategoryTree({
  nodes,
  categories,
  selectedId,
  counts,
  collapsed,
  custom,
  colorOpenFor,
  onPick,
  onDelete,
  onToggle,
  onMove,
  onToggleColor,
  onPickColor,
  onAddCustom,
}: {
  nodes: CategoryNode[]
  categories: Category[]
  selectedId: Id | null
  counts: Map<Id, number>
  collapsed: Set<Id>
  custom: string[]
  colorOpenFor: Id | null
  onPick: (id: Id) => void
  onDelete: (id: Id, name: string) => void
  onToggle: (id: Id) => void
  onMove: (id: Id, parentId: Id | null) => void
  onToggleColor: (id: Id) => void
  onPickColor: (id: Id, hex: string) => void
  onAddCustom: (hex: string) => void
}) {
  if (nodes.length === 0) return null
  return (
    <ul className="category-tree">
      {nodes.map((n) => {
        const id = n.category.id
        const hasChildren = n.children.length > 0
        const isCollapsed = collapsed.has(id)
        const targets = assignableParents(categories, id)
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
                className="color-dot"
                style={{ background: n.category.color }}
                aria-label={`设置「${n.category.name}」颜色`}
                onClick={() => onToggleColor(id)}
              />
              <button type="button" className={selectedId === id ? 'active' : ''} onClick={() => onPick(id)}>
                {n.category.name}
              </button>
              <span className="count">{counts.get(id) ?? 0}</span>
              <select
                className="move"
                aria-label={`移动「${n.category.name}」`}
                value=""
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') return
                  onMove(id, v === '__root__' ? null : (v as Id))
                  e.target.value = ''
                }}
              >
                {/* placeholder: the collapsed-state label only — `disabled hidden`
                    keeps it out of the open list, which shows just real targets */}
                <option value="" disabled hidden>
                  移动
                </option>
                <option value="__root__">顶级</option>
                {targets.map((t) => (
                  <option key={t.category.id} value={t.category.id}>
                    {'　'.repeat(t.depth) + t.category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="del"
                aria-label={`删除分类「${n.category.name}」`}
                onClick={() => onDelete(id, n.category.name)}
              >
                ×
              </button>
            </div>
            {colorOpenFor === id && (
              <ColorPicker
                value={n.category.color}
                presets={CATEGORY_PRESETS}
                custom={custom}
                onPick={(hex) => onPickColor(id, hex)}
                onAddCustom={onAddCustom}
              />
            )}
            {hasChildren && !isCollapsed && (
              <CategoryTree
                nodes={n.children}
                categories={categories}
                selectedId={selectedId}
                counts={counts}
                collapsed={collapsed}
                custom={custom}
                colorOpenFor={colorOpenFor}
                onPick={onPick}
                onDelete={onDelete}
                onToggle={onToggle}
                onMove={onMove}
                onToggleColor={onToggleColor}
                onPickColor={onPickColor}
                onAddCustom={onAddCustom}
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
  const liveCategories = state.categories.filter((c) => !c.deleted)
  const liveTags = state.tags.filter((t) => !t.deleted)
  const parentOptions = flattenCategoryTree(state.categories)

  const [collapsed, setCollapsed] = useState<Set<Id>>(new Set())
  const [newCat, setNewCat] = useState('')
  const [newCatParent, setNewCatParent] = useState<Id | ''>('')
  const [newTag, setNewTag] = useState('')
  const [customColors, setCustomColors] = useState<string[]>(() => loadCustomColors(window.localStorage))
  const [colorOpenFor, setColorOpenFor] = useState<Id | null>(null)

  useEffect(() => {
    persistCustomColors(window.localStorage, customColors)
  }, [customColors])

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
    await app.createCategory({ name, parentId: newCatParent || null, color: nextPresetColor(liveCategories.length) })
    setNewCat('')
    setNewCatParent('')
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

  const moveCategory = (id: Id, parentId: Id | null) => void app.moveCategory(id, parentId)
  const toggleColor = (id: Id) => setColorOpenFor((cur) => (cur === id ? null : id))
  const pickColor = (id: Id, hex: string) => {
    void app.updateCategory(id, { color: hex })
    setColorOpenFor(null)
  }
  const addCustom = (hex: string) => setCustomColors((prev) => addToPalette(prev, hex))

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
          categories={state.categories}
          selectedId={state.filter.categoryId}
          counts={counts}
          collapsed={collapsed}
          custom={customColors}
          colorOpenFor={colorOpenFor}
          onPick={pickCategory}
          onDelete={deleteCategory}
          onToggle={toggleCollapse}
          onMove={moveCategory}
          onToggleColor={toggleColor}
          onPickColor={pickColor}
          onAddCustom={addCustom}
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
          <select aria-label="父分类" value={newCatParent} onChange={(e) => setNewCatParent(e.target.value as Id | '')}>
            <option value="">顶级</option>
            {parentOptions.map((t) => (
              <option key={t.category.id} value={t.category.id}>
                {'　'.repeat(t.depth) + t.category.name}
              </option>
            ))}
          </select>
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
