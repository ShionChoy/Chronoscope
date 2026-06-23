import { useState } from 'react'
import { TimeInput } from './TimeInput'
import { useAppStore, useAppState } from '../../state'
import { validateEvent } from '../../domain/model'
import type { TimePoint } from '../../domain/time'
import type { Id } from '../../domain/model'

export interface EventEditorProps {
  editingId: Id | null
  onClose: () => void
}

export function EventEditor({ editingId, onClose }: EventEditorProps) {
  const app = useAppStore()
  const state = useAppState()
  const existing = editingId ? state.events.find((e) => e.id === editingId) ?? null : null

  const [title, setTitle] = useState(existing?.title ?? '')
  const [start, setStart] = useState<TimePoint | null>(existing?.start ?? null)
  const [end, setEnd] = useState<TimePoint | null>(existing?.end ?? null)
  const [note, setNote] = useState(existing?.note ?? '')
  const [categoryId, setCategoryId] = useState<Id | ''>(existing?.categoryId ?? '')
  const [tagIds, setTagIds] = useState<Id[]>(existing?.tagIds ?? [])
  const [links, setLinks] = useState<Id[]>(existing?.links ?? [])
  const [errors, setErrors] = useState<string[]>([])

  const liveCategories = state.categories.filter((c) => !c.deleted)
  const liveTags = state.tags.filter((t) => !t.deleted)

  const toggleTag = (id: Id) =>
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const linkCandidates = state.events.filter((e) => !e.deleted && e.id !== editingId)
  const toggleLink = (id: Id) =>
    setLinks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const save = async () => {
    const result = validateEvent({ title, start: start ?? undefined, end: end ?? undefined })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    const fields = {
      title,
      start: start ?? undefined,
      end: end ?? undefined,
      note,
      categoryId: categoryId === '' ? null : categoryId,
      tagIds,
      links,
    }
    if (editingId) await app.updateEvent(editingId, fields)
    else await app.createEvent(fields)
    onClose()
  }

  const remove = async () => {
    if (editingId) await app.deleteEvent(editingId)
    onClose()
  }

  return (
    <div className="event-editor" role="dialog" aria-label={editingId ? '编辑事件' : '新建事件'}>
      {errors.length > 0 && (
        <ul className="errors">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <label>
        标题
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <TimeInput label="起点" value={start} nowYear={state.nowYear} onChange={setStart} />
      <TimeInput label="终点" value={end} nowYear={state.nowYear} onChange={setEnd} />

      <label>
        备注
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
      </label>

      <label>
        分类
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value as Id | '')}>
          <option value="">未分类</option>
          {liveCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend>标签</legend>
        {liveTags.map((t) => (
          <label key={t.id}>
            <input type="checkbox" checked={tagIds.includes(t.id)} onChange={() => toggleTag(t.id)} />
            {t.name}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>关联</legend>
        {linkCandidates.length === 0 && <p className="muted">暂无可关联的事件</p>}
        {linkCandidates.map((e) => (
          <label key={e.id}>
            <input type="checkbox" checked={links.includes(e.id)} onChange={() => toggleLink(e.id)} />
            {e.title}
          </label>
        ))}
      </fieldset>

      <div className="actions">
        <button type="button" onClick={save}>
          保存
        </button>
        <button type="button" onClick={onClose}>
          取消
        </button>
        {editingId && (
          <button type="button" className="danger" onClick={remove}>
            删除
          </button>
        )}
      </div>
    </div>
  )
}
