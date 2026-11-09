import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createQuickKeyPlaylistItem,
  createRollingLog,
  type PlaylistItem,
  type QuickKey,
  type Track
} from '../lib/playout-data'
import { useNow } from './useNow'

export type TransportState = 'playing' | 'paused' | 'stopped'

export interface ActiveCart {
  padId: string
  item: PlaylistItem
  startedAt: number
  endsAt: number
}

export interface PreviewState {
  item: PlaylistItem
  startedAt: number | null
}

export interface PlayoutController {
  log: PlaylistItem[]
  logStart: number
  starts: number[]
  totalMs: number
  logEnd: number
  transport: TransportState
  playing: boolean
  autoDj: boolean
  currentIndex: number
  elapsedMs: number
  current: PlaylistItem | undefined
  next: PlaylistItem | undefined
  cart: ActiveCart | null
  cartElapsedMs: number
  activeQuickKeyId: string | null
  preview: PreviewState | null
  previewElapsedMs: number
  toggleTransport: () => void
  stop: () => void
  restart: () => void
  nextItem: () => void
  jumpTo: (index: number) => void
  triggerQuickKey: (pad: QuickKey) => void
  stopCart: () => void
  addTrack: (track: Track) => number
  cueTrack: (track: Track) => void
  playPreview: () => void
  stopPreview: () => void
  clearPreview: () => void
  setAutoDj: (enabled: boolean) => void
  loadLog: () => void
}

const INITIAL = createRollingLog()

/** Simulated broadcast transport for the playout console. */
export function usePlayout(): PlayoutController {
  const now = useNow(500)
  const [log, setLog] = useState<PlaylistItem[]>(INITIAL.items)
  const [logStart, setLogStart] = useState<number>(INITIAL.logStart)
  const [playhead, setPlayhead] = useState<number>(() => Date.now() - INITIAL.logStart)
  const [transport, setTransport] = useState<TransportState>('playing')
  const [autoDj, setAutoDjState] = useState(true)
  const [cart, setCart] = useState<ActiveCart | null>(null)
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const starts = useMemo(() => {
    const offsets: number[] = []
    let cursor = 0
    for (const item of log) {
      offsets.push(cursor)
      cursor += item.duration * 1000
    }
    return offsets
  }, [log])

  const totalMs = useMemo(
    () => log.reduce((sum, item) => sum + item.duration * 1000, 0),
    [log]
  )

  const currentIndex = useMemo(() => {
    let index = 0
    for (let i = 0; i < starts.length; i++) {
      if (starts[i] <= playhead) index = i
      else break
    }
    return index
  }, [starts, playhead])

  const current = log[currentIndex]
  const next = log[currentIndex + 1]
  const elapsedMs = Math.min(
    Math.max(0, playhead - (starts[currentIndex] ?? 0)),
    (current?.duration ?? 0) * 1000
  )
  const logEnd = logStart + totalMs

  useEffect(() => {
    if (transport !== 'playing') return

    let last = Date.now()
    const timer = window.setInterval(() => {
      const stamp = Date.now()
      const delta = Math.max(0, stamp - last)
      last = stamp
      setPlayhead((value) => Math.min(value + delta, totalMs))
    }, 250)

    return () => window.clearInterval(timer)
  }, [transport, totalMs])

  useEffect(() => {
    if (playhead < totalMs || transport !== 'playing') return
    if (autoDj) {
      setPlayhead(0)
      setLogStart(Date.now())
    } else {
      setTransport('stopped')
    }
  }, [playhead, totalMs, autoDj, transport])

  useEffect(() => {
    if (cart && now >= cart.endsAt) setCart(null)
  }, [now, cart])

  useEffect(() => {
    if (!preview?.startedAt) return
    if (now >= preview.startedAt + preview.item.duration * 1000) {
      setPreview({ ...preview, startedAt: null })
    }
  }, [now, preview])

  const jumpTo = useCallback(
    (index: number) => {
      if (log.length === 0) return
      const target = Math.min(Math.max(0, index), log.length - 1)
      const offset = starts[target] ?? 0
      setPlayhead(offset)
      setLogStart(Date.now() - offset)
      setTransport('playing')
    },
    [log.length, starts]
  )

  const toggleTransport = useCallback(() => {
    setTransport((value) => (value === 'playing' ? 'paused' : 'playing'))
  }, [])

  const stop = useCallback(() => {
    setPlayhead(starts[currentIndex] ?? 0)
    setTransport('stopped')
  }, [currentIndex, starts])

  const restart = useCallback(() => {
    setPlayhead(starts[currentIndex] ?? 0)
    setTransport('playing')
  }, [currentIndex, starts])

  const nextItem = useCallback(() => {
    if (currentIndex >= log.length - 1) {
      jumpTo(0)
      return
    }
    jumpTo(currentIndex + 1)
  }, [currentIndex, jumpTo, log.length])

  const triggerQuickKey = useCallback((pad: QuickKey) => {
    const item = createQuickKeyPlaylistItem(pad)
    const startedAt = Date.now()
    setCart({
      padId: pad.id,
      item,
      startedAt,
      endsAt: startedAt + item.duration * 1000
    })
  }, [])

  const stopCart = useCallback(() => setCart(null), [])

  const addTrack = useCallback(
    (track: Track) => {
      const index = log.length
      setLog((previous) => [
        ...previous,
        {
          ...track,
          startAt: logStart + totalMs,
          source: 'library'
        }
      ])
      return index
    },
    [log.length, logStart, totalMs]
  )

  const cueTrack = useCallback((track: Track) => {
    setPreview({ item: { ...track, startAt: Date.now(), source: 'library' }, startedAt: null })
  }, [])

  const playPreview = useCallback(() => {
    setPreview((value) => (value ? { ...value, startedAt: Date.now() } : value))
  }, [])

  const stopPreview = useCallback(() => {
    setPreview((value) => (value ? { ...value, startedAt: null } : value))
  }, [])

  const clearPreview = useCallback(() => setPreview(null), [])

  const setAutoDj = useCallback((enabled: boolean) => setAutoDjState(enabled), [])

  const loadLog = useCallback(() => {
    const fresh = createRollingLog()
    setLog(fresh.items)
    setLogStart(fresh.logStart)
    setPlayhead(Date.now() - fresh.logStart)
    setTransport('playing')
    setCart(null)
    setPreview(null)
  }, [])

  return {
    log,
    logStart,
    starts,
    totalMs,
    logEnd,
    transport,
    playing: transport === 'playing',
    autoDj,
    currentIndex,
    elapsedMs,
    current,
    next,
    cart,
    cartElapsedMs: cart ? Math.min(now - cart.startedAt, cart.endsAt - cart.startedAt) : 0,
    activeQuickKeyId: cart?.padId ?? null,
    preview,
    previewElapsedMs:
      preview?.startedAt !== null && preview?.startedAt !== undefined
        ? Math.min(now - preview.startedAt, preview.item.duration * 1000)
        : 0,
    toggleTransport,
    stop,
    restart,
    nextItem,
    jumpTo,
    triggerQuickKey,
    stopCart,
    addTrack,
    cueTrack,
    playPreview,
    stopPreview,
    clearPreview,
    setAutoDj,
    loadLog
  }
}
