export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'
export type UpdateChannel = 'stable' | 'beta'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface AppSettings {
  theme: ThemeMode
  launchAtLogin: boolean
  startMinimized: boolean
  autoCheckUpdates: boolean
  autoDownloadUpdates: boolean
  /** Minutes between automatic checks. One of CHECK_INTERVALS. */
  checkIntervalMinutes: number
  channel: UpdateChannel
  notifyOnUpdate: boolean
}

export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateProgress {
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
}

export interface UpdateState {
  phase: UpdatePhase
  currentVersion: string
  latestVersion?: string
  releaseName?: string
  releaseNotes?: string
  releaseDate?: string
  progress?: UpdateProgress
  error?: string
  lastCheckedAt?: string
  channel: UpdateChannel
  /** True when running the built-in update simulator (development builds). */
  simulated: boolean
}

export interface LogEntry {
  id: number
  time: string
  level: LogLevel
  scope: string
  message: string
}

export interface SystemInfo {
  name: string
  version: string
  electron: string
  chromium: string
  node: string
  v8: string
  platform: string
  arch: string
  packaged: boolean
  simulatedUpdater: boolean
  userDataPath: string
  logsPath: string
  exePath: string
  startedAt: string
}

export interface InitPayload {
  settings: AppSettings
  system: SystemInfo
  update: UpdateState
  logs: LogEntry[]
}

export type OpenPathKind = 'userData' | 'logs' | 'exe'
