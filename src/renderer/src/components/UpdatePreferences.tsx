import { CHECK_INTERVALS, intervalLabel } from '../../../shared/settings'
import type { AppSettings } from '../../../shared/types'
import type { AppActions } from '../lib/actions'
import { Segmented } from './Segmented'
import { Toggle } from './Toggle'

export function UpdatePreferences({
  settings,
  actions
}: {
  settings: AppSettings
  actions: AppActions
}) {
  return (
    <>
      <div className="setting-row">
        <div className="setting-copy">
          <div className="setting-title">Release channel</div>
          <div className="setting-desc">Beta builds may include unfinished features.</div>
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
        description="Look for new releases in the background."
      />

      <div className="setting-row">
        <div className="setting-copy">
          <div className="setting-title">Check interval</div>
          <div className="setting-desc">How often background checks run while open.</div>
        </div>
        <select
          className="select"
          aria-label="Check interval"
          value={settings.checkIntervalMinutes}
          disabled={!settings.autoCheckUpdates}
          onChange={(event) =>
            actions.updateSettings({ checkIntervalMinutes: Number(event.target.value) })
          }
        >
          {CHECK_INTERVALS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {intervalLabel(minutes)}
            </option>
          ))}
        </select>
      </div>

      <Toggle
        checked={settings.autoDownloadUpdates}
        onChange={(autoDownloadUpdates) => actions.updateSettings({ autoDownloadUpdates })}
        label="Download automatically"
        description="Fetch available updates without asking first."
      />

      <Toggle
        checked={settings.notifyOnUpdate}
        onChange={(notifyOnUpdate) => actions.updateSettings({ notifyOnUpdate })}
        label="Notify when ready"
        description="Show a desktop notification when an update is downloaded."
      />
    </>
  )
}
