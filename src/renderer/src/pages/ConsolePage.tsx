import {
  GripVertical,
  LayoutGrid,
  Link2,
  ListMusic,
  Mic,
  MicOff,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Scissors,
  Search,
  SkipForward,
  SlidersHorizontal,
  Square,
  Volume2,
  Wand2,
  X
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { PlayoutController } from '../hooks/usePlayout'
import { useNow } from '../hooks/useNow'
import type { AppActions } from '../lib/actions'
import { formatDuration, formatMediaMs } from '../lib/format'
import {
  QUICK_KEYS,
  TRACKS,
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

function Waveform({ seed, progress, live }: { seed: string; progress: number; live: boolean }) {
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

function DeckButton({ label, onClick, disabled, active, children }: { label: string; onClick: () => void; disabled?: boolean; active?: boolean; children: ReactNode }) {
  return (
    <button type="button" className="deck-btn" onClick={onClick} disabled={disabled} data-active={active} title={label} aria-label={label}>
      {children}
    </button>
  )
}

function PlayerA({ playout }: { playout: PlayoutController }) {
  const { current, elapsedMs, transport, toggleTransport, stop, restart, nextItem } = playout
  const durationMs = (current?.duration ?? 0) * 1000
  const progress = progressOf(elapsedMs, current?.duration ?? 0)
  const stateLabel = transport === 'playing' ? 'On air' : transport === 'paused' ? 'Paused' : 'Stopped'

  return (
    <section className="player-deck player-a" data-state={transport}>
      <header className="deck-head">
        <span className="deck-name">Player 1</span>
        <span className="deck-state">{stateLabel}</span>
      </header>
      <div className="deck-now">
        <div className="deck-track">
          <div className="deck-title" title={current?.title}>{current?.title ?? 'No track loaded'}</div>
          <div className="deck-artist">{current ? `${current.artist}${current.album ? ` · ${current.album}` : ''}` : '—'}</div>
        </div>
        <div className="deck-timer">
          <span className="timer-main mono">{formatMediaMs(elapsedMs)}</span>
          <span className="timer-remaining mono">-{formatMediaMs(Math.max(0, durationMs - elapsedMs))}</span>
        </div>
      </div>
      <Waveform seed={current?.title ?? 'nova'} progress={progress} live={transport === 'playing'} />
      <div className="deck-controls">
        <DeckButton label={transport === 'playing' ? 'Pause' : 'Play'} onClick={toggleTransport} active={transport === 'playing'}>
          {transport === 'playing' ? <Pause size={18} /> : <Play size={18} />}
        </DeckButton>
        <DeckButton label="Stop" onClick={stop}><Square size={15} /></DeckButton>
        <DeckButton label="Restart item" onClick={restart}><RotateCcw size={16} /></DeckButton>
        <DeckButton label="Next item" onClick={nextItem}><SkipForward size={17} /></DeckButton>
        <div className="deck-progress"><span style={{ width: `${progress * 100}%` }} /></div>
      </div>
    </section>
  )
}

function MiniDeck({ name, tag, item, detail, state, progress, onPlay, onStop, onClear, emptyLabel, children }: {
  name: string; tag: string; item?: PlaylistItem | null; detail?: string
  state: 'idle' | 'cued' | 'playing' | 'paused'; progress: number
  onPlay?: () => void; onStop?: () => void; onClear?: () => void; emptyLabel: string; children?: ReactNode
}) {
  return (
    <section className="mini-deck" data-state={state}>
      <header className="mini-head">
        <span className="deck-name">{name}</span>
        <span className="mini-tag">{tag}</span>
        {onClear ? (
          <button type="button" className="mini-clear" onClick={onClear} aria-label="Clear deck"><X size={12} /></button>
        ) : null}
      </header>
      {item ? (
        <>
          <div className="mini-title" title={item.title}>{item.title}</div>
          <div className="mini-artist">{detail ?? item.artist}</div>
          <div className="mini-progress"><span style={{ width: `${progress * 100}%` }} /></div>
          <div className="mini-foot">
            <span className="mini-time mono">{state === 'playing' ? formatMediaMs(progress * item.duration * 1000) : formatDuration(item.duration)}</span>
            <div className="mini-actions">
              {onPlay ? (
                <button type="button" className="mini-btn" onClick={onPlay} aria-label={state === 'playing' ? 'Pause preview' : 'Play'}>
                  {state === 'playing' ? <Pause size={12} /> : <Play size={12} />}
                </button>
              ) : null}
              {onStop ? (
                <button type="button" className="mini-btn" onClick={onStop} aria-label="Stop"><Square size={11} /></button>
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
  const { currentIndex, next, cart, cartElapsedMs } = playout
  return (
    <div className="player-rack player-rack-horizontal">
      <PlayerA playout={playout} />
      <MiniDeck
        name="Player 2"
        tag="Next"
        item={next ?? null}
        state="cued"
        progress={0}
        emptyLabel="End of log"
        onPlay={() => playout.jumpTo(currentIndex + 1)}
        detail={next ? `${next.artist}` : undefined}
      />
      <MiniDeck
        name="Player 3"
        tag="Idle"
        item={null}
        state="idle"
        progress={0}
        emptyLabel="Not in use"
      />
      <MiniDeck
        name="Player 4"
        tag="Quick key"
        item={cart?.item ?? null}
        state={cart ? 'playing' : 'idle'}
        progress={cart ? progressOf(cartElapsedMs, cart.item.duration) : 0}
        emptyLabel="Fire a quick key"
        onStop={cart ? playout.stopCart : undefined}
        detail={cart ? `${cart.item.artist}` : undefined}
      >
        {cart ? <span className="mini-badge">CART</span> : null}
      </MiniDeck>
    </div>
  )
}

function PlaylistRow({ item, index, start, state, selected, progress, onSelect, onPlay }: {
  item: PlaylistItem; index: number; start: number; state: 'played' | 'onair' | 'upcoming'; selected: boolean; progress: number; onSelect: () => void; onPlay: () => void
}) {
  return (
    <div className={`playlist-row is-${state}`} data-selected={selected} data-onair={state === 'onair'} tabIndex={0} role="button" aria-label={`${item.title} by ${item.artist}`} onClick={onSelect} onDoubleClick={onPlay} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay() } }}>
      {state === 'onair' ? <span className="row-progress" style={{ width: `${progress * 100}%` }} /> : null}
      <span className="row-index">
        {state === 'onair' ? <Volume2 size={12} /> : String(index + 1).padStart(2, '0')}
        <button type="button" className="row-play" aria-label={`Play ${item.title}`} title="Play from here" onClick={(e) => { e.stopPropagation(); onPlay() }}><Play size={11} /></button>
      </span>
      <span className="row-time mono">{new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="row-type"><TypeBadge type={item.type} /></span>
      <span className="row-title" title={item.title}>{item.title}{item.source !== 'playlist' ? <span className="row-source">{item.source}</span> : null}</span>
      <span className="row-artist" title={item.artist}>{item.artist}</span>
      <span className="row-cat">{item.category}</span>
      <span className="row-duration mono">{formatDuration(item.duration)}</span>
      <span className="row-end mono">{new Date(start + item.duration * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="row-link" title={state === 'onair' ? 'On air' : 'Linked'}>{item.source === 'playlist' ? <Link2 size={12} /> : <Plus size={12} />}</span>
    </div>
  )
}

function PlaylistPanel({ playout, query, onQuery }: { playout: PlayoutController; query: string; onQuery: (v: string) => void }) {
  const listRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const { log, currentIndex, transport } = playout
  const needle = query.trim().toLowerCase()
  const rows = useMemo(() => log.map((item, index) => ({ item, index })).filter(({ item }) => {
    if (!needle) return true
    return `${item.title} ${item.artist} ${item.category} ${item.type}`.toLowerCase().includes(needle)
  }), [log, needle])
  useEffect(() => { const node = listRef.current?.querySelector('[data-onair="true"]'); node?.scrollIntoView({ block: 'center' }) }, [])
  const jump = (index: number): void => { setSelected(index); playout.jumpTo(index); window.setTimeout(() => { const node = listRef.current?.querySelector('[data-onair="true"]'); node?.scrollIntoView({ block: 'center', behavior: 'smooth' }) }, 60) }
  const played = transport === 'stopped' ? 0 : currentIndex
  return (
    <section className="panel playlist-panel">
      <header className="panel-head">
        <div className="panel-title"><ListMusic size={15} /><h2>Playlist</h2><span className="count">{log.length}</span></div>
        <div className="log-filter">
          <Search size={13} />
          <input type="search" value={query} placeholder="Filter log…" aria-label="Filter the playlist" onChange={(e) => onQuery(e.target.value)} />
        </div>
        <div className="panel-meta"><span>{rows.length === log.length ? 'Current hour' : `${rows.length} matches`}</span></div>
      </header>
      <div className="playlist-header"><span>#</span><span>Start</span><span>Type</span><span>Title</span><span>Artist</span><span>Cat</span><span>Dur</span><span>End</span><span /></div>
      <div className="playlist-scroll" ref={listRef}>
        {rows.length === 0 ? <div className="log-empty">No items match “{query}”. Clear the filter to see the full log.</div> : rows.map(({ item, index }) => {
          const state = index === currentIndex && transport !== 'stopped' ? 'onair' : index < currentIndex ? 'played' : 'upcoming'
          return <PlaylistRow key={`${item.id}-${index}`} item={item} index={index} start={playout.logStart + playout.starts[index]} state={state} selected={selected === index} progress={progressOf(index === currentIndex ? playout.elapsedMs : 0, item.duration)} onSelect={() => setSelected(index)} onPlay={() => jump(index)} />
        })}
      </div>
      <footer className="panel-foot">
        <span><strong className="mono">{played}</strong> played</span>
        <span><strong className="mono">{log.length - currentIndex - 1}</strong> upcoming</span>
        <span className="panel-foot-right">Ends <strong className="mono">{new Date(playout.logEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
      </footer>
    </section>
  )
}

function QuickKeyRack({ playout }: { playout: PlayoutController }) {
  const { cart, cartElapsedMs, activeQuickKeyId, triggerQuickKey, stopCart } = playout
  const pads = QUICK_KEYS.slice(0, 24)
  const [menu, setMenu] = useState<{ x: number; y: number; pad: QuickKey } | null>(null)

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const timer = setTimeout(() => {
      window.addEventListener('click', close)
      window.addEventListener('contextmenu', close)
    }, 0)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('click', close)
      window.removeEventListener('contextmenu', close)
    }
  }, [menu])

  return (
    <section className="quickkey-rack">
      <header className="rack-bar">
        <div className="rack-bar-title"><LayoutGrid size={14} /> Quick keys <span className="count">{pads.length}</span></div>
        <div className="rack-bar-status">
          <span className="rack-cart-label">Cart C · {cart ? cart.item.title : 'idle'}</span>
          <button type="button" className="tool-btn tool-btn-sm" onClick={stopCart} disabled={!cart}><Square size={11} /> Stop cart</button>
        </div>
      </header>
      <div className="quickkey-grid">
        {pads.map((pad) => {
          const active = activeQuickKeyId === pad.id
          const progress = active ? progressOf(cartElapsedMs, pad.duration) : 0
          return (
            <button key={pad.id} type="button" className={`quickkey type-${pad.type}`} data-active={active} onClick={() => { if (active) stopCart(); else triggerQuickKey(pad) }} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, pad }) }} title={`${pad.label} – ${pad.detail} (${pad.duration}s)`}>
              {active ? <span className="qk-progress" style={{ width: `${progress * 100}%` }} /> : null}
              <span className="qk-top"><span className="qk-id mono">{pad.id}</span><span className="qk-duration mono">{pad.duration}s</span></span>
              <span className="qk-label">{pad.label}</span>
              <span className="qk-detail">{pad.detail}</span>
            </button>
          )
        })}
      </div>

      {menu ? (
        <div
          className="qk-context-menu"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {menu.pad.id === activeQuickKeyId ? (
            <button type="button" onClick={() => { stopCart(); setMenu(null) }}>Stop</button>
          ) : (
            <button type="button" onClick={() => { triggerQuickKey(menu.pad); setMenu(null) }}>Play</button>
          )}
          <button type="button" onClick={() => setMenu(null)}>Edit key…</button>
          <button type="button" onClick={() => setMenu(null)}>Remove key</button>
        </div>
      ) : null}
    </section>
  )
}

function LibraryPanel({ playout, actions }: { playout: PlayoutController; actions: AppActions }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const categories = useMemo(() => ['All', ...Array.from(new Set(TRACKS.map((t) => t.category)))], [])
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return TRACKS.filter((track) => {
      if (category !== 'All' && track.category !== category) return false
      if (!needle) return true
      return `${track.title} ${track.artist} ${track.album ?? ''} ${track.category} ${track.type}`.toLowerCase().includes(needle)
    })
  }, [query, category])
  const preview = playout.preview
  return (
    <section className="panel library-panel">
      <header className="panel-head">
        <div className="panel-title"><ListMusic size={15} /><h2>Library</h2><span className="count">{TRACKS.length}</span></div>
        <div className="log-filter">
          <Search size={13} />
          <input type="search" value={query} placeholder="Search…" aria-label="Search the library" onChange={(e) => setQuery(e.target.value)} />
        </div>
      </header>
      <div className="category-strip compact">
        {categories.map((name) => (
          <button key={name} type="button" className="category-chip" data-active={category === name} onClick={() => setCategory(name)}>
            {name}
          </button>
        ))}
      </div>
      <div className="library-scroll compact">
        {filtered.length === 0 ? <div className="log-empty">Nothing matches.</div> : filtered.map((track) => {
          const isCued = preview?.item.id === track.id
          return (
            <div key={track.id} className="lib-row" data-cued={isCued} onDoubleClick={() => { playout.addTrack(track); actions.notify('Added to the log', `${track.title} queued.`, 'success') }}>
              <span className={`type-badge type-${track.type}`}><span className="type-dot" />{TYPE_LABEL[track.type]}</span>
              <span className="lib-title" title={track.title}>{track.title}</span>
              <span className="lib-artist">{track.artist}</span>
              <span className="lib-dur mono">{formatDuration(track.duration)}</span>
              <span className="lib-actions">
                <button type="button" className="lib-btn" title="Cue in Player D" aria-label={`Cue ${track.title}`} onClick={() => { playout.cueTrack(track); actions.notify('Cued in Player D', `${track.title} ready to preview.`, 'info') }}><Play size={11} /></button>
                <button type="button" className="lib-btn lib-btn-add" title="Add to log" aria-label={`Add ${track.title}`} onClick={() => { playout.addTrack(track); actions.notify('Added to the log', `${track.title} queued.`, 'success') }}><Plus size={12} /></button>
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ControlsPanel({ playout, actions }: { playout: PlayoutController; actions: AppActions }) {
  return (
    <section className="panel controls-panel">
      <header className="panel-head">
        <div className="panel-title"><SlidersHorizontal size={15} /><h2>Controls</h2></div>
      </header>
      <div className="controls-body">
        <div className="controls-row">
          <button type="button" className="tool-btn" onClick={() => { playout.loadLog(); actions.notify('Fresh log loaded', 'The playlist was rebuilt for the current hour.', 'success') }}><ListMusic size={14} /> Load hour</button>
          <button type="button" className="tool-btn" onClick={() => {
            const text = playout.log.map((item, index) => [new Date(playout.logStart + playout.starts[index]).toLocaleTimeString(), TYPE_LABEL[item.type], item.title, item.artist, item.category, formatDuration(item.duration)].join('\t')).join('\n')
            actions.copy(text)
          }}><Save size={14} /> Export</button>
        </div>
        <div className="controls-row">
          <button type="button" className="tool-btn" data-active={playout.autoDj} onClick={() => { playout.setAutoDj(!playout.autoDj); actions.notify(`AutoDJ ${playout.autoDj ? 'off' : 'on'}`, playout.autoDj ? 'The log will stop at the end of the current hour.' : 'The log will roll into the next hour automatically.', 'info') }}>
            <Wand2 size={14} /> AutoDJ <span className={`tool-led ${playout.autoDj ? 'is-on' : ''}`} />
          </button>
          <button type="button" className="tool-btn" onClick={() => actions.notify('Voice tracking', 'Voice track recording is part of the console shell — audio capture is not wired up in this build.', 'info')}><Mic size={14} /> Voice track</button>
          <button type="button" className="tool-btn" onClick={() => actions.notify('Segue editor', 'The segue editor is a layout preview. Crossfade automation will land with the audio engine.', 'info')}><Scissors size={14} /> Segue</button>
        </div>
      </div>
    </section>
  )
}

function MicrophonePanel() {
  const [live, setLive] = useState(false)
  const [duck, setDuck] = useState(true)
  const [duckDb, setDuckDb] = useState(-6)
  return (
    <section className="microphone-panel microphone-panel-vertical">
      <div className="mic-top">
        <label className="mic-duck">
          <input type="checkbox" checked={duck} onChange={(e) => setDuck(e.target.checked)} disabled={!live} />
          <span>Duck music</span>
        </label>
        <div className="mic-slider">
          <input type="range" min={-20} max={0} step={1} value={duckDb} onChange={(e) => setDuckDb(Number(e.target.value))} disabled={!live || !duck} />
          <span className="mono">{duckDb} dB</span>
        </div>
      </div>
      <button type="button" className={`mic-btn mic-btn-big ${live ? 'is-live' : ''}`} onClick={() => setLive((v) => !v)} aria-pressed={live}>
        {live ? <Mic size={20} /> : <MicOff size={20} />}
        {live ? 'Mic live' : 'Mic off'}
      </button>
    </section>
  )
}

const DEFAULT_LAYOUT = ['library', 'controls', 'playlist', 'quickkeys']
const LAYOUT_KEY = 'nova.console.layout'

function readLayout(): string[] {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length === DEFAULT_LAYOUT.length) return parsed
    }
  } catch {}
  return [...DEFAULT_LAYOUT]
}

const PANEL_META: Record<string, { title: string; span: number }> = {
  library: { title: 'Library', span: 1 },
  controls: { title: 'Controls', span: 1 },
  playlist: { title: 'Playlist', span: 1 },
  quickkeys: { title: 'Quick keys', span: 3 }
}

export function ConsolePage({ playout, actions }: { playout: PlayoutController; actions: AppActions }) {
  const [query, setQuery] = useState('')
  const now = useNow(1000)
  const hour = new Date(now).getHours()
  const nextHour = (hour + 1) % 24
  const hourLabel = `${String(hour).padStart(2, '0')}:00 – ${String(nextHour).padStart(2, '0')}:00`
  const [layout, setLayout] = useState<string[]>(readLayout)
  const dragId = useRef<string | null>(null)

  const saveLayout = (next: string[]) => {
    setLayout(next)
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(next)) } catch {}
  }

  const onDragStart = (id: string) => { dragId.current = id }
  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    const from = dragId.current
    if (!from || from === id) return
    const fromIdx = layout.indexOf(from)
    const toIdx = layout.indexOf(id)
    if (fromIdx < 0 || toIdx < 0) return
    const next = [...layout]
    next.splice(fromIdx, 1)
    next.splice(toIdx, 0, from)
    saveLayout(next)
    dragId.current = from
  }
  const onDragEnd = () => { dragId.current = null }

  const renderPanel = (id: string) => {
    switch (id) {
      case 'library': return <LibraryPanel playout={playout} actions={actions} />
      case 'controls': return <ControlsPanel playout={playout} actions={actions} />
      case 'playlist': return <PlaylistPanel playout={playout} query={query} onQuery={setQuery} />
      case 'quickkeys': return <QuickKeyRack playout={playout} />
      default: return null
    }
  }

  return (
    <div className="console-page">
      <div className="console-main">
        <div className="console-grid">
          {layout.map((id) => {
            const meta = PANEL_META[id]
            return (
              <div
                key={id}
                className="console-panel"
                data-span={meta.span}
                draggable
                onDragStart={() => onDragStart(id)}
                onDragOver={(e) => onDragOver(e, id)}
                onDragEnd={onDragEnd}
              >
                <header className="console-panel-head">
                  <span className="console-panel-grip" aria-hidden="true"><GripVertical size={13} /></span>
                  <span className="console-panel-title">{meta.title}</span>
                  <span className="console-panel-hint">drag to move</span>
                </header>
                <div className="console-panel-body">{renderPanel(id)}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="console-players">
        <PlayerRack playout={playout} />
        <MicrophonePanel />
      </div>

      <footer className="console-status">
        <span className="status-onair" data-state={playout.transport}>
          <span className="status-dot" />
          {playout.transport === 'playing' ? 'On air' : playout.transport === 'paused' ? 'Paused' : 'Off air'}
        </span>
        <span>AutoDJ <strong>{playout.autoDj ? 'on' : 'off'}</strong></span>
        <span className="status-next">Next <strong>{playout.next?.title ?? 'end of log'}</strong></span>
        <span>Playlist <strong className="mono">{playout.currentIndex + 1}</strong> / <strong className="mono">{playout.log.length}</strong></span>
        <span className="status-right"><Radio size={11} /> Nova FM · Playout console</span>
        <button
          type="button"
          className="tool-btn tool-btn-sm"
          onClick={() => saveLayout([...DEFAULT_LAYOUT])}
          title="Reset the console layout to the starter arrangement"
        >
          Reset layout
        </button>
        <span className="mono status-hour">{hourLabel}</span>
      </footer>
    </div>
  )
}
