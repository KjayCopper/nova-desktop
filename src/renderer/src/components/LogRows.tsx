import type { LogEntry } from '../../../shared/types'
import { formatTime } from '../lib/format'

export function LogRows({
  entries,
  compact = false,
  emptyLabel = 'Nothing here yet.'
}: {
  entries: LogEntry[]
  compact?: boolean
  emptyLabel?: string
}): React.JSX.Element {
  if (entries.length === 0) {
    return <div className="empty">{emptyLabel}</div>
  }

  return (
    <div className={`log-list ${compact ? 'compact' : ''}`}>
      {entries.map((entry) => (
        <div className="log-row" key={entry.id}>
          <span className="log-time">{formatTime(entry.time)}</span>
          <span className={`log-level ${entry.level}`}>{entry.level}</span>
          <span className="log-scope">{entry.scope}</span>
          <span className="log-msg">{entry.message}</span>
        </div>
      ))}
    </div>
  )
}
