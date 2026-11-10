import { app, Notification } from 'electron'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater'
import type { AppSettings, UpdateChannel, UpdateState } from '../shared/types'
import type { Logger } from './logger'

export interface UpdaterDeps {
  getSettings: () => AppSettings
  log: Logger
  send: (state: UpdateState) => void
  focusWindow: () => void
}

function bumpVersion(version: string, channel: UpdateChannel): string {
  const [major = 0, minor = 0] = version.split('-')[0]?.split('.').map(Number) ?? []
  return channel === 'beta' ? `${major}.${minor + 1}.0-beta.1` : `${major}.${minor + 1}.0`
}

function releaseNotesToString(info: UpdateInfo): string | undefined {
  const notes = info.releaseNotes
  if (!notes) return undefined
  if (typeof notes === 'string') return notes
  return notes
    .map((item) => item.note ?? '')
    .filter(Boolean)
    .join('\n\n')
}

/**
 * Owns the update lifecycle and exposes a single serializable state to the UI.
 *
 * In development (or with NOVA_UPDATE_SIM=1) a deterministic simulator drives the
 * same state machine so the whole UX can be exercised without publishing a release.
 */
export class UpdaterService {
  readonly isSimulated: boolean

  private state: UpdateState
  private autoTimer: NodeJS.Timeout | undefined
  private readonly timers = new Set<NodeJS.Timeout>()
  private disposed = false

  constructor(private readonly deps: UpdaterDeps) {
    this.isSimulated = !app.isPackaged || process.env.NOVA_UPDATE_SIM === '1'
    this.state = {
      phase: 'idle',
      currentVersion: app.getVersion(),
      channel: deps.getSettings().channel,
      simulated: this.isSimulated
    }
  }

  init(): void {
    this.configureUpdater()
    this.wireEvents()
    this.scheduleAutoCheck()

    this.deps.log.info(
      'updater',
      this.isSimulated
        ? 'Update engine running in simulation mode (development build).'
        : `Update engine ready — channel "${this.state.channel}".`
    )

    // Give the UI time to settle before the first background check.
    if (app.isPackaged) {
      this.later(() => {
        if (!this.isBusy()) void this.check()
      }, 20_000)
    }
  }

  getState(): UpdateState {
    return { ...this.state }
  }

  async check(): Promise<UpdateState> {
    if (this.isBusy()) return this.getState()

    this.clearTimers()
    this.setState({
      phase: 'checking',
      error: undefined,
      progress: undefined,
      lastCheckedAt: new Date().toISOString()
    })

    if (this.isSimulated) {
      this.runSimulatedCheck()
      return this.getState()
    }

    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      this.fail(error)
    }
    return this.getState()
  }

  async download(): Promise<UpdateState> {
    if (this.state.phase === 'downloading') return this.getState()
    if (!this.isSimulated && this.state.phase !== 'available') return this.getState()

    this.clearTimers()
    this.setState({
      phase: 'downloading',
      error: undefined,
      progress: { percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 }
    })

    if (this.isSimulated) {
      this.runSimulatedDownload()
      return this.getState()
    }

    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      this.fail(error)
    }
    return this.getState()
  }

  async install(): Promise<{ simulated: boolean }> {
    if (this.state.phase !== 'downloaded') {
      throw new Error('No downloaded update is ready to install.')
    }

    if (this.isSimulated) {
      this.deps.log.info(
        'updater',
        `[simulation] Install requested for ${this.state.latestVersion ?? 'update'} — a packaged build would quit and relaunch now.`
      )
      return { simulated: true }
    }

    this.deps.log.info(
      'updater',
      `Installing ${this.state.latestVersion ?? 'update'} and restarting the application.`
    )
    setImmediate(() => autoUpdater.quitAndInstall(true, true))
    return { simulated: false }
  }

  applySettings(settings: AppSettings): void {
    const channelChanged = this.state.channel !== settings.channel
    this.setState({ channel: settings.channel })

    if (channelChanged && this.state.phase !== 'downloading' && this.state.phase !== 'downloaded') {
      this.clearTimers()
      this.setState({
        phase: 'idle',
        latestVersion: undefined,
        releaseName: undefined,
        releaseNotes: undefined,
        progress: undefined,
        error: undefined
      })
    }

    this.configureUpdater()
    this.scheduleAutoCheck()
  }

  dispose(): void {
    this.disposed = true
    if (this.autoTimer) clearInterval(this.autoTimer)
    this.autoTimer = undefined
    this.clearTimers()
  }

  private isBusy(): boolean {
    return this.state.phase === 'checking' || this.state.phase === 'downloading'
  }

  private configureUpdater(): void {
    const { channel } = this.deps.getSettings()
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.allowDowngrade = false
    autoUpdater.allowPrerelease = channel === 'beta'
    autoUpdater.channel = channel === 'beta' ? 'beta' : 'latest'
    autoUpdater.logger = {
      info: (message?: unknown) => this.deps.log.debug('updater:lib', String(message ?? '')),
      warn: (message?: unknown) => this.deps.log.warn('updater:lib', String(message ?? '')),
      error: (message?: unknown) => this.deps.log.error('updater:lib', String(message ?? '')),
      debug: (message?: unknown) => this.deps.log.debug('updater:lib', String(message ?? ''))
    }

    // Keep update downloads inside the app's own data folder instead of
    // %LOCALAPPDATA%, so nothing is left on the system drive.
    try {
      const cacheBase = join(app.getPath('userData'), 'updates')
      mkdirSync(cacheBase, { recursive: true })
      Object.defineProperty((autoUpdater as unknown as { app: unknown }).app, 'baseCachePath', {
        get: () => cacheBase,
        configurable: true
      })
    } catch (error) {
      this.deps.log.warn('updater', `Could not relocate update cache: ${String(error)}`)
    }
  }

  private wireEvents(): void {
    autoUpdater.on('checking-for-update', () => {
      this.setState({ phase: 'checking', error: undefined })
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.setState({
        phase: 'available',
        latestVersion: info.version,
        releaseName: info.releaseName ?? `Nova ${info.version}`,
        releaseNotes: releaseNotesToString(info),
        releaseDate: info.releaseDate,
        progress: undefined,
        error: undefined
      })
      this.deps.log.info('updater', `Update ${info.version} is available.`)

      if (this.deps.getSettings().autoDownloadUpdates) {
        this.later(() => {
          if (this.state.phase === 'available') void this.download()
        }, 900)
      }
    })

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      this.setState({
        phase: 'not-available',
        latestVersion: info.version,
        progress: undefined
      })
      this.deps.log.info('updater', `No update available (latest is ${info.version}).`)
    })

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.setState({
        phase: 'downloading',
        progress: {
          percent: Math.round(progress.percent * 10) / 10,
          transferred: progress.transferred,
          total: progress.total,
          bytesPerSecond: progress.bytesPerSecond
        }
      })
    })

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.setState({
        phase: 'downloaded',
        latestVersion: info.version,
        releaseName: info.releaseName ?? `Nova ${info.version}`,
        releaseNotes: releaseNotesToString(info),
        releaseDate: info.releaseDate,
        progress: {
          percent: 100,
          transferred: this.state.progress?.total ?? 0,
          total: this.state.progress?.total ?? 0,
          bytesPerSecond: 0
        }
      })
      this.deps.log.info('updater', `Update ${info.version} downloaded and ready to install.`)
      this.notifyDownloaded()
    })

    autoUpdater.on('error', (error: Error) => {
      this.fail(error)
    })
  }

  private runSimulatedCheck(): void {
    this.deps.log.info('updater', `[simulation] Checking GitHub Releases (${this.state.channel})…`)

    this.later(() => {
      if (this.disposed) return
      const latest = bumpVersion(this.state.currentVersion, this.deps.getSettings().channel)
      const isBeta = this.deps.getSettings().channel === 'beta'

      this.setState({
        phase: 'available',
        latestVersion: latest,
        releaseName: `Nova ${latest}`,
        releaseDate: new Date().toISOString(),
        releaseNotes: [
          `## Nova ${latest}`,
          '',
          isBeta
            ? 'This is a simulated **beta** build channel check.'
            : 'This is a simulated **stable** channel check.',
          '',
          '### Highlights',
          '',
          '- Faster startup and a smoother first paint',
          '- New update controls with download progress',
          '- Reliability fixes for background update checks',
          '',
          '> Simulation mode: nothing is downloaded until you click the button, and nothing is installed.'
        ].join('\n')
      })
      this.deps.log.info('updater', `[simulation] Update ${latest} is available.`)

      if (this.deps.getSettings().autoDownloadUpdates) {
        this.later(() => {
          if (this.state.phase === 'available') void this.download()
        }, 1000)
      }
    }, 1200)
  }

  private runSimulatedDownload(): void {
    const total = 82_600_000
    let transferred = 0
    let lastTick = Date.now()

    this.deps.log.info('updater', '[simulation] Downloading update…')

    const interval = setInterval(() => {
      if (this.disposed || this.state.phase !== 'downloading') {
        clearInterval(interval)
        this.timers.delete(interval)
        return
      }

      const now = Date.now()
      const elapsed = Math.max(1, now - lastTick)
      const step = total * (0.025 + Math.random() * 0.055)
      transferred = Math.min(total, transferred + step)
      lastTick = now

      this.setState({
        progress: {
          percent: Math.min(100, Math.round((transferred / total) * 1000) / 10),
          transferred,
          total,
          bytesPerSecond: Math.round(step / (elapsed / 1000))
        }
      })

      if (transferred >= total) {
        clearInterval(interval)
        this.timers.delete(interval)
        this.setState({
          phase: 'downloaded',
          progress: { percent: 100, transferred: total, total, bytesPerSecond: 0 }
        })
        this.deps.log.info(
          'updater',
          `[simulation] Update ${this.state.latestVersion ?? ''} downloaded.`
        )
        this.notifyDownloaded()
      }
    }, 260)

    this.timers.add(interval)
  }

  private notifyDownloaded(): void {
    if (!this.deps.getSettings().notifyOnUpdate) return
    try {
      if (!Notification.isSupported()) return
      const notification = new Notification({
        title: 'Update ready to install',
        body: `Nova ${this.state.latestVersion ?? ''} has been downloaded. Restart to finish installing.`
      })
      notification.on('click', () => this.deps.focusWindow())
      notification.show()
    } catch (error) {
      this.deps.log.warn('updater', `Unable to show notification: ${String(error)}`)
    }
  }

  private scheduleAutoCheck(): void {
    if (this.autoTimer) clearInterval(this.autoTimer)
    this.autoTimer = undefined

    const settings = this.deps.getSettings()
    if (!settings.autoCheckUpdates) return

    const intervalMs = Math.max(5, settings.checkIntervalMinutes) * 60_000
    this.autoTimer = setInterval(() => {
      if (!this.isBusy()) void this.check()
    }, intervalMs)
    this.autoTimer.unref?.()
  }

  private setState(patch: Partial<UpdateState>): void {
    if (this.disposed) return
    this.state = { ...this.state, ...patch }
    this.deps.send(this.getState())
  }

  private fail(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    this.setState({ phase: 'error', error: message, progress: undefined })
    this.deps.log.error('updater', error)
  }

  private later(fn: () => void, ms: number): void {
    const handle = setTimeout(() => {
      this.timers.delete(handle)
      fn()
    }, ms)
    this.timers.add(handle)
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer)
    this.timers.clear()
  }
}
