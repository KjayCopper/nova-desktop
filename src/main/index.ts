import { app, BrowserWindow, Menu, nativeTheme } from 'electron'
import { join } from 'node:path'
import { IPC } from '../shared/ipc'
import { DEFAULT_SETTINGS, normalizeSettings } from '../shared/settings'
import type { AppSettings, SystemInfo } from '../shared/types'
import { registerIpc } from './ipc'
import { Logger, isBrokenPipeError } from './logger'
import { configurePaths } from './paths'
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

configurePaths()

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

  // Discord-style splash while the main window is being prepared.
  let splash: BrowserWindow | null = null
  if (app.isPackaged) {
    splash = new BrowserWindow({
      width: 360,
      height: 220,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      center: true,
      resizable: false,
      movable: false,
      skipTaskbar: true,
      show: true,
      backgroundColor: '#00000000',
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })
    splash.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(`<!doctype html><html><head><meta charset="utf-8"><style>
          html,body{margin:0;padding:0;background:transparent;height:100%;font-family:Segoe UI,system-ui,sans-serif;color:#e6edf5;overflow:hidden}
          .wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
            background:radial-gradient(120% 120% at 50% 0%,#1a2433 0%,#0a0f18 60%,#05070c 100%);
            border-radius:12px;border:1px solid rgba(255,255,255,0.06)}
          .logo{font-size:26px;font-weight:700;letter-spacing:0.18em;color:#7dd3fc}
          .sub{font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b7a90}
          .bar{width:180px;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden}
          .bar span{display:block;height:100%;width:30%;background:linear-gradient(90deg,#38bdf8,#7dd3fc);animation:slide 1.2s ease-in-out infinite}
          @keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}
        </style></head><body><div class="wrap"><div class="logo">NOVA</div><div class="sub">Starting up</div><div class="bar"><span></span></div></div></body></html>`)
    )
  }

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

  if (splash) {
    // Close splash shortly after the main window is shown.
    setTimeout(() => { try { splash?.close() } catch {} }, 600)
  }

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
