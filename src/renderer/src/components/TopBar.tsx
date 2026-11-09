import {
  Activity,
  Info,
  Library,
  Monitor,
  Moon,
  Radio,
  RefreshCw,
  Settings2,
  Sun
} from 'lucide-react'
import type { ThemeMode, UpdateState } from '../../../shared/types'
import type { PlayoutController } from '../hooks/usePlayout'
import { useNow } from '../hooks/useNow'
import { formatClock, formatDateLong } from '../lib/format'
import type { Route } from '../lib/routes'
import { Logo } from './Logo'
import { StatusPill } from './StatusPill'

const MODULES = [
  { route: 'console', label: 'Console', icon: Radio },
  { route: 'library', label: 'Library', icon: Library },
  { route: 'updates', label: 'Updates', icon: RefreshCw },
  { route: 'logs', label: 'Activity', icon: Activity },
  { route: 'settings', label: 'Settings', icon: Settings2 }
] as const

const THEME_ICON = {
  system: Monitor,
  light: Sun,
  dark: Moon
} as const

const THEME_LABEL: Record<ThemeMode, string> = {
  system: 'Theme: follow system',
  light: 'Theme: light',
  dark: 'Theme: dark'
}

const AIR_LABEL = {
  playing: 'On air',
  paused: 'Paused',
  stopped: 'Off air'
} as const

export function TopBar({
  route,
  update,
  theme,
  playout,
  onNavigate,
  onCycleTheme
}: {
  route: Route
  update: UpdateState
  theme: ThemeMode
  playout: PlayoutController
  onNavigate: (route: Route) => void
  onCycleTheme: () => void
}) {
  const Icon = THEME_ICON[theme]
  const now = useNow(1000)
  const updateReady = update.phase === 'available' || update.phase === 'downloaded'

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <Logo size={26} />
        <span className="wordmark">Nova</span>
        <span className="wordmark-band">FM</span>
      </div>

      <nav className="module-nav" aria-label="Modules">
        {MODULES.map((item) => {
          const ModuleIcon = item.icon
          return (
            <button
              key={item.route}
              type="button"
              className="module-tab"
              data-active={route === item.route}
              aria-current={route === item.route ? 'page' : undefined}
              onClick={() => onNavigate(item.route)}
            >
              <ModuleIcon size={16} strokeWidth={1.9} />
              <span className="module-label">{item.label}</span>
              {item.route === 'updates' && updateReady ? <span className="module-dot" /> : null}
            </button>
          )
        })}
      </nav>

      <div className="air-block" data-state={playout.transport}>
        <span className="air-dot" />
        <div className="air-copy">
          <span className="air-state">{AIR_LABEL[playout.transport]}</span>
          <span className="air-track">
            {playout.current
              ? `${playout.current.title} · ${playout.current.artist}`
              : 'Nothing cued'}
          </span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-clock">
          <span className="clock-time mono">{formatClock(now)}</span>
          <span className="clock-date">{formatDateLong(new Date(now))}</span>
        </div>

        <button
          type="button"
          className="pill-button"
          onClick={() => onNavigate('updates')}
          title="Open update status"
        >
          <StatusPill phase={update.phase} />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={onCycleTheme}
          title={THEME_LABEL[theme]}
          aria-label={THEME_LABEL[theme]}
        >
          <Icon size={16} />
        </button>

        <button
          type="button"
          className="icon-btn"
          data-active={route === 'about'}
          onClick={() => onNavigate('about')}
          title="About Nova"
          aria-label="About Nova"
        >
          <Info size={16} />
        </button>
      </div>
    </header>
  )
}
