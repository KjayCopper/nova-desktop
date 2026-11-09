import {
  ChevronRight,
  Info,
  LayoutDashboard,
  RefreshCw,
  ScrollText,
  Settings2,
  Sparkles
} from 'lucide-react'
import type { UpdateState } from '../../../shared/types'
import type { Route } from '../lib/routes'
import { Logo } from './Logo'

const NAV = [
  { route: 'overview', label: 'Overview', icon: LayoutDashboard },
  { route: 'updates', label: 'Updates', icon: RefreshCw },
  { route: 'logs', label: 'Activity', icon: ScrollText },
  { route: 'settings', label: 'Settings', icon: Settings2 },
  { route: 'about', label: 'About', icon: Info }
] as const

export function Sidebar({
  route,
  update,
  onNavigate
}: {
  route: Route
  update: UpdateState
  onNavigate: (route: Route) => void
}) {
  const updateReady = update.phase === 'available' || update.phase === 'downloaded'

  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo size={30} />
        <div className="brand-text">
          <span className="brand-name">Nova</span>
          <span className="brand-tag">Desktop</span>
        </div>
      </div>

      <nav className="nav" aria-label="Primary">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = route === item.route
          return (
            <button
              key={item.route}
              type="button"
              className="nav-item"
              data-active={active}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(item.route)}
            >
              <Icon size={17} strokeWidth={1.9} />
              <span className="nav-label">{item.label}</span>
              {item.route === 'updates' && updateReady ? <span className="nav-badge" /> : null}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        {updateReady ? (
          <button type="button" className="update-nudge" onClick={() => onNavigate('updates')}>
            <Sparkles size={15} />
            <span>{update.phase === 'downloaded' ? 'Restart to update' : 'Update available'}</span>
            <ChevronRight size={14} />
          </button>
        ) : null}

        <div className="side-meta">
          <span>v{update.currentVersion}</span>
          <span className="dot-sep" />
          <span className="capitalize">{update.channel}</span>
          {update.simulated ? (
            <>
              <span className="dot-sep" />
              <span className="sim-tag">sim</span>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
