import type { AppSettings, ThemeMode, UpdateChannel } from './types'

export const CHECK_INTERVALS = [15, 30, 60, 120, 240, 480] as const

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  launchAtLogin: false,
  startMinimized: false,
  autoCheckUpdates: true,
  autoDownloadUpdates: false,
  checkIntervalMinutes: 60,
  channel: 'stable',
  notifyOnUpdate: true
}

const THEMES: readonly ThemeMode[] = ['system', 'light', 'dark']
const CHANNELS: readonly UpdateChannel[] = ['stable', 'beta']

export function isCheckInterval(value: unknown): value is number {
  return typeof value === 'number' && (CHECK_INTERVALS as readonly number[]).includes(value)
}

/**
 * Coerces arbitrary persisted/user input into a valid settings object.
 * Unknown keys are dropped and invalid values fall back to defaults.
 */
export function normalizeSettings(input: unknown): AppSettings {
  const raw = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const pick = <K extends keyof AppSettings>(key: K, valid: (value: unknown) => boolean): AppSettings[K] => {
    const value = raw[key as string]
    return valid(value) ? (value as AppSettings[K]) : DEFAULT_SETTINGS[key]
  }
  const bool = (value: unknown): boolean => typeof value === 'boolean'

  return {
    theme: pick('theme', (value) => THEMES.includes(value as ThemeMode)),
    launchAtLogin: pick('launchAtLogin', bool),
    startMinimized: pick('startMinimized', bool),
    autoCheckUpdates: pick('autoCheckUpdates', bool),
    autoDownloadUpdates: pick('autoDownloadUpdates', bool),
    checkIntervalMinutes: pick('checkIntervalMinutes', isCheckInterval),
    channel: pick('channel', (value) => CHANNELS.includes(value as UpdateChannel)),
    notifyOnUpdate: pick('notifyOnUpdate', bool)
  }
}

export function intervalLabel(minutes: number): string {
  if (minutes < 60) return `Every ${minutes} minutes`
  if (minutes === 60) return 'Every hour'
  if (minutes === 120) return 'Every 2 hours'
  if (minutes === 240) return 'Every 4 hours'
  if (minutes === 480) return 'Every 8 hours'
  return `Every ${Math.round(minutes / 60)} hours`
}
