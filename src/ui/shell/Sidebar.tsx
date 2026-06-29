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
import { MoveMenu } from './MoveMenu'

function CategoryTree({
  nodes,
  categories,
  selectedId,
  counts,
  collapsed,
  custom,
  colorOpenFor,
  menuOpenFor,
  onPick,
  onDelete,
  onToggle,
  onMove,
  onToggleColor,
  onToggleMenu,
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
  menuOpenFor: Id | null
  onPick: (id: Id) => void
  onDelete: (id: Id, name: string) => void
  onToggle: (id: Id) => void
  onMove: (id: Id, parentId: Id | null) => void
  onToggleColor: (id: Id) => void
  onToggleMenu: (id: Id) => void
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
              <button type="button" className={selectedId === id ? 'name active' : 'name'} onClick={() => onPick(id)}>
                {n.category.name}
              </button>
              <span className="count">{counts.get(id) ?? 0}</span>
              <button
                type="button"
                className="menu"
                aria-label={`移动「${n.category.name}」`}
                aria-haspopup="true"
                aria-expanded={menuOpenFor === id}
                onClick={() => onToggleMenu(id)}
              >
                ⋯
              </button>
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
            {menuOpenFor === id && <MoveMenu targets={targets} onMove={(parentId) => onMove(id, parentId)} />}
            {hasChildren && !isCollapsed && (
              <CategoryTree
                nodes={n.children}
                categories={categories}
                selectedId={selectedId}
                counts={counts}
                collapsed={collapsed}
                custom={custom}
                colorOpenFor={colorOpenFor}
                menuOpenFor={menuOpenFor}
                onPick={onPick}
                onDelete={onDelete}
                onToggle={onToggle}
                onMove={onMove}
                onToggleColor={onToggleColor}
                onToggleMenu={onToggleMenu}
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
  const uncategorizedCount = liveEvents.filter((e) => e.categoryId == null).length
  const liveCategories = state.categories.filter((c) => !c.deleted)
  const liveTags = state.tags.filter((t) => !t.deleted)
  const parentOptions = flattenCategoryTree(state.categories)

  const [collapsed, setCollapsed] = useState<Set<Id>>(new Set())
  const [addOpen, setAddOpen] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [newCatParent, setNewCatParent] = useState<Id | ''>('')
  const [newCatColor, setNewCatColor] = useState<string>(CATEGORY_PRESETS[0])
  const [addColorOpen, setAddColorOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [customColors, setCustomColors] = useState<string[]>(() => loadCustomColors(window.localStorage))
  const [colorOpenFor, setColorOpenFor] = useState<Id | null>(null)
  const [menuOpenFor, setMenuOpenFor] = useState<Id | null>(null)

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

  const openAdd = () => {
    setNewCat('')
    setNewCatParent('')
    setNewCatColor(nextPresetColor(liveCategories.length))
    setAddColorOpen(false)
    setAddOpen(true)
  }
  const closeAdd = () => {
    setAddOpen(false)
    setAddColorOpen(false)
    setNewCat('')
    setNewCatParent('')
  }
  const confirmAdd = async () => {
    const name = newCat.trim()
    if (!name) return
    await app.createCategory({ name, parentId: newCatParent || null, color: newCatColor })
    closeAdd()
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

  const moveTo = (id: Id, parentId: Id | null) => {
    void app.moveCategory(id, parentId)
    setMenuOpenFor(null)
  }
  const toggleColor = (id: Id) => {
    setMenuOpenFor(null)
    setColorOpenFor((cur) => (cur === id ? null : id))
  }
  const toggleMenu = (id: Id) => {
    setColorOpenFor(null)
    setMenuOpenFor((cur) => (cur === id ? null : id))
  }
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
        <div className="section-head">
          <h2 className="display">文件夹</h2>
          <button
            type="button"
            className="add-folder-btn"
            aria-label="添加文件夹"
            aria-expanded={addOpen}
            onClick={() => (addOpen ? closeAdd() : openAdd())}
          >
            ＋
          </button>
        </div>

        {addOpen && (
          <div className="add-folder">
            <div className="row">
              <input
                aria-label="文件夹名称"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmAdd()
                }}
                placeholder="文件夹名称"
              />
              <select aria-label="父文件夹" value={newCatParent} onChange={(e) => setNewCatParent(e.target.value as Id | '')}>
                <option value="">顶级</option>
                {parentOptions.map((t) => (
                  <option key={t.category.id} value={t.category.id}>
                    {'　'.repeat(t.depth) + t.category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="color-dot"
                style={{ background: newCatColor }}
                aria-label="文件夹颜色"
                onClick={() => setAddColorOpen((o) => !o)}
              />
              <button type="button" className="confirm" aria-label="确认添加" onClick={confirmAdd}>
                ✓
              </button>
              <button type="button" className="del" aria-label="取消添加" onClick={closeAdd}>
                ×
              </button>
            </div>
            {addColorOpen && (
              <ColorPicker
                value={newCatColor}
                presets={CATEGORY_PRESETS}
                custom={customColors}
                onPick={(hex) => {
                  setNewCatColor(hex)
                  setAddColorOpen(false)
                }}
                onAddCustom={addCustom}
              />
            )}
          </div>
        )}

        <ul className="category-tree">
          <li>
            <div className="row">
              <span className="twisty-spacer" />
              <span className="color-dot-spacer" />
              <button
                type="button"
                className={state.filter.uncategorized ? 'name active' : 'name'}
                onClick={() => app.setFilter({ categoryId: null, uncategorized: !state.filter.uncategorized })}
              >
                未分类
              </button>
              <span className="count">{uncategorizedCount}</span>
            </div>
          </li>
        </ul>

        <CategoryTree
          nodes={tree}
          categories={state.categories}
          selectedId={state.filter.categoryId}
          counts={counts}
          collapsed={collapsed}
          custom={customColors}
          colorOpenFor={colorOpenFor}
          menuOpenFor={menuOpenFor}
          onPick={pickCategory}
          onDelete={deleteCategory}
          onToggle={toggleCollapse}
          onMove={moveTo}
          onToggleColor={toggleColor}
          onToggleMenu={toggleMenu}
          onPickColor={pickColor}
          onAddCustom={addCustom}
        />
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
