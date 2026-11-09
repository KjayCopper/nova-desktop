import {
  Copy,
  FolderOpen,
  HardDrive,
  Monitor,
  Moon,
  Power,
  RotateCcw,
  Sun
} from 'lucide-react'
import type { AppSettings, SystemInfo } from '../../../shared/types'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { Segmented } from '../components/Segmented'
import { Toggle } from '../components/Toggle'
import { UpdatePreferences } from '../components/UpdatePreferences'
import type { AppActions } from '../lib/actions'
import { platformLabel } from '../lib/format'

function PathRow({
  title,
  value,
  onCopy,
  onOpen,
  openLabel = 'Open'
}: {
  title: string
  value: string
  onCopy: () => void
  onOpen: () => void
  openLabel?: string
}) {
  return (
    <div className="path-row">
      <div className="path-copy">
        <div className="setting-title">{title}</div>
        <div className="path mono" title={value}>
          {value}
        </div>
      </div>
      <div className="row-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCopy}>
          <Copy size={13} />
          Copy
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onOpen}>
          <FolderOpen size={13} />
          {openLabel}
        </button>
      </div>
    </div>
  )
}

export function SettingsPage({
  settings,
  system,
  actions
}: {
  settings: AppSettings
  system: SystemInfo
  actions: AppActions
}) {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Changes are saved instantly."
        actions={<span className="pill tone-success">Auto-saved</span>}
      />

      <div className="grid-2">
        <div className="stack">
          <Card title="Appearance" subtitle="Light, dark, or match the operating system">
            <div className="setting-row">
              <div className="setting-copy">
                <div className="setting-title">Theme</div>
                <div className="setting-desc">Applies to the interface and native title bar.</div>
              </div>
              <Segmented
                value={settings.theme}
                label="Theme"
                options={[
                  { value: 'system', label: 'System', icon: <Monitor size={13} /> },
                  { value: 'light', label: 'Light', icon: <Sun size={13} /> },
                  { value: 'dark', label: 'Dark', icon: <Moon size={13} /> }
                ]}
                onChange={(theme) => actions.updateSettings({ theme })}
              />
            </div>
          </Card>

          <Card title="Startup" subtitle="How Nova behaves when Windows starts">
            <Toggle
              checked={settings.launchAtLogin}
              onChange={(launchAtLogin) => actions.updateSettings({ launchAtLogin })}
              label="Launch at sign-in"
              description="Start Nova automatically when you sign in to your computer."
            />
            <Toggle
              checked={settings.startMinimized}
              onChange={(startMinimized) => actions.updateSettings({ startMinimized })}
              label="Start minimized"
              description="Open quietly in the taskbar instead of on screen."
            />
          </Card>
        </div>

        <div className="stack">
          <Card title="Updates" subtitle="Background checks and delivery">
            <UpdatePreferences settings={settings} actions={actions} />
          </Card>

          <Card title="Storage" subtitle={`${platformLabel(system.platform)} · ${system.arch}`}>
            <PathRow
              title="Application data"
              value={system.userDataPath}
              onCopy={() => actions.copy(system.userDataPath)}
              onOpen={() => actions.openPath('userData')}
            />
            <PathRow
              title="Logs"
              value={system.logsPath}
              onCopy={() => actions.copy(system.logsPath)}
              onOpen={() => actions.openPath('logs')}
            />
            <PathRow
              title="Executable"
              value={system.exePath}
              onCopy={() => actions.copy(system.exePath)}
              onOpen={() => actions.openPath('exe')}
              openLabel="Reveal"
            />
          </Card>
        </div>
      </div>

      <Card
        title="Advanced"
        subtitle="Resetting restores every preference to its default value"
        action={
          <span className="pill tone-neutral">
            <HardDrive size={13} />
            Local only
          </span>
        }
      >
        <div className="row-actions spread">
          <div className="button-row">
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm('Reset all preferences to their defaults?')) {
                  actions.resetSettings()
                }
              }}
            >
              <RotateCcw size={15} />
              Reset preferences
            </button>
            <button type="button" className="btn btn-ghost" onClick={actions.quit}>
              <Power size={15} />
              Quit Nova
            </button>
          </div>
          <span className="fine-print">Nothing is uploaded anywhere.</span>
        </div>
      </Card>
    </>
  )
}
