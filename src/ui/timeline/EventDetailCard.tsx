// src/ui/timeline/EventDetailCard.tsx
import { Markdown } from '../features/markdown/Markdown'
import type { EventCardData } from './card'
import type { Id } from '../../domain/model'

export interface EventDetailCardProps {
  data: EventCardData
  onEdit: () => void
  onClose: () => void
  onSelectLink: (id: Id) => void
}

export function EventDetailCard({ data, onEdit, onClose, onSelectLink }: EventDetailCardProps) {
  return (
    <div className="event-card" role="dialog" aria-label="事件详情">
      <header>
        <h3 className="display">{data.title}</h3>
        <button type="button" aria-label="关闭" onClick={onClose}>
          ✕
        </button>
      </header>
      <p className="mono time">{data.timeLabel}</p>
      {data.categoryName && <p className="category">{data.categoryName}</p>}
      {data.tagNames.length > 0 && (
        <ul className="tags">
          {data.tagNames.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      {data.note && <Markdown source={data.note} />}
      {data.links.length > 0 && (
        <ul className="links">
          {data.links.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onSelectLink(l.id)}>
                {l.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="actions">
        <button type="button" onClick={onEdit}>
          编辑
        </button>
      </div>
    </div>
  )
}
