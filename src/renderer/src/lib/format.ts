export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / 1024 ** exponent
  return `${value >= 100 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`
}

export function formatRelative(iso?: string): string {
  if (!iso) return 'Never'
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return 'Never'
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function formatTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? '--:--:--'
    : date.toLocaleTimeString(undefined, { hour12: false })
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
}

export function formatUptime(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return '0m'
  const totalMinutes = Math.floor(milliseconds / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function platformLabel(platform: string): string {
  if (platform === 'win32') return 'Windows'
  if (platform === 'darwin') return 'macOS'
  if (platform === 'linux') return 'Linux'
  return platform
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}
