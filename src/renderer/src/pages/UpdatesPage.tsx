import {
  ArrowDownToLine,
  CircleCheck,
  Download,
  LoaderCircle,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  TriangleAlert
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { AppSettings, UpdateState } from '../../../shared/types'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { ProgressBar } from '../components/ProgressBar'
import { ReleaseNotes } from '../components/ReleaseNotes'
import { UpdatePreferences } from '../components/UpdatePreferences'
import type { AppActions } from '../lib/actions'
import { formatBytes, formatRelative, formatSpeed } from '../lib/format'

interface StatusView {
  tone: string
  title: string
  detail: string
  icon: ReactNode
}

function statusView(update: UpdateState): StatusView {
  switch (update.phase) {
    case 'checking':
      return {
        tone: 'info',
        title: 'Checking for updates…',
        detail: 'Contacting GitHub Releases for the newest build.',
        icon: <LoaderCircle className="spin" size={26} />
      }
    case 'available':
      return {
        tone: 'accent',
        title: `Version ${update.latestVersion} is available`,
        detail: 'Download it now or keep working — Nova installs it on the next restart.',
        icon: <ArrowDownToLine size={26} />
      }
    case 'not-available':
      return {
        tone: 'success',
        title: 'You are up to date',
        detail: `Nova ${update.currentVersion} is the newest build on the ${update.channel} channel.`,
        icon: <CircleCheck size={26} />
      }
    case 'downloading':
      return {
        tone: 'info',
        title: 'Downloading the update…',
        detail: 'Keep the app open. The installer is verified before it is applied.',
        icon: <Download size={26} />
      }
    case 'downloaded':
      return {
        tone: 'success',
        title: `Version ${update.latestVersion} is ready`,
        detail: 'Restart to apply the update. Your settings and data stay in place.',
        icon: <Rocket size={26} />
      }
    case 'error':
      return {
        tone: 'danger',
        title: 'The update could not be completed',
        detail:
          update.error ?? 'Check the activity log for details, then try again.',
        icon: <TriangleAlert size={26} />
      }
    default:
      return {
        tone: 'neutral',
        title: 'Updates are ready when you are',
        detail:
          'Nova checks GitHub Releases for signed builds. You control when to download and install.',
        icon: <Sparkles size={26} />
      }
  }
}

function primaryAction(
  update: UpdateState,
  actions: AppActions
): { label: string; icon: ReactNode; onClick: () => void; disabled: boolean } {
  switch (update.phase) {
    case 'checking':
      return {
        label: 'Checking…',
        icon: <LoaderCircle size={15} className="spin" />,
        onClick: actions.checkUpdates,
        disabled: true
      }
    case 'available':
      return {
        label: 'Download update',
        icon: <Download size={15} />,
        onClick: actions.downloadUpdate,
        disabled: false
      }
    case 'downloading':
      return {
        label: `Downloading ${Math.round(update.progress?.percent ?? 0)}%`,
        icon: <LoaderCircle size={15} className="spin" />,
        onClick: () => undefined,
        disabled: true
      }
    case 'downloaded':
      return {
        label: 'Restart & install',
        icon: <Rocket size={15} />,
        onClick: actions.installUpdate,
        disabled: false
      }
    default:
      return {
        label: 'Check for updates',
        icon: <RefreshCw size={15} />,
        onClick: actions.checkUpdates,
        disabled: false
      }
  }
}

export function UpdatesPage({
  update,
  settings,
  actions
}: {
  update: UpdateState
  settings: AppSettings
  actions: AppActions
}) {
  const view = statusView(update)
  const primary = primaryAction(update, actions)
  const progress = update.progress
  const showProgress =
    (update.phase === 'downloading' || update.phase === 'downloaded') && progress !== undefined

  return (
    <>
      <PageHeader
        title="Updates"
        subtitle="Signed releases delivered through GitHub."
        actions={
          <button
            type="button"
            className="btn btn-ghost"
            onClick={actions.checkUpdates}
            disabled={update.phase === 'checking' || update.phase === 'downloading'}
          >
            <RefreshCw size={15} className={update.phase === 'checking' ? 'spin' : undefined} />
            Check now
          </button>
        }
      />

      <Card className="update-panel">
        <div className="update-head">
          <div className={`update-icon tone-${view.tone}`}>{view.icon}</div>
          <div className="update-copy">
            <div className="update-kicker">Update status</div>
            <h2>{view.title}</h2>
            <p>{view.detail}</p>
          </div>
          <div className="update-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={primary.onClick}
              disabled={primary.disabled}
            >
              {primary.icon}
              {primary.label}
            </button>
            {update.phase === 'available' ? (
              <button type="button" className="btn btn-ghost" onClick={actions.checkUpdates}>
                Check again
              </button>
            ) : null}
          </div>
        </div>

        {showProgress && progress ? (
          <div className="update-progress">
            <div className="progress-head">
              <span>
                {update.phase === 'downloaded'
                  ? 'Download complete'
                  : `Downloading ${progress.percent.toFixed(0)}%`}
              </span>
              <span>
                {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
                {update.phase === 'downloading' && progress.bytesPerSecond > 0
                  ? ` · ${formatSpeed(progress.bytesPerSecond)}`
                  : ''}
              </span>
            </div>
            <ProgressBar percent={progress.percent} />
          </div>
        ) : null}

        <div className="meta-grid">
          <div className="meta-cell">
            <div className="meta-label">Current</div>
            <div className="meta-value">v{update.currentVersion}</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">Latest</div>
            <div className="meta-value">{update.latestVersion ? `v${update.latestVersion}` : '—'}</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">Channel</div>
            <div className="meta-value capitalize">{update.channel}</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">Last checked</div>
            <div className="meta-value">{formatRelative(update.lastCheckedAt)}</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">Delivery</div>
            <div className="meta-value">GitHub Releases</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">Mode</div>
            <div className="meta-value">{update.simulated ? 'Simulator' : 'Live'}</div>
          </div>
        </div>
      </Card>

      <div className="grid-2">
        <Card
          title="Release notes"
          subtitle={update.releaseName ?? 'Latest release details'}
          action={
            update.releaseDate ? (
              <span className="pill tone-neutral">{formatRelative(update.releaseDate)}</span>
            ) : null
          }
        >
          {update.releaseNotes ? (
            <ReleaseNotes notes={update.releaseNotes} />
          ) : (
            <div className="empty">
              Release notes appear here as soon as an update is discovered.
            </div>
          )}
        </Card>

        <Card title="Preferences" subtitle="Applied immediately">
          <UpdatePreferences settings={settings} actions={actions} />
        </Card>
      </div>

      <Card
        title="Publishing an update"
        subtitle="From commit to installed app in a few minutes"
        action={
          <span className="pill tone-accent">
            <ShieldCheck size={13} />
            GitHub Releases
          </span>
        }
      >
        <ol className="steps">
          <li>
            <span>
              Point <code>publish.owner</code> and <code>publish.repo</code> in{' '}
              <code>electron-builder.yml</code> at your GitHub repository.
            </span>
          </li>
          <li>
            <span>
              Bump <code>version</code> in <code>package.json</code> — for example{' '}
              <code>0.1.1</code>.
            </span>
          </li>
          <li>
            <span>
              Create a GitHub token with repository access and expose it as{' '}
              <code>GH_TOKEN</code>.
            </span>
          </li>
          <li>
            <span>
              Run <code>npm run release</code>, or push a <code>v*</code> tag to let the bundled
              GitHub Actions workflow build and publish for you.
            </span>
          </li>
        </ol>
        <div className="hint-row">
          <ShieldCheck size={15} />
          <span>
            electron-builder uploads the installer, <code>latest.yml</code> and blockmaps.
            Installed apps discover it on their next check — no manual download links required.
          </span>
        </div>
      </Card>
    </>
  )
}
