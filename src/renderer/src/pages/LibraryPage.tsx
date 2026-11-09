import {
  ArrowRight,
  Filter,
  ListPlus,
  Pause,
  Play,
  Plus,
  Search,
  X
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { PlayoutController } from '../hooks/usePlayout'
import type { AppActions } from '../lib/actions'
import { formatDuration } from '../lib/format'
import { TRACKS, TYPE_LABEL, type Track } from '../lib/playout-data'

type SortKey = 'title' | 'artist' | 'bpm' | 'year' | 'duration'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'title', label: 'Title A–Z' },
  { value: 'artist', label: 'Artist A–Z' },
  { value: 'bpm', label: 'BPM' },
  { value: 'year', label: 'Year' },
  { value: 'duration', label: 'Duration' }
]

export function LibraryPage({
  playout,
  actions
}: {
  playout: PlayoutController
  actions: AppActions
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<SortKey>('title')

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(TRACKS.map((track) => track.category)))],
    []
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return TRACKS.filter((track) => {
      if (category !== 'All' && track.category !== category) return false
      if (!needle) return true
      return `${track.title} ${track.artist} ${track.album ?? ''} ${track.category} ${track.type}`
        .toLowerCase()
        .includes(needle)
    }).sort((a, b) => {
      if (sort === 'bpm') return (a.bpm ?? 0) - (b.bpm ?? 0)
      if (sort === 'year') return (b.year ?? 0) - (a.year ?? 0)
      if (sort === 'duration') return a.duration - b.duration
      if (sort === 'artist') return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title)
      return a.title.localeCompare(b.title)
    })
  }, [query, category, sort])

  const add = (track: Track): void => {
    playout.addTrack(track)
    actions.notify('Added to the log', `${track.title} is queued at the end of the playlist.`, 'success')
  }

  const cue = (track: Track): void => {
    playout.cueTrack(track)
    actions.notify('Cued in Player D', `${track.title} is ready to preview on the console.`, 'info')
  }

  const addVisible = (): void => {
    filtered.forEach((track) => playout.addTrack(track))
    actions.notify(
      `${filtered.length} item${filtered.length === 1 ? '' : 's'} added`,
      'The selection was appended to the end of the current log.',
      'success'
    )
  }

  const preview = playout.preview

  return (
    <div className="library-page">
      <header className="library-head">
        <div className="library-title">
          <h1>Library</h1>
          <span className="library-count">
            {filtered.length} of {TRACKS.length} items
          </span>
        </div>

        <label className="log-filter library-search">
          <Search size={14} />
          <input
            type="search"
            value={query}
            placeholder="Search title, artist or album…"
            aria-label="Search the library"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="sort-field">
          <Filter size={13} />
          <select
            className="select"
            aria-label="Sort the library"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="tool-btn"
          onClick={addVisible}
          disabled={filtered.length === 0}
        >
          <ListPlus size={14} />
          Add visible
        </button>
      </header>

      <div className="category-strip">
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            className="category-chip"
            data-active={category === name}
            onClick={() => setCategory(name)}
          >
            {name}
            <span>
              {name === 'All'
                ? TRACKS.length
                : TRACKS.filter((track) => track.category === name).length}
            </span>
          </button>
        ))}
      </div>

      <div className="library-table">
        <div className="library-header-row">
          <span>#</span>
          <span>Type</span>
          <span>Title / Album</span>
          <span>Artist</span>
          <span>Category</span>
          <span>BPM</span>
          <span>Year</span>
          <span>Last played</span>
          <span>Dur</span>
          <span />
        </div>

        <div className="library-scroll">
          {filtered.length === 0 ? (
            <div className="log-empty">Nothing in the library matches that search.</div>
          ) : (
            filtered.map((track, index) => {
              const isCued = preview?.item.id === track.id
              return (
                <div
                  key={track.id}
                  className="library-row"
                  data-cued={isCued}
                  onDoubleClick={() => add(track)}
                  title="Double-click to add to the log"
                >
                  <span className="lib-index mono">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className={`type-badge type-${track.type}`}>
                      <span className="type-dot" />
                      {TYPE_LABEL[track.type]}
                    </span>
                  </span>
                  <span className="lib-title-cell">
                    <span className="lib-title" title={track.title}>
                      {track.title}
                    </span>
                    <span className="lib-album">{track.album ?? '—'}</span>
                  </span>
                  <span className="lib-artist" title={track.artist}>
                    {track.artist}
                  </span>
                  <span className="lib-cat">{track.category}</span>
                  <span className="lib-bpm mono">{track.bpm ?? '—'}</span>
                  <span className="lib-year mono">{track.year ?? '—'}</span>
                  <span className="lib-last">{track.lastPlayed ?? 'Never'}</span>
                  <span className="lib-duration mono">{formatDuration(track.duration)}</span>
                  <span className="lib-actions">
                    <button
                      type="button"
                      className="lib-btn"
                      title="Cue in Player D"
                      aria-label={`Cue ${track.title} in Player D`}
                      onClick={() => cue(track)}
                    >
                      <Play size={12} />
                    </button>
                    <button
                      type="button"
                      className="lib-btn lib-btn-add"
                      title="Add to log"
                      aria-label={`Add ${track.title} to the log`}
                      onClick={() => add(track)}
                    >
                      <Plus size={13} />
                    </button>
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      <footer className="library-foot">
        <span>
          <strong className="mono">{TRACKS.length}</strong> items in the library
        </span>
        <span>
          <strong className="mono">
            {TRACKS.filter((track) => track.category === 'Music').length}
          </strong>{' '}
          music · <strong className="mono">{categories.length - 1}</strong> categories
        </span>
        <span className="library-foot-right">
          Double-click a row to append it to the log
        </span>
      </footer>

      {preview ? (
        <div className="library-preview">
          <span className="preview-flag">Player D</span>
          <div className="preview-copy">
            <span className="preview-title">{preview.item.title}</span>
            <span className="preview-artist">
              {preview.item.artist}
              {preview.startedAt ? ' · playing' : ' · cued'}
            </span>
          </div>
          <button
            type="button"
            className="tool-btn tool-btn-sm"
            onClick={() => (preview.startedAt ? playout.stopPreview() : playout.playPreview())}
          >
            {preview.startedAt ? <Pause size={12} /> : <Play size={12} />}
            {preview.startedAt ? 'Pause' : 'Preview'}
          </button>
          <button
            type="button"
            className="tool-btn tool-btn-sm"
            onClick={() => actions.navigate('console')}
          >
            Console
            <ArrowRight size={12} />
          </button>
          <button
            type="button"
            className="lib-btn"
            aria-label="Clear preview"
            onClick={playout.clearPreview}
          >
            <X size={13} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
