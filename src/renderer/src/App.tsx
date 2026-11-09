import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppSettings, ThemeMode } from '../../shared/types'
import { Logo } from './components/Logo'
import { Sidebar } from './components/Sidebar'
import { Toasts } from './components/Toasts'
import { TopBar } from './components/TopBar'
import { useDesktop } from './hooks/useDesktop'
import { useToasts } from './hooks/useToasts'
import type { AppActions } from './lib/actions'
import { errorMessage } from './lib/format'
import { isRoute, ROUTE_META, type Route } from './lib/routes'
import { watchTheme } from './lib/theme'
import { AboutPage } from './pages/AboutPage'
import { LogsPage } from './pages/LogsPage'
import { OverviewPage } from './pages/OverviewPage'
import { SettingsPage } from './pages/SettingsPage'
import { UpdatesPage } from './pages/UpdatesPage'

function readInitialRoute(): Route {
  const saved = localStorage.getItem('nova.route')
  return isRoute(saved) ? saved : 'overview'
}

function Splash({ message }: { message: string }) {
  return (
    <div className="splash">
      <div className="splash-inner">
        <Logo size={58} />
        <div className="splash-title">{message}</div>
        <div className="splash-bar">
          <span />
        </div>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="splash">
      <div className="error-card">
        <Logo size={46} />
        <h2>Nova could not start</h2>
        <p>{message}</p>
        <div className="button-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              void window.api?.app.openPath('logs')
            }}
          >
            Open logs
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const desktop = useDesktop()
  const { toasts, push, dismiss } = useToasts()
  const [route, setRoute] = useState<Route>(readInitialRoute)
  const previousPhase = useRef(desktop.update.phase)

  const {
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    patchSettings,
    resetSettings,
    settings,
    system,
    update,
    logs
  } = desktop

  useEffect(() => watchTheme(settings.theme), [settings.theme])

  useEffect(() => {
    localStorage.setItem('nova.route', route)
    document.title = `Nova · ${ROUTE_META[route].title}`
  }, [route])

  useEffect(() => {
    if (previousPhase.current === update.phase) return
    previousPhase.current = update.phase

    if (update.phase === 'available') {
      push({
        tone: 'info',
        title: 'Update available',
        message: `Nova ${update.latestVersion ?? ''} is ready to download.`
      })
    } else if (update.phase === 'downloaded') {
      push({
        tone: 'success',
        title: 'Update ready to install',
        message: 'Restart Nova to finish installing.'
      })
    } else if (update.phase === 'error') {
      push({
        tone: 'error',
        title: 'Update error',
        message: update.error ?? 'The update could not be completed.'
      })
    }
  }, [update.phase, update.latestVersion, update.error, push])

  const runCheck = useCallback(async () => {
    try {
      const state = await checkForUpdates()
      if (state.phase === 'not-available') {
        push({
          tone: 'success',
          title: 'You are up to date',
          message: `Nova ${state.currentVersion} is the latest build on the ${state.channel} channel.`
        })
      }
    } catch (error) {
      push({ tone: 'error', title: 'Update check failed', message: errorMessage(error) })
    }
  }, [checkForUpdates, push])

  const runDownload = useCallback(async () => {
    try {
      await downloadUpdate()
    } catch (error) {
      push({ tone: 'error', title: 'Download failed', message: errorMessage(error) })
    }
  }, [downloadUpdate, push])

  const runInstall = useCallback(async () => {
    try {
      const result = await installUpdate()
      if (result.simulated) {
        push({
          tone: 'info',
          title: 'Install simulated',
          message: 'A packaged build would quit and relaunch with the new version.'
        })
      }
    } catch (error) {
      push({ tone: 'error', title: 'Install failed', message: errorMessage(error) })
    }
  }, [installUpdate, push])

  const runSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      try {
        await patchSettings(patch)
      } catch (error) {
        push({
          tone: 'error',
          title: 'Could not save settings',
          message: errorMessage(error)
        })
      }
    },
    [patchSettings, push]
  )

  const runReset = useCallback(async () => {
    try {
      await resetSettings()
      push({ tone: 'success', title: 'Preferences reset' })
    } catch (error) {
      push({ tone: 'error', title: 'Reset failed', message: errorMessage(error) })
    }
  }, [resetSettings, push])

  const cycleTheme = useCallback(() => {
    const order: ThemeMode[] = ['system', 'light', 'dark']
    const next = order[(order.indexOf(settings.theme) + 1) % order.length]
    void runSettings({ theme: next })
  }, [runSettings, settings.theme])

  if (desktop.error) {
    return <ErrorScreen message={desktop.error} />
  }

  if (!desktop.ready || !system) {
    return <Splash message="Starting Nova…" />
  }

  const actions: AppActions = {
    navigate: setRoute,
    checkUpdates: () => {
      void runCheck()
    },
    downloadUpdate: () => {
      void runDownload()
    },
    installUpdate: () => {
      void runInstall()
    },
    updateSettings: (patch) => {
      void runSettings(patch)
    },
    resetSettings: () => {
      void runReset()
    },
    openPath: (kind) => {
      window.api.app.openPath(kind).catch((error: unknown) => {
        push({ tone: 'error', title: 'Could not open folder', message: errorMessage(error) })
      })
    },
    copy: (text) => {
      window.api.app
        .copyText(text)
        .then(() => push({ tone: 'success', title: 'Copied to clipboard' }))
        .catch((error: unknown) => {
          push({ tone: 'error', title: 'Copy failed', message: errorMessage(error) })
        })
    },
    quit: () => {
      void window.api.app.quit()
    }
  }

  return (
    <div className={`app-shell platform-${system.platform}`}>
      <Sidebar route={route} update={update} onNavigate={actions.navigate} />

      <div className="main">
        <TopBar
          route={route}
          update={update}
          theme={settings.theme}
          onOpenUpdates={() => actions.navigate('updates')}
          onCycleTheme={cycleTheme}
        />

        <main className="content" key={route}>
          <div className="content-inner">
            {route === 'overview' ? (
              <OverviewPage
                system={system}
                update={update}
                settings={settings}
                logs={logs}
                actions={actions}
              />
            ) : null}

            {route === 'updates' ? (
              <UpdatesPage update={update} settings={settings} actions={actions} />
            ) : null}

            {route === 'logs' ? <LogsPage logs={logs} actions={actions} /> : null}

            {route === 'settings' ? (
              <SettingsPage settings={settings} system={system} actions={actions} />
            ) : null}

            {route === 'about' ? (
              <AboutPage system={system} update={update} actions={actions} />
            ) : null}
          </div>
        </main>
      </div>

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
