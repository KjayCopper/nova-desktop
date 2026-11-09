import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopApi, InstallResult } from '../shared/api'
import { IPC } from '../shared/ipc'
import type {
  AppSettings,
  InitPayload,
  LogEntry,
  OpenPathKind,
  SystemInfo,
  UpdateState
} from '../shared/types'

function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const wrapped = (_event: Electron.IpcRendererEvent, payload: T): void => listener(payload)
  ipcRenderer.on(channel, wrapped)
  return () => {
    ipcRenderer.removeListener(channel, wrapped)
  }
}

const api: DesktopApi = {
  init: () => ipcRenderer.invoke(IPC.init) as Promise<InitPayload>,
  settings: {
    set: (patch: Partial<AppSettings>) =>
      ipcRenderer.invoke(IPC.settingsSet, patch) as Promise<AppSettings>,
    reset: () => ipcRenderer.invoke(IPC.settingsReset) as Promise<AppSettings>
  },
  updates: {
    state: () => ipcRenderer.invoke(IPC.updateState) as Promise<UpdateState>,
    check: () => ipcRenderer.invoke(IPC.updateCheck) as Promise<UpdateState>,
    download: () => ipcRenderer.invoke(IPC.updateDownload) as Promise<UpdateState>,
    install: () => ipcRenderer.invoke(IPC.updateInstall) as Promise<InstallResult>,
    onState: (listener: (state: UpdateState) => void) =>
      subscribe<UpdateState>(IPC.updateStateEvent, listener)
  },
  logs: {
    onEntry: (listener: (entry: LogEntry) => void) =>
      subscribe<LogEntry>(IPC.logEntryEvent, listener)
  },
  app: {
    info: () => ipcRenderer.invoke(IPC.appInfo) as Promise<SystemInfo>,
    openPath: (kind: OpenPathKind) =>
      ipcRenderer.invoke(IPC.openPath, kind) as Promise<void>,
    copyText: (text: string) => ipcRenderer.invoke(IPC.copyText, text) as Promise<void>,
    quit: () => ipcRenderer.invoke(IPC.quit) as Promise<void>
  }
}

contextBridge.exposeInMainWorld('api', api)
