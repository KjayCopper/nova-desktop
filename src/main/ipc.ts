import { app, clipboard, ipcMain, shell } from 'electron'
import { IPC } from '../shared/ipc'
import { DEFAULT_SETTINGS, normalizeSettings } from '../shared/settings'
import type { AppSettings, InitPayload, OpenPathKind, SystemInfo } from '../shared/types'
import type { Logger } from './logger'
import type { JsonStore } from './store'
import type { UpdaterService } from './updater'
import { applyThemeSource, getMainWindow } from './window'

export interface IpcContext {
  settings: JsonStore<AppSettings>
  logger: Logger
  updater: UpdaterService
  system: SystemInfo
}

function isOpenPathKind(value: unknown): value is OpenPathKind {
  return value === 'userData' || value === 'logs' || value === 'exe'
}

export function registerIpc(context: IpcContext): void {
  const { settings, logger, updater } = context

  logger.subscribe((entry) => {
    getMainWindow()?.webContents.send(IPC.logEntryEvent, entry)
  })

  const applySettings = (next: AppSettings): AppSettings => {
    settings.replace(next)
    applyThemeSource(next.theme)
    updater.applySettings(next)
    if (app.isPackaged) {
      app.setLoginItemSettings({ openAtLogin: next.launchAtLogin, args: ['--hidden'] })
    }
    return next
  }

  ipcMain.handle(IPC.init, (): InitPayload => {
    return {
      settings: settings.get(),
      system: context.system,
      update: updater.getState(),
      logs: logger.recent()
    }
  })

  ipcMain.handle(IPC.appInfo, (): SystemInfo => context.system)

  ipcMain.handle(IPC.settingsSet, (_event, patch: unknown): AppSettings => {
    const safePatch =
      typeof patch === 'object' && patch !== null ? (patch as Partial<AppSettings>) : {}
    const next = applySettings(normalizeSettings({ ...settings.get(), ...safePatch }))
    logger.info('settings', 'Preferences updated.')
    return next
  })

  ipcMain.handle(IPC.settingsReset, (): AppSettings => {
    const next = applySettings(normalizeSettings(DEFAULT_SETTINGS))
    logger.info('settings', 'Preferences restored to defaults.')
    return next
  })

  ipcMain.handle(IPC.updateState, () => updater.getState())
  ipcMain.handle(IPC.updateCheck, () => updater.check())
  ipcMain.handle(IPC.updateDownload, () => updater.download())
  ipcMain.handle(IPC.updateInstall, () => updater.install())

  ipcMain.handle(IPC.openPath, async (_event, kind: unknown): Promise<void> => {
    if (!isOpenPathKind(kind)) throw new Error('Unknown path requested.')

    if (kind === 'exe') {
      shell.showItemInFolder(process.execPath)
      return
    }

    const target = kind === 'logs' ? logger.directory : app.getPath('userData')
    const error = await shell.openPath(target)
    if (error) throw new Error(error)
  })

  ipcMain.handle(IPC.copyText, (_event, text: unknown): void => {
    if (typeof text !== 'string') return
    clipboard.writeText(text.slice(0, 2_000_000))
  })

  ipcMain.handle(IPC.quit, (): void => {
    setImmediate(() => app.quit())
  })
}
