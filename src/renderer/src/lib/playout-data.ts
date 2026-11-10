export type PlayType = 'song' | 'jingle' | 'ad' | 'news' | 'sweeper' | 'promo' | 'command'

export const TYPE_LABEL: Record<PlayType, string> = {
  song: 'Song',
  jingle: 'Jingle',
  ad: 'Ad',
  news: 'News',
  sweeper: 'Sweeper',
  promo: 'Promo',
  command: 'Command'
}

export interface Track {
  id: string
  title: string
  artist: string
  album?: string
  category: string
  type: PlayType
  duration: number
  bpm?: number
  year?: number
  intro: number
  extro: number
  lastPlayed?: string
}

export interface PlaylistItem extends Track {
  startAt: number
  source: 'playlist' | 'quickkey' | 'library'
}

export interface QuickKey {
  id: string
  label: string
  detail: string
  type: PlayType
  duration: number
}

export const STATION_NAME = 'Nova FM'
export const STATION_STRAPLINE = 'The soundtrack to your day'

export const TRACKS: Track[] = []

const TRACK_BY_ID = new Map(TRACKS.map((track) => [track.id, track]))

const LOG_ORDER: string[] = []

const ROLLING_ORDER = [...LOG_ORDER, ...LOG_ORDER.slice().reverse(), ...LOG_ORDER]

/**
 * Builds a rolling log that always has played history behind the playhead and
 * roughly two hours of material ahead of it.
 */
export function createRollingLog(now = new Date()): { items: PlaylistItem[]; logStart: number } {
  const logStart = now.getTime() - 18 * 60 * 1000
  const items: PlaylistItem[] = []
  let cursor = logStart

  for (const id of ROLLING_ORDER) {
    const track = TRACK_BY_ID.get(id)
    if (!track) continue
    items.push({ ...track, startAt: cursor, source: 'playlist' })
    cursor += track.duration * 1000
  }

  return { items, logStart }
}

/** Builds a full hour log anchored to the current clock hour. */
export function createHourLog(now = new Date()): PlaylistItem[] {
  const hourStart = new Date(now)
  hourStart.setMinutes(0, 0, 0)

  let cursor = hourStart.getTime()
  const items: PlaylistItem[] = []

  for (const id of LOG_ORDER) {
    const track = TRACK_BY_ID.get(id)
    if (!track) continue
    items.push({ ...track, startAt: cursor, source: 'playlist' })
    cursor += track.duration * 1000
  }

  // Ensure the log always covers the whole hour, even on long songs.
  if (cursor < hourStart.getTime() + 60 * 60 * 1000) {
    const extra = ['electric-blue', 'slow-motion', 'city-lights', 'holding-on']
    for (const id of extra) {
      const track = TRACK_BY_ID.get(id)
      if (!track) continue
      items.push({ ...track, startAt: cursor, source: 'playlist' })
      cursor += track.duration * 1000
    }
  }

  return items
}

export function findOnAirIndex(items: PlaylistItem[], now = Date.now()): number {
  let index = 0
  for (let i = 0; i < items.length; i++) {
    if (items[i].startAt <= now) index = i
    else break
  }
  return index
}

export function createQuickKeyPlaylistItem(pad: QuickKey): PlaylistItem {
  return {
    id: `qk-${pad.id}-${Date.now()}`,
    title: pad.label,
    artist: pad.detail,
    category: 'Quick Key',
    type: pad.type,
    duration: pad.duration,
    intro: 0,
    extro: pad.duration,
    startAt: Date.now(),
    source: 'quickkey'
  }
}

export function createLibraryPlaylistItem(track: Track, startAt = Date.now()): PlaylistItem {
  return { ...track, startAt, source: 'library' }
}

export const QUICK_KEYS: QuickKey[] = [
  { id: '01', label: 'TOH', detail: 'Top of hour', type: 'jingle', duration: 10 },
  { id: '02', label: 'NEWS', detail: 'News bed', type: 'news', duration: 12 },
  { id: '03', label: 'WEATHER', detail: 'Weather bed', type: 'news', duration: 15 },
  { id: '04', label: 'SPORT', detail: 'Sport bed', type: 'news', duration: 14 },
  { id: '05', label: 'TRAFFIC', detail: 'Traffic bed', type: 'news', duration: 11 },
  { id: '06', label: 'JINGLE 1', detail: 'Nova FM', type: 'jingle', duration: 8 },
  { id: '07', label: 'JINGLE 2', detail: 'More music', type: 'jingle', duration: 6 },
  { id: '08', label: 'STATION ID', detail: 'Nova FM', type: 'jingle', duration: 5 },
  { id: '09', label: 'SWEEPER A', detail: 'Hit music', type: 'sweeper', duration: 9 },
  { id: '10', label: 'SWEEPER B', detail: 'Overnight', type: 'sweeper', duration: 7 },
  { id: '11', label: 'PROMO 1', detail: 'The Weekender', type: 'promo', duration: 25 },
  { id: '12', label: 'PROMO 2', detail: 'Breakfast Show', type: 'promo', duration: 20 },
  { id: '13', label: 'AD 30', detail: 'Commercial', type: 'ad', duration: 30 },
  { id: '14', label: 'AD 15', detail: 'Commercial', type: 'ad', duration: 15 },
  { id: '15', label: 'SHOW OPEN', detail: 'Breakfast', type: 'promo', duration: 18 },
  { id: '16', label: 'TIME CHECK', detail: 'Voice', type: 'sweeper', duration: 6 },
  { id: '17', label: 'HANDOVER', detail: 'Voice', type: 'sweeper', duration: 8 },
  { id: '18', label: 'BED 100', detail: 'Instrumental bed', type: 'command', duration: 100 },
  { id: '19', label: 'BED 60', detail: 'Instrumental bed', type: 'command', duration: 60 },
  { id: '20', label: 'WHOOSH', detail: 'SFX', type: 'command', duration: 3 },
  { id: '21', label: 'RISER', detail: 'SFX', type: 'command', duration: 6 },
  { id: '22', label: 'APPLAUSE', detail: 'SFX', type: 'command', duration: 8 },
  { id: '23', label: 'LAUGH', detail: 'SFX', type: 'command', duration: 4 },
  { id: '24', label: 'DRY LINK', detail: 'Voice', type: 'sweeper', duration: 5 },
  { id: '25', label: 'NO AUDIO', detail: 'Silence', type: 'command', duration: 10 }
]
