import {
  Clock,
  LayoutGrid,
  Link2,
  ListMusic,
  Mic,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Scissors,
  Search,
  SkipForward,
  Square,
  Volume2,
  Wand2,
  X
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { PlayoutController } from '../hooks/usePlayout'
import { useNow } from '../hooks/useNow'
import type { AppActions } from '../lib/actions'
import {
  formatClock,
  formatDuration,
  formatMediaMs
} from '../lib/format'
import {
  QUICK_KEYS,
  TYPE_LABEL,
  type PlayType,
  type PlaylistItem,
  type QuickKey
} from '../lib/playout-data'

function progressOf(elapsedMs: number, durationSeconds: number): number {
  return Math.min(1, Math.max(0, elapsedMs / Math.max(1, durationSeconds * 1000)))
}

function waveBars(seedText: string, count = 58): number[] {
  let seed = 0
  for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) % 100000
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.abs(Math.sin(seed * 0.017 + index * 0.52) * Math.cos(index * 0.21))
    const lift = Math.abs(Math.sin(seed * 0.003 + index * 0.11))
    return 16 + Math.round((wave * 0.62 + lift * 0.38) * 78)
  })
}

function Waveform({
  seed,
  progress,
  live
}: {
  seed: string
  progress: number
  live: boolean
}) {
  const bars = useMemo(() => waveBars(seed), [seed])
  return (
    <div className="waveform" data-live={live} aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={index}
          data-played={index / bars.length <= progress}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}

function TypeBadge({ type }: { type: PlayType }) {
  return (
    <span className={`type-badge type-${type}`}>
      <span className="type-dot" />
      {TYPE_LABEL[type]}
    </span>
  )
}

function VUMeter({ live }: { live: boolean }) {
  return (
    <div className="vu-meter" data-live={live} aria-hidden="true">
      {Array.from({ length: 14 }, (_, index) => (
        <span
          key={index}
          style={{
            animationDelay: `${(index % 7) * 90}ms`,
            animationDuration: `${650 + (index % 5) * 130}ms`
          }}
        />
      ))}
    </div>
  )
}

function DeckButton({
  label,
  onClick,
  disabled,
  active,
  children
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="deck-btn"
      onClick={onClick}
      disabled={disabled}
      data-active={active}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  )
}

function PlayerA({ playout }: { playout: PlayoutController }) {
  const { current, elapsedMs, transport, toggleTransport, stop, restart, nextItem } = playout
  const durationMs = (current?.duration ?? 0) * 1000
  const progress = progressOf(elapsedMs, current?.duration ?? 0)
  const stateLabel =
    transport === 'playing' ? 'On air' : transport === 'paused' ? 'Paused' : 'Stopped'

  return (
    <section className="player-deck player-a" data-state={transport}>
      <header className="deck-head">
        <span className="deck-name">Player A</span>
        <span className="deck-state">{stateLabel}</span>
        <span className="deck-clock mono">{formatClock(Date.now())}</span>
      </header>

      <div className="deck-now">
        <div className="deck-track">
          <div className="deck-title" title={current?.title}>
            {current?.title ?? 'No track loaded'}
          </div>
          <div className="deck-artist">
            {current ? `${current.artist}${current.album ? ` · ${current.album}` : ''}` : '—'}
          </div>
        </div>
        <div className="deck-timer">
          <span className="timer-main mono">{formatMediaMs(elapsedMs)}</span>
          <span className="timer-remaining mono">
            -{formatMediaMs(Math.max(0, durationMs - elapsedMs))}
          </span>
        </div>
      </div>

      <Waveform
        seed={current?.title ?? 'nova'}
        progress={progress}
        live={transport === 'playing'}
      />

      <div className="deck-tags">
        {current ? <TypeBadge type={current.type} /> : null}
        <span className="deck-tag">{current?.category ?? '—'}</span>
        <span className="deck-tag">Intro {current?.intro ?? 0}s</span>
        <span className="deck-tag">Extro {current?.extro ?? 0}s</span>
        {current?.bpm ? <span className="deck-tag">{current.bpm} BPM</span> : null}
      </div>

      <div className="deck-controls">
        <DeckButton
          label={transport === 'playing' ? 'Pause' : 'Play'}
          onClick={toggleTransport}
          active={transport === 'playing'}
        >
          {transport === 'playing' ? <Pause size={18} /> : <Play size={18} />}
        </DeckButton>
        <DeckButton label="Stop" onClick={stop}>
          <Square size={15} />
        </DeckButton>
        <DeckButton label="Restart item" onClick={restart}>
          <RotateCcw size={16} />
        </DeckButton>
        <DeckButton label="Next item" onClick={nextItem}>
          <SkipForward size={17} />
        </DeckButton>
        <div className="deck-progress">
          <span style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </section>
  )
}

function MiniDeck({
  name,
  tag,
  item,
  detail,
  state,
  progress,
  onPlay,
  onStop,
  onClear,
  emptyLabel,
  children
}: {
  name: string
  tag: string
  item?: PlaylistItem | null
  detail?: string
  state: 'idle' | 'cued' | 'playing' | 'paused'
  progress: number
  onPlay?: () => void
  onStop?: () => void
  onClear?: () => void
  emptyLabel: string
  children?: ReactNode
}) {
  return (
    <section className="mini-deck" data-state={state}>
      <header className="mini-head">
        <span className="deck-name">{name}</span>
        <span className="mini-tag">{tag}</span>
        {onClear ? (
          <button type="button" className="mini-clear" onClick={onClear} aria-label="Clear deck">
            <X size={12} />
          </button>
        ) : null}
      </header>

      {item ? (
        <>
          <div className="mini-title" title={item.title}>
            {item.title}
          </div>
          <div className="mini-artist">{detail ?? item.artist}</div>
          <div className="mini-progress">
            <span style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mini-foot">
            <span className="mini-time mono">
              {state === 'playing'
                ? formatMediaMs(progress * item.duration * 1000)
                : formatDuration(item.duration)}
            </span>
            <div className="mini-actions">
              {onPlay ? (
                <button
                  type="button"
                  className="mini-btn"
                  onClick={onPlay}
                  aria-label={state === 'playing' ? 'Pause preview' : 'Play'}
                >
                  {state === 'playing' ? <Pause size={12} /> : <Play size={12} />}
                </button>
              ) : null}
              {onStop ? (
                <button type="button" className="mini-btn" onClick={onStop} aria-label="Stop">
                  <Square size={11} />
                </button>
              ) : null}
              {children}
            </div>
          </div>
        </>
      ) : (
        <div className="mini-empty">{emptyLabel}</div>
      )}
    </section>
  )
}

function PlayerRack({ playout }: { playout: PlayoutController }) {
  const { currentIndex, next, cart, cartElapsedMs, preview, previewElapsedMs, transport } = playout
  const previewDuration = preview?.item.duration ?? 0
  const previewProgress = progressOf(previewElapsedMs, previewDuration)

  return (
    <aside className="player-rack">
      <header className="rack-head">
        <div className="rack-head-title">
          <Radio size={14} />
          On air
        </div>
        <VUMeter live={playout.playing} />
      </header>

      <PlayerA playout={playout} />

      <div className="deck-stack">
        <MiniDeck
          name="Player B"
          tag="Next"
          item={next ?? null}
          state="cued"
          progress={0}
          emptyLabel="End of log"
          onPlay={() => playout.jumpTo(currentIndex + 1)}
          detail={next ? `${next.artist} · starts ${formatClock(playout.logStart + (playout.starts[currentIndex + 1] ?? 0))}` : undefined}
        />

        <MiniDeck
          name="Player C"
          tag="Cart"
          item={cart?.item ?? null}
          state={cart ? 'playing' : 'idle'}
          progress={cart ? progressOf(cartElapsedMs, cart.item.duration) : 0}
          emptyLabel="Fire a quick key"
          onStop={cart ? playout.stopCart : undefined}
          detail={cart ? `${cart.item.artist} · Quick key ${cart.padId}` : undefined}
        >
          {cart ? <span className="mini-badge">CART</span> : null}
        </MiniDeck>

        <MiniDeck
          name="Player D"
          tag="Preview"
          item={preview?.item ?? null}
          state={preview ? (preview.startedAt ? 'playing' : 'cued') : 'idle'}
          progress={previewProgress}
          emptyLabel="Cue from the library"
          onPlay={
            preview
              ? preview.startedAt
                ? playout.stopPreview
                : playout.playPreview
              : undefined
          }
          onStop={preview?.startedAt ? playout.stopPreview : undefined}
          onClear={preview ? playout.clearPreview : undefined}
          detail={
            preview
              ? `${preview.item.artist}${preview.startedAt ? '' : ' · ready'}`
              : undefined
          }
        >
          {preview && !preview.startedAt ? <span className="mini-badge">CUE</span> : null}
        </MiniDeck>
      </div>

      <footer className="rack-foot">
        <span className={`rack-live ${transport === 'playing' ? 'is-live' : ''}`}>
          <span className="status-dot" />
          PGM {transport === 'playing' ? 'LIVE' : transport.toUpperCase()}
        </span>
        <span className="rack-foot-meta">48 kHz · Stereo</span>
      </footer>
    </aside>
  )
}

function PlaylistRow({
  item,
  index,
  start,
  state,
  selected,
  progress,
  onSelect,
  onPlay
}: {
  item: PlaylistItem
  index: number
  start: number
  state: 'played' | 'onair' | 'upcoming'
  selected: boolean
  progress: number
  onSelect: () => void
  onPlay: () => void
}) {
  return (
    <div
      className={`playlist-row is-${state}`}
      data-selected={selected}
      data-onair={state === 'onair'}
      tabIndex={0}
      role="button"
      aria-label={`${item.title} by ${item.artist}`}
      onClick={onSelect}
      onDoubleClick={onPlay}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onPlay()
        }
      }}
    >
      {state === 'onair' ? (
        <span className="row-progress" style={{ width: `${progress * 100}%` }} />
      ) : null}
      <span className="row-index">
        {state === 'onair' ? <Volume2 size={12} /> : String(index + 1).padStart(2, '0')}
        <button
          type="button"
          className="row-play"
          aria-label={`Play ${item.title}`}
          title="Play from here"
          onClick={(event) => {
            event.stopPropagation()
            onPlay()
          }}
        >
          <Play size={11} />
        </button>
      </span>
      <span className="row-time mono">{formatClock(start)}</span>
      <span className="row-type">
        <TypeBadge type={item.type} />
      </span>
      <span className="row-title" title={item.title}>
        {item.title}
        {item.source !== 'playlist' ? <span className="row-source">{item.source}</span> : null}
      </span>
      <span className="row-artist" title={item.artist}>
        {item.artist}
      </span>
      <span className="row-cat">{item.category}</span>
      <span className="row-duration mono">{formatDuration(item.duration)}</span>
      <span className="row-end mono">{formatClock(start + item.duration * 1000)}</span>
      <span className="row-link" title={state === 'onair' ? 'On air' : 'Linked'}>
        {item.source === 'playlist' ? <Link2 size={12} /> : <Plus size={12} />}
      </span>
    </div>
  )
}

function PlaylistPanel({
  playout,
  query,
  onQuery
}: {
  playout: PlayoutController
  query: string
  onQuery: (value: string) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const { log, logStart, starts, currentIndex, elapsedMs, transport } = playout
  const needle = query.trim().toLowerCase()

  const rows = useMemo(
    () =>
      log
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => {
          if (!needle) return true
          return `${item.title} ${item.artist} ${item.category} ${item.type}`
            .toLowerCase()
            .includes(needle)
        }),
    [log, needle]
  )

  useEffect(() => {
    const node = listRef.current?.querySelector('[data-onair="true"]')
    node?.scrollIntoView({ block: 'center' })
  }, [])

  const jump = (index: number): void => {
    setSelected(index)
    playout.jumpTo(index)
    window.setTimeout(() => {
      const node = listRef.current?.querySelector('[data-onair="true"]')
      node?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 60)
  }

  const played = transport === 'stopped' ? 0 : currentIndex

  return (
    <section className="panel playlist-panel">
      <header className="panel-head">
        <div className="panel-title">
          <ListMusic size={15} />
          <h2>Playlist</h2>
          <span className="count">{log.length}</span>
        </div>
        <div className="log-filter">
          <Search size={13} />
          <input
            type="search"
            value={query}
            placeholder="Filter log…"
            aria-label="Filter the playlist"
            onChange={(event) => onQuery(event.target.value)}
          />
        </div>
        <div className="panel-meta">
          <span>{rows.length === log.length ? 'Current hour' : `${rows.length} matches`}</span>
        </div>
      </header>

      <div className="playlist-header">
        <span>#</span>
        <span>Start</span>
        <span>Type</span>
        <span>Title</span>
        <span>Artist</span>
        <span>Cat</span>
        <span>Dur</span>
        <span>End</span>
        <span />
      </div>

      <div className="playlist-scroll" ref={listRef}>
        {rows.length === 0 ? (
          <div className="log-empty">
            No items match “{query}”. Clear the filter to see the full log.
          </div>
        ) : (
          rows.map(({ item, index }) => {
            const state =
              index === currentIndex && transport !== 'stopped'
                ? 'onair'
                : index < currentIndex
                  ? 'played'
                  : 'upcoming'
            return (
              <PlaylistRow
                key={`${item.id}-${index}`}
                item={item}
                index={index}
                start={logStart + starts[index]}
                state={state}
                selected={selected === index}
                progress={progressOf(
                  index === currentIndex ? elapsedMs : 0,
                  item.duration
                )}
                onSelect={() => setSelected(index)}
                onPlay={() => jump(index)}
              />
            )
          })
        )}
      </div>

      <footer className="panel-foot">
        <span>
          <strong className="mono">{played}</strong> played
        </span>
        <span>
          <strong className="mono">{log.length - currentIndex - 1}</strong> upcoming
        </span>
        <span className="panel-foot-right">
          Ends <strong className="mono">{formatClock(playout.logEnd)}</strong>
        </span>
      </footer>
    </section>
  )
}

function QuickKeyRack({ playout }: { playout: PlayoutController }) {
  const { cart, cartElapsedMs, activeQuickKeyId, triggerQuickKey, stopCart } = playout
  const pads = QUICK_KEYS.slice(0, 24)

  const fire = (pad: QuickKey): void => {
    triggerQuickKey(pad)
  }

  return (
    <section className="quickkey-rack">
      <header className="rack-bar">
        <div className="rack-bar-title">
          <LayoutGrid size={14} />
          Quick keys
          <span className="count">{pads.length}</span>
        </div>
        <div className="rack-bar-status">
          <span className="rack-cart-label">
            Cart C · {cart ? cart.item.title : 'idle'}
          </span>
          <button
            type="button"
            className="tool-btn tool-btn-sm"
            onClick={stopCart}
            disabled={!cart}
          >
            <Square size={11} />
            Stop cart
          </button>
        </div>
      </header>

      <div className="quickkey-grid">
        {pads.map((pad) => {
          const active = activeQuickKeyId === pad.id
          const progress = active ? progressOf(cartElapsedMs, pad.duration) : 0
          return (
            <button
              key={pad.id}
              type="button"
              className={`quickkey type-${pad.type}`}
              data-active={active}
              onClick={() => fire(pad)}
              title={`${pad.label} — ${pad.detail} (${pad.duration}s)`}
            >
              {active ? (
                <span className="qk-progress" style={{ width: `${progress * 100}%` }} />
              ) : null}
              <span className="qk-top">
                <span className="qk-id mono">{pad.id}</span>
                <span className="qk-duration mono">{pad.duration}s</span>
              </span>
              <span className="qk-label">{pad.label}</span>
              <span className="qk-detail">{pad.detail}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function ConsolePage({
  playout,
  actions
}: {
  playout: PlayoutController
  actions: AppActions
}) {
  const [query, setQuery] = useState('')
  const now = useNow(1000)
  const hour = new Date(now).getHours()
  const nextHour = (hour + 1) % 24
  const hourLabel = `${String(hour).padStart(2, '0')}:00 – ${String(nextHour).padStart(2, '0')}:00`

  const exportLog = (): void => {
    const text = playout.log
      .map((item, index) => {
        const start = playout.logStart + playout.starts[index]
        return [
          formatClock(start),
          TYPE_LABEL[item.type],
          item.title,
          item.artist,
          item.category,
          formatDuration(item.duration)
        ].join('\t')
      })
      .join('\n')
    actions.copy(text)
  }

  return (
    <div className="console-page">
      <div className="console-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            className="tool-btn"
            onClick={() => {
              playout.loadLog()
              actions.notify('Fresh log loaded', 'The playlist was rebuilt for the current hour.', 'success')
            }}
          >
            <ListMusic size={14} />
            Load hour
          </button>
          <button type="button" className="tool-btn" onClick={exportLog}>
            <Save size={14} />
            Export
          </button>
          <span className="toolbar-sep" />
          <button
            type="button"
            className="tool-btn"
            data-active={playout.autoDj}
            onClick={() => {
              playout.setAutoDj(!playout.autoDj)
              actions.notify(
                `AutoDJ ${playout.autoDj ? 'off' : 'on'}`,
                playout.autoDj
                  ? 'The log will stop at the end of the current hour.'
                  : 'The log will roll into the next hour automatically.',
                'info'
              )
            }}
          >
            <Wand2 size={14} />
            AutoDJ
            <span className={`tool-led ${playout.autoDj ? 'is-on' : ''}`} />
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={() =>
              actions.notify(
                'Voice tracking',
                'Voice track recording is part of the console shell — audio capture is not wired up in this build.',
                'info'
              )
            }
          >
            <Mic size={14} />
            Voice track
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={() =>
              actions.notify(
                'Segue editor',
                'The segue editor is a layout preview. Crossfade automation will land with the audio engine.',
                'info'
              )
            }
          >
            <Scissors size={14} />
            Segue
          </button>
        </div>

        <div className="toolbar-spacer" />

        <div className="hour-chip">
          <Clock size={13} />
          <span className="mono">{hourLabel}</span>
        </div>
      </div>

      <div className="console-main">
        <PlaylistPanel playout={playout} query={query} onQuery={setQuery} />
        <PlayerRack playout={playout} />
      </div>

      <QuickKeyRack playout={playout} />

      <footer className="console-status">
        <span className="status-onair" data-state={playout.transport}>
          <span className="status-dot" />
          {playout.transport === 'playing'
            ? 'On air'
            : playout.transport === 'paused'
              ? 'Paused'
              : 'Off air'}
        </span>
        <span>
          AutoDJ <strong>{playout.autoDj ? 'on' : 'off'}</strong>
        </span>
        <span className="status-next">
          Next <strong>{playout.next?.title ?? 'end of log'}</strong>
        </span>
        <span>
          Playlist <strong className="mono">{playout.currentIndex + 1}</strong> /{' '}
          <strong className="mono">{playout.log.length}</strong>
        </span>
        <span className="status-right">
          <Radio size={11} /> Nova FM · Playout console
        </span>
      </footer>
    </div>
  )
}
