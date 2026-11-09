import type {
  AppSettings,
  InitPayload,
  LogEntry,
  OpenPathKind,
  SystemInfo,
  UpdateState
} from './types'

export interface InstallResult {
  /** True when the built-in simulator handled the request instead of a real installer. */
  simulated: boolean
}

export interface DesktopApi {
  init(): Promise<InitPayload>
  settings: {
    set(patch: Partial<AppSettings>): Promise<AppSettings>
    reset(): Promise<AppSettings>
  }
  updates: {
    state(): Promise<UpdateState>
    check(): Promise<UpdateState>
    download(): Promise<UpdateState>
    install(): Promise<InstallResult>
    onState(listener: (state: UpdateState) => void): () => void
  }
  logs: {
    onEntry(listener: (entry: LogEntry) => void): () => void
  }
  app: {
    info(): Promise<SystemInfo>
    openPath(kind: OpenPathKind): Promise<void>
    copyText(text: string): Promise<void>
    quit(): Promise<void>
  }
}
