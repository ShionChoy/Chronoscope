import { useAppStore, useAppState, visibleEvents } from '../../state'
import type { Sort } from '../../state'
import { formatTimeRange, formatUpdatedAt } from './timeText'
import type { Id } from '../../domain/model'

export interface ListViewProps {
  onEdit: (id: Id) => void
}

const COLUMNS: { key: Sort['key']; label: string }[] = [
  { key: 'start', label: '时间' },
  { key: 'title', label: '标题' },
  { key: 'category', label: '分类' },
  { key: 'updated', label: '更新' },
]

export function ListView({ onEdit }: ListViewProps) {
  const app = useAppStore()
  const state = useAppState()
  const rows = visibleEvents(state)
  const catName = (id: Id | null) => state.categories.find((c) => c.id === id)?.name ?? '—'
  const tagNames = (ids: Id[]) =>
    ids.map((id) => state.tags.find((t) => t.id === id)?.name).filter(Boolean).join(' ')

  const clickHeader = (key: Sort['key']) => {
    const cur = state.sort
    app.setSort(cur.key === key ? { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  return (
    <table className="list-view">
      <thead>
        <tr>
          {COLUMNS.map((c) => (
            <th key={c.key} className={c.key === 'updated' ? 'col-updated' : undefined}>
              <button type="button" onClick={() => clickHeader(c.key)}>
                {c.label}
                {state.sort.key === c.key && (
                  <span aria-hidden>{state.sort.dir === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </button>
            </th>
          ))}
          <th>标签</th>
          <th className="col-note">备注</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={6} className="empty">
              暂无事件
            </td>
          </tr>
        )}
        {rows.map((e) => (
          <tr
            key={e.id}
            onClick={() => {
              app.select(e.id)
              onEdit(e.id)
            }}
          >
            <td className="mono">{formatTimeRange(e.start, e.end, state.nowYear)}</td>
            <td>{e.title}</td>
            <td>{catName(e.categoryId)}</td>
            <td className="mono col-updated">{formatUpdatedAt(e.updatedAt)}</td>
            <td>{tagNames(e.tagIds) || '—'}</td>
            <td className="col-note">{e.note.slice(0, 60)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
