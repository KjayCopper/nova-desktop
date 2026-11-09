import { app, Menu, nativeTheme } from 'electron'
import { join } from 'node:path'
import { IPC } from '../shared/ipc'
import { DEFAULT_SETTINGS, normalizeSettings } from '../shared/settings'
import type { AppSettings, SystemInfo } from '../shared/types'
import { registerIpc } from './ipc'
import { Logger, isBrokenPipeError } from './logger'
import { hardenNavigation, hardenSession } from './security'
import { JsonStore } from './store'
import { UpdaterService } from './updater'
import {
  applyThemeSource,
  createMainWindow,
  DEFAULT_WINDOW_STATE,
  focusMainWindow,
  getMainWindow,
  normalizeWindowState,
  updateWindowTheme,
  type WindowState
} from './window'

const APP_ID = 'com.novadesktop.app'
const startedAt = new Date().toISOString()

let logger: Logger | null = null
let settingsStore: JsonStore<AppSettings> | null = null
let windowStateStore: JsonStore<WindowState> | null = null
let updater: UpdaterService | null = null

const hasInstanceLock = app.requestSingleInstanceLock()

if (!hasInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => focusMainWindow())
  void app.whenReady().then(bootstrap)

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('activate', () => {
    if (!getMainWindow() && settingsStore && windowStateStore && logger) {
      createMainWindow({
        settings: settingsStore.get(),
        logger,
        state: windowStateStore
      })
    }
  })

  app.on('before-quit', () => {
    windowStateStore?.flush()
    settingsStore?.flush()
    updater?.dispose()
    logger?.info('app', 'Shutting down.')
    logger?.dispose()
  })
}

function bootstrap(): void {
  app.setAppUserModelId(APP_ID)
  hardenSession()
  hardenNavigation()

  logger = new Logger()
  const log = logger
  log.info(
    'app',
    `Nova ${app.getVersion()} starting (${app.isPackaged ? 'packaged' : 'development'}).`
  )

  settingsStore = new JsonStore<AppSettings>(
    join(app.getPath('userData'), 'settings.json'),
    DEFAULT_SETTINGS,
    (raw) => normalizeSettings(raw)
  )
  windowStateStore = new JsonStore<WindowState>(
    join(app.getPath('userData'), 'window-state.json'),
    DEFAULT_WINDOW_STATE,
    (raw, fallback) => normalizeWindowState(raw, fallback)
  )

  const settings = settingsStore.get()
  applyThemeSource(settings.theme)

  createMainWindow({ settings, logger: log, state: windowStateStore })

  updater = new UpdaterService({
    getSettings: () => normalizeSettings(settingsStore?.get() ?? DEFAULT_SETTINGS),
    log,
    send: (state) => {
      getMainWindow()?.webContents.send(IPC.updateStateEvent, state)
    },
    focusWindow: focusMainWindow
  })
  updater.init()

  const system: SystemInfo = {
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron,
    chromium: process.versions.chrome,
    node: process.versions.node,
    v8: process.versions.v8,
    platform: process.platform,
    arch: process.arch,
    packaged: app.isPackaged,
    simulatedUpdater: updater.isSimulated,
    userDataPath: app.getPath('userData'),
    logsPath: log.directory,
    exePath: process.execPath,
    startedAt
  }

  registerIpc({ settings: settingsStore, logger: log, updater, system })

  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin, args: ['--hidden'] })
  }

  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null)
  }

  nativeTheme.on('updated', () => updateWindowTheme())

  process.on('uncaughtException', (error) => {
    // A closed stdout pipe is expected when launched by a terminal that exits. Logging
    // it would recurse forever, so it is deliberately ignored.
    if (isBrokenPipeError(error)) return
    log.error('main', error)
  })
  process.on('unhandledRejection', (reason) => {
    log.error(
      'main',
      reason instanceof Error ? reason : new Error(`Unhandled rejection: ${String(reason)}`)
    )
  })
}
