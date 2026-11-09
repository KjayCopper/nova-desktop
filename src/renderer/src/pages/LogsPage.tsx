import { Copy, FolderOpen, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LogEntry, LogLevel } from '../../../shared/types'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { Segmented } from '../components/Segmented'
import { Toggle } from '../components/Toggle'
import type { AppActions } from '../lib/actions'

const LEVEL_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warn' },
  { value: 'error', label: 'Error' }
] as const

type LevelFilter = (typeof LEVEL_OPTIONS)[number]['value']

export function LogsPage({ logs, actions }: { logs: LogEntry[]; actions: AppActions }) {
  const [level, setLevel] = useState<LevelFilter>('all')
  const [query, setQuery] = useState('')
  const [follow, setFollow] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return logs
      .filter((entry) => {
        if (level !== 'all' && entry.level !== (level as LogLevel)) return false
        if (!needle) return true
        return `${entry.scope} ${entry.message}`.toLowerCase().includes(needle)
      })
      .slice()
      .reverse()
  }, [logs, level, query])

  useEffect(() => {
    if (follow && listRef.current) listRef.current.scrollTop = 0
  }, [logs.length, follow])

  const copyVisible = (): void => {
    const text = filtered
      .slice()
      .reverse()
      .map((entry) => `${entry.time} ${entry.level.toUpperCase()} [${entry.scope}] ${entry.message}`)
      .join('\n')
    actions.copy(text || 'No log entries.')
  }

  return (
    <>
      <PageHeader
        title="Activity"
        subtitle="Live diagnostics streamed from the main process."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={copyVisible}>
              <Copy size={15} />
              Copy
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => actions.openPath('logs')}
            >
              <FolderOpen size={15} />
              Open folder
            </button>
          </>
        }
      />

      <Card>
        <div className="log-toolbar">
          <Segmented
            value={level}
            options={LEVEL_OPTIONS}
            label="Filter by level"
            onChange={setLevel}
          />
          <label className="search">
            <Search size={14} />
            <input
              type="search"
              value={query}
              placeholder="Filter scope or message…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Toggle
            checked={follow}
            onChange={setFollow}
            label="Follow"
            description="Keep newest entries in view"
          />
        </div>

        <div
          className="log-scroll"
          ref={listRef}
          onScroll={(event) => {
            const element = event.currentTarget
            if (follow && element.scrollTop > 8) setFollow(false)
          }}
        >
          {filtered.length === 0 ? (
            <div className="empty">No matching entries.</div>
          ) : (
            <div className="log-list">
              {filtered.map((entry) => (
                <div className="log-row" key={entry.id}>
                  <span className="log-time">{entry.time.slice(11, 23)}</span>
                  <span className={`log-level ${entry.level}`}>{entry.level}</span>
                  <span className="log-scope">{entry.scope}</span>
                  <span className="log-msg">{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-foot">
          <span>
            {filtered.length} of {logs.length} entries
          </span>
          <span>Stored in the application data folder</span>
        </div>
      </Card>
    </>
  )
}
