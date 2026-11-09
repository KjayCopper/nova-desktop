import { Box, ChevronRight, Clock, Monitor, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { intervalLabel } from '../../../shared/settings'
import type { AppSettings, LogEntry, SystemInfo, UpdateState } from '../../../shared/types'
import { Card } from '../components/Card'
import { Logo } from '../components/Logo'
import { LogRows } from '../components/LogRows'
import { PageHeader } from '../components/PageHeader'
import { Segmented } from '../components/Segmented'
import { StatusPill } from '../components/StatusPill'
import { Toggle } from '../components/Toggle'
import { useNow } from '../hooks/useNow'
import type { AppActions } from '../lib/actions'
import {
  formatDateTime,
  formatRelative,
  formatUptime,
  platformLabel
} from '../lib/format'

function Stat({
  icon,
  label,
  value,
  hint
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  hint: string
}) {
  return (
    <div className="stat">
      <div className="stat-head">
        <span className="stat-icon">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-hint">{hint}</div>
    </div>
  )
}

export function OverviewPage({
  system,
  update,
  settings,
  logs,
  actions
}: {
  system: SystemInfo
  update: UpdateState
  settings: AppSettings
  logs: LogEntry[]
  actions: AppActions
}) {
  const now = useNow()
  const uptime = formatUptime(now - new Date(system.startedAt).getTime())
  const recent = logs.slice(-7).reverse()
  const checking = update.phase === 'checking'
  const latest = update.latestVersion ?? update.currentVersion

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Runtime health and release status at a glance."
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={actions.checkUpdates}
            disabled={checking}
          >
            <RefreshCw size={15} className={checking ? 'spin' : undefined} />
            {checking ? 'Checking…' : 'Check for updates'}
          </button>
        }
      />

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">Self-updating desktop starter</div>
          <h2>Ship improvements without asking.</h2>
          <p>
            Nova checks GitHub Releases in the background, downloads signed builds, and applies
            them on restart. The whole update lifecycle runs inside a context-isolated,
            CSP-hardened Electron shell.
          </p>
          <div className="chips">
            <span className="chip">v{system.version}</span>
            <span className="chip">{settings.channel} channel</span>
            <span className="chip">Electron {system.electron}</span>
            {update.simulated ? <span className="chip chip-accent">simulation</span> : null}
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit-glow" />
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="orbit-core">
            <Logo size={46} />
          </div>
          <div className="orbit-chip">v{latest}</div>
        </div>
      </section>

      <div className="stats-grid">
        <Stat
          icon={<Box size={15} />}
          label="App version"
          value={`v${system.version}`}
          hint={system.packaged ? 'Installed build' : 'Development build'}
        />
        <Stat
          icon={<RefreshCw size={15} />}
          label="Update status"
          value={<StatusPill phase={update.phase} />}
          hint={
            update.lastCheckedAt ? `Checked ${formatRelative(update.lastCheckedAt)}` : 'Not checked yet'
          }
        />
        <Stat
          icon={<Clock size={15} />}
          label="Uptime"
          value={uptime}
          hint={`Since ${formatDateTime(system.startedAt)}`}
        />
        <Stat
          icon={<Monitor size={15} />}
          label="Platform"
          value={platformLabel(system.platform)}
          hint={`${system.arch} · Node ${system.node}`}
        />
      </div>

      <div className="grid-2">
        <Card
          title="Recent activity"
          subtitle="Streaming from the main process"
          action={
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => actions.navigate('logs')}
            >
              View all
              <ChevronRight size={14} />
            </button>
          }
        >
          <LogRows entries={recent} compact emptyLabel="No activity yet." />
        </Card>

        <Card title="Release channel" subtitle="How updates reach this device">
          <div className="setting-row">
            <div className="setting-copy">
              <div className="setting-title">Current channel</div>
              <div className="setting-desc">Stable is recommended. Beta receives prereleases.</div>
            </div>
            <Segmented
              value={settings.channel}
              label="Release channel"
              options={[
                { value: 'stable', label: 'Stable' },
                { value: 'beta', label: 'Beta' }
              ]}
              onChange={(channel) => actions.updateSettings({ channel })}
            />
          </div>

          <Toggle
            checked={settings.autoCheckUpdates}
            onChange={(autoCheckUpdates) => actions.updateSettings({ autoCheckUpdates })}
            label="Check automatically"
            description={`Background checks ${intervalLabel(settings.checkIntervalMinutes).toLowerCase()}.`}
          />

          <div className="card-foot">
            <span>
              {settings.autoCheckUpdates ? 'Automatic checks are on' : 'Automatic checks are off'}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => actions.navigate('updates')}
            >
              Update settings
              <ChevronRight size={14} />
            </button>
          </div>
        </Card>
      </div>
    </>
  )
}
