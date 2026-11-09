import { Monitor, Moon, Sun } from 'lucide-react'
import type { ThemeMode, UpdateState } from '../../../shared/types'
import { ROUTE_META, type Route } from '../lib/routes'
import { StatusPill } from './StatusPill'

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

export function TopBar({
  route,
  update,
  theme,
  onOpenUpdates,
  onCycleTheme
}: {
  route: Route
  update: UpdateState
  theme: ThemeMode
  onOpenUpdates: () => void
  onCycleTheme: () => void
}) {
  const Icon = THEME_ICON[theme]

  return (
    <header className="topbar">
      <div className="topbar-title">{ROUTE_META[route].title}</div>
      <div className="topbar-actions">
        <button
          type="button"
          className="pill-button"
          onClick={onOpenUpdates}
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
      </div>
    </header>
  )
}
