import { app, BrowserWindow, nativeTheme, screen, shell } from 'electron'
import { join } from 'node:path'
import type { ThemeMode } from '../shared/types'
import type { Logger } from './logger'
import type { JsonStore } from './store'

export interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
  maximized: boolean
}

export const DEFAULT_WINDOW_STATE: WindowState = {
  width: 1240,
  height: 820,
  maximized: false
}

export const TITLEBAR_HEIGHT = 44

const DARK_BACKGROUND = '#0a0c11'
const LIGHT_BACKGROUND = '#f5f7fb'
const DARK_SYMBOLS = '#aab3c5'
const LIGHT_SYMBOLS = '#3a4256'

let mainWindow: BrowserWindow | null = null
let saveTimer: NodeJS.Timeout | undefined
let stateStore: JsonStore<WindowState> | null = null
let logger: Logger | null = null

export function normalizeWindowState(raw: unknown, fallback: WindowState): WindowState {
  const input = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const num = (value: unknown, min: number, max: number, def: number): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return def
    return Math.min(max, Math.max(min, Math.round(value)))
  }
  return {
    width: num(input.width, 980, 6000, fallback.width),
    height: num(input.height, 640, 4000, fallback.height),
    x: typeof input.x === 'number' && Number.isFinite(input.x) ? Math.round(input.x) : undefined,
    y: typeof input.y === 'number' && Number.isFinite(input.y) ? Math.round(input.y) : undefined,
    maximized: input.maximized === true
  }
}

/** Keeps restored windows on a display that still exists. */
function resolveBounds(state: WindowState): { x?: number; y?: number; width: number; height: number } {
  const width = state.width
  const height = state.height
  if (typeof state.x !== 'number' || typeof state.y !== 'number') return { width, height }

  const rect = { x: state.x, y: state.y, width, height }
  const area = screen.getDisplayMatching(rect).workArea
  const overlaps =
    rect.x < area.x + area.width - 100 &&
    rect.x + rect.width > area.x + 100 &&
    rect.y < area.y + area.height - 100 &&
    rect.y + rect.height > area.y + 40

  return overlaps ? { x: state.x, y: state.y, width, height } : { width, height }
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
}

export function focusMainWindow(): void {
  const win = getMainWindow()
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

export function createMainWindow(options: {
  settings: { startMinimized: boolean }
  logger: Logger
  state: JsonStore<WindowState>
}): BrowserWindow {
  stateStore = options.state
  logger = options.logger

  const stored = options.state.get()
  const dark = nativeTheme.shouldUseDarkColors
  const isMac = process.platform === 'darwin'

  const win = new BrowserWindow({
    ...resolveBounds(stored),
    minWidth: 980,
    minHeight: 640,
    show: false,
    title: 'Nova',
    backgroundColor: dark ? DARK_BACKGROUND : LIGHT_BACKGROUND,
    icon: join(__dirname, '../../build/icon.png'),
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 16, y: 15 } }
      : {
          titleBarOverlay: {
            color: dark ? DARK_BACKGROUND : LIGHT_BACKGROUND,
            symbolColor: dark ? DARK_SYMBOLS : LIGHT_SYMBOLS,
            height: TITLEBAR_HEIGHT
          }
        }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
      spellcheck: false
    }
  })

  mainWindow = win

  if (stored.maximized) win.maximize()

  win.once('ready-to-show', () => {
    if (win.isDestroyed()) return
    win.show()
    if (options.settings.startMinimized || process.argv.includes('--hidden')) {
      win.minimize()
    }
  })

  const scheduleSave = (): void => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveNow, 400)
  }

  win.on('resize', scheduleSave)
  win.on('move', scheduleSave)
  win.on('maximize', scheduleSave)
  win.on('unmaximize', scheduleSave)
  win.on('close', saveNow)
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })

  if (!app.isPackaged) {
    win.webContents.on('before-input-event', (_event, input) => {
      if (input.type !== 'keyDown') return
      const isDevTools =
        input.key === 'F12' ||
        (input.control && input.shift && input.key.toLowerCase() === 'i')
      if (isDevTools && !win.isDestroyed()) win.webContents.toggleDevTools()
    })
  }

  const devUrl = process.env.ELECTRON_RENDERER_URL
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = devUrl ? url.startsWith(devUrl) : url.startsWith('file://')
    if (allowed) return
    event.preventDefault()
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
  })

  if (devUrl) {
    void win.loadURL(devUrl)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function saveNow(): void {
  const win = getMainWindow()
  if (!win || !stateStore) return
  if (win.isMinimized() || win.isFullScreen()) return
  const bounds = win.getNormalBounds()
  stateStore.replace({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    maximized: win.isMaximized()
  })
}

/** Recolors the native title bar controls to match the renderer theme. */
export function updateWindowTheme(): void {
  const win = getMainWindow()
  if (!win) return
  const dark = nativeTheme.shouldUseDarkColors
  win.setBackgroundColor(dark ? DARK_BACKGROUND : LIGHT_BACKGROUND)

  if (process.platform !== 'darwin') {
    try {
      win.setTitleBarOverlay({
        color: dark ? DARK_BACKGROUND : LIGHT_BACKGROUND,
        symbolColor: dark ? DARK_SYMBOLS : LIGHT_SYMBOLS,
        height: TITLEBAR_HEIGHT
      })
    } catch (error) {
      logger?.warn('window', `Unable to update title bar overlay: ${String(error)}`)
    }
  }
}

export function applyThemeSource(mode: ThemeMode): void {
  nativeTheme.themeSource = mode
  updateWindowTheme()
}
