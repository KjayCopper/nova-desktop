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

const ARTIST_IMAGING = 'Nova FM Imaging'
const ARTIST_ADS = 'Nova FM Sales'

export const TRACKS: Track[] = [
  {
    id: 'id-nova',
    title: 'Nova FM — Station ID',
    artist: ARTIST_IMAGING,
    album: 'Station Imaging',
    category: 'Imaging',
    type: 'jingle',
    duration: 8,
    intro: 1,
    extro: 7,
    year: 2026
  },
  {
    id: 'morning-glow',
    title: 'Morning Glow',
    artist: 'Aria Vale',
    album: 'Daybreak',
    category: 'Music',
    type: 'song',
    duration: 214,
    bpm: 104,
    year: 2025,
    intro: 12,
    extro: 204
  },
  {
    id: 'silver-lining',
    title: 'Silver Lining',
    artist: 'The Capsules',
    album: 'Sideways',
    category: 'Music',
    type: 'song',
    duration: 198,
    bpm: 118,
    year: 2024,
    intro: 9,
    extro: 189
  },
  {
    id: 'hour-open',
    title: 'Hour Open — Top of Hour',
    artist: ARTIST_IMAGING,
    category: 'Imaging',
    type: 'jingle',
    duration: 12,
    intro: 1,
    extro: 11
  },
  {
    id: 'neon-skyline',
    title: 'Neon Skyline',
    artist: 'Harbor Lights',
    album: 'Night Maps',
    category: 'Music',
    type: 'song',
    duration: 226,
    bpm: 112,
    year: 2025,
    intro: 14,
    extro: 214
  },
  {
    id: 'little-victories',
    title: 'Little Victories',
    artist: 'Mae Rivers',
    album: 'Slow Bloom',
    category: 'Music',
    type: 'song',
    duration: 203,
    bpm: 96,
    year: 2025,
    intro: 11,
    extro: 194
  },
  {
    id: 'ad-bank',
    title: 'Bank of the Coast — 30s',
    artist: ARTIST_ADS,
    category: 'Advertising',
    type: 'ad',
    duration: 30,
    intro: 1,
    extro: 29
  },
  {
    id: 'soft-focus',
    title: 'Soft Focus',
    artist: 'Juniper Club',
    album: 'Polaroid',
    category: 'Music',
    type: 'song',
    duration: 188,
    bpm: 122,
    year: 2023,
    intro: 8,
    extro: 180
  },
  {
    id: 'news-9',
    title: 'The Nine O’Clock News',
    artist: 'Nova Newsroom',
    category: 'News',
    type: 'news',
    duration: 180,
    intro: 4,
    extro: 176
  },
  {
    id: 'weather-watch',
    title: 'Weather Watch',
    artist: 'Nova Newsroom',
    category: 'News',
    type: 'news',
    duration: 45,
    intro: 2,
    extro: 43
  },
  {
    id: 'cruise-control',
    title: 'Cruise Control',
    artist: 'Satellite Sons',
    album: 'Long Way Round',
    category: 'Music',
    type: 'song',
    duration: 241,
    bpm: 110,
    year: 2024,
    intro: 16,
    extro: 228
  },
  {
    id: 'golden-hour',
    title: 'Golden Hour',
    artist: 'Elle Marlow',
    album: 'Amber',
    category: 'Music',
    type: 'song',
    duration: 219,
    bpm: 100,
    year: 2025,
    intro: 10,
    extro: 210
  },
  {
    id: 'sweeper-04',
    title: 'Sweeper 04 — More Music',
    artist: ARTIST_IMAGING,
    category: 'Imaging',
    type: 'sweeper',
    duration: 9,
    intro: 0,
    extro: 8
  },
  {
    id: 'paper-planes',
    title: 'Paper Planes',
    artist: 'The Wilds',
    album: 'Open Country',
    category: 'Music',
    type: 'song',
    duration: 207,
    bpm: 106,
    year: 2024,
    intro: 13,
    extro: 198
  },
  {
    id: 'ad-coffee',
    title: 'Morning Brew Co. — 30s',
    artist: ARTIST_ADS,
    category: 'Advertising',
    type: 'ad',
    duration: 30,
    intro: 1,
    extro: 29
  },
  {
    id: 'afterglow',
    title: 'Afterglow',
    artist: 'Nova Kite',
    album: 'Neon Rooms',
    category: 'Music',
    type: 'song',
    duration: 232,
    bpm: 114,
    year: 2026,
    intro: 15,
    extro: 222
  },
  {
    id: 'toh-jingle',
    title: 'Top of the Hour',
    artist: ARTIST_IMAGING,
    category: 'Imaging',
    type: 'jingle',
    duration: 10,
    intro: 1,
    extro: 9
  },
  {
    id: 'midnight-drive',
    title: 'Midnight Drive',
    artist: 'Ivory Coast',
    album: 'City Lines',
    category: 'Music',
    type: 'song',
    duration: 244,
    bpm: 108,
    year: 2025,
    intro: 18,
    extro: 232
  },
  {
    id: 'open-road',
    title: 'Open Road',
    artist: 'The Long Way',
    album: 'Miles',
    category: 'Music',
    type: 'song',
    duration: 216,
    bpm: 102,
    year: 2024,
    intro: 12,
    extro: 206
  },
  {
    id: 'promo-weekender',
    title: 'Promo — The Weekender',
    artist: ARTIST_IMAGING,
    category: 'Promo',
    type: 'promo',
    duration: 25,
    intro: 1,
    extro: 24
  },
  {
    id: 'static-bloom',
    title: 'Static Bloom',
    artist: 'Vela',
    album: 'Signal',
    category: 'Music',
    type: 'song',
    duration: 228,
    bpm: 120,
    year: 2025,
    intro: 14,
    extro: 218
  },
  {
    id: 'come-around',
    title: 'Come Around',
    artist: 'East Arcade',
    album: 'Weekend Radio',
    category: 'Music',
    type: 'song',
    duration: 211,
    bpm: 116,
    year: 2024,
    intro: 9,
    extro: 202
  },
  {
    id: 'ad-break',
    title: 'Nova FM — Ad Break',
    artist: ARTIST_ADS,
    category: 'Advertising',
    type: 'ad',
    duration: 30,
    intro: 1,
    extro: 29
  },
  {
    id: 'honey-skies',
    title: 'Honey Skies',
    artist: 'Romy June',
    album: 'Golden',
    category: 'Music',
    type: 'song',
    duration: 236,
    bpm: 98,
    year: 2026,
    intro: 11,
    extro: 226
  },
  {
    id: 'last-light',
    title: 'Last Light',
    artist: 'Harbor Lights',
    album: 'Night Maps',
    category: 'Music',
    type: 'song',
    duration: 222,
    bpm: 108,
    year: 2025,
    intro: 10,
    extro: 212
  },
  {
    id: 'electric-blue',
    title: 'Electric Blue',
    artist: 'Vela',
    album: 'Signal',
    category: 'Music',
    type: 'song',
    duration: 205,
    bpm: 124,
    year: 2025,
    intro: 8,
    extro: 196,
    lastPlayed: 'Yesterday 22:14'
  },
  {
    id: 'slow-motion',
    title: 'Slow Motion',
    artist: 'Juniper Club',
    album: 'Polaroid',
    category: 'Music',
    type: 'song',
    duration: 218,
    bpm: 92,
    year: 2023,
    intro: 13,
    extro: 208,
    lastPlayed: 'Today 04:38'
  },
  {
    id: 'city-lights',
    title: 'City Lights',
    artist: 'East Arcade',
    album: 'Weekend Radio',
    category: 'Music',
    type: 'song',
    duration: 230,
    bpm: 118,
    year: 2024,
    intro: 12,
    extro: 220,
    lastPlayed: 'Today 09:02'
  },
  {
    id: 'holding-on',
    title: 'Holding On',
    artist: 'Aria Vale',
    album: 'Daybreak',
    category: 'Music',
    type: 'song',
    duration: 196,
    bpm: 100,
    year: 2025,
    intro: 10,
    extro: 187,
    lastPlayed: 'Yesterday 18:47'
  },
  {
    id: 'sweeper-07',
    title: 'Sweeper 07 — Overnight',
    artist: ARTIST_IMAGING,
    category: 'Imaging',
    type: 'sweeper',
    duration: 7,
    intro: 0,
    extro: 6
  },
  {
    id: 'ad-car',
    title: 'Coast Motors — 30s',
    artist: ARTIST_ADS,
    category: 'Advertising',
    type: 'ad',
    duration: 30,
    intro: 1,
    extro: 29
  },
  {
    id: 'promo-breakfast',
    title: 'Promo — Breakfast Show',
    artist: ARTIST_IMAGING,
    category: 'Promo',
    type: 'promo',
    duration: 20,
    intro: 1,
    extro: 19
  }
]

const TRACK_BY_ID = new Map(TRACKS.map((track) => [track.id, track]))

const LOG_ORDER = [
  'id-nova',
  'morning-glow',
  'silver-lining',
  'hour-open',
  'neon-skyline',
  'little-victories',
  'ad-bank',
  'soft-focus',
  'news-9',
  'weather-watch',
  'cruise-control',
  'golden-hour',
  'sweeper-04',
  'paper-planes',
  'ad-coffee',
  'afterglow',
  'toh-jingle',
  'midnight-drive',
  'open-road',
  'promo-weekender',
  'static-bloom',
  'come-around',
  'ad-break',
  'honey-skies',
  'last-light'
]

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
