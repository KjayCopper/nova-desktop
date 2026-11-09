import { useCallback, useEffect, useRef, useState } from 'react'
import type { InstallResult } from '../../../shared/api'
import { DEFAULT_SETTINGS } from '../../../shared/settings'
import type {
  AppSettings,
  InitPayload,
  LogEntry,
  SystemInfo,
  UpdateState
} from '../../../shared/types'

const MAX_LOGS = 500

const INITIAL_UPDATE: UpdateState = {
  phase: 'idle',
  currentVersion: '0.0.0',
  channel: 'stable',
  simulated: false
}

export interface DesktopState {
  ready: boolean
  error: string | null
  settings: AppSettings
  system: SystemInfo | null
  update: UpdateState
  logs: LogEntry[]
  checkForUpdates: () => Promise<UpdateState>
  downloadUpdate: () => Promise<UpdateState>
  installUpdate: () => Promise<InstallResult>
  patchSettings: (patch: Partial<AppSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

export function useDesktop(): DesktopState {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [system, setSystem] = useState<SystemInfo | null>(null)
  const [update, setUpdate] = useState<UpdateState>(INITIAL_UPDATE)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    if (!window.api) {
      setError('The Electron bridge is unavailable. Start the app with "npm run dev".')
      return
    }

    const unsubscribeUpdate = window.api.updates.onState((state) => {
      if (mounted.current) setUpdate(state)
    })
    const unsubscribeLogs = window.api.logs.onEntry((entry) => {
      if (!mounted.current) return
      setLogs((previous) => [...previous.slice(-(MAX_LOGS - 1)), entry])
    })

    window.api
      .init()
      .then((payload: InitPayload) => {
        if (!mounted.current) return
        setSettings(payload.settings)
        setSystem(payload.system)
        setUpdate(payload.update)
        setLogs(payload.logs.slice(-MAX_LOGS))
        setReady(true)
      })
      .catch((cause: unknown) => {
        if (!mounted.current) return
        setError(cause instanceof Error ? cause.message : String(cause))
      })

    return () => {
      mounted.current = false
      unsubscribeUpdate()
      unsubscribeLogs()
    }
  }, [])

  const checkForUpdates = useCallback(async (): Promise<UpdateState> => {
    return window.api.updates.check()
  }, [])

  const downloadUpdate = useCallback(async (): Promise<UpdateState> => {
    return window.api.updates.download()
  }, [])

  const installUpdate = useCallback(async (): Promise<InstallResult> => {
    return window.api.updates.install()
  }, [])

  const patchSettings = useCallback(async (patch: Partial<AppSettings>): Promise<void> => {
    const next = await window.api.settings.set(patch)
    if (mounted.current) setSettings(next)
  }, [])

  const resetSettings = useCallback(async (): Promise<void> => {
    const next = await window.api.settings.reset()
    if (mounted.current) setSettings(next)
  }, [])

  return {
    ready,
    error,
    settings,
    system,
    update,
    logs,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    patchSettings,
    resetSettings
  }
}
