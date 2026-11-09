import {
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  RefreshCw,
  ShieldCheck
} from 'lucide-react'
import type { SystemInfo, UpdateState } from '../../../shared/types'
import { Card } from '../components/Card'
import { Logo } from '../components/Logo'
import { PageHeader } from '../components/PageHeader'
import type { AppActions } from '../lib/actions'
import { formatRelative, platformLabel } from '../lib/format'

const REPO_URL = 'https://github.com/your-github-username/nova-desktop'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="kv-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function AboutPage({
  system,
  update,
  actions
}: {
  system: SystemInfo
  update: UpdateState
  actions: AppActions
}) {
  return (
    <>
      <PageHeader title="About" subtitle="Versions, storage paths and links." />

      <section className="about-hero card">
        <Logo size={62} />
        <div className="about-copy">
          <h2>Nova</h2>
          <p>
            A modern, self-updating desktop application built with Electron, React and
            TypeScript. Releases are signed, published to GitHub, and delivered in the
            background.
          </p>
          <div className="chips">
            <span className="chip">v{system.version}</span>
            <span className="chip">{system.packaged ? 'Installed build' : 'Development build'}</span>
            <span className="chip chip-accent">{update.channel} channel</span>
          </div>
        </div>
      </section>

      <div className="grid-2">
        <Card title="Runtime" subtitle="Bundled platform versions">
          <dl className="kv">
            <Row label="Application" value={`v${system.version}`} />
            <Row label="Electron" value={system.electron} />
            <Row label="Chromium" value={system.chromium} />
            <Row label="Node.js" value={system.node} />
            <Row label="V8" value={system.v8} />
            <Row
              label="Platform"
              value={`${platformLabel(system.platform)} (${system.arch})`}
            />
          </dl>
        </Card>

        <Card title="Update engine" subtitle="Delivery and channel state">
          <dl className="kv">
            <Row label="Channel" value={update.channel} />
            <Row label="Mode" value={update.simulated ? 'Simulator (development)' : 'Live'} />
            <Row label="Current version" value={`v${update.currentVersion}`} />
            <Row label="Latest version" value={update.latestVersion ? `v${update.latestVersion}` : '—'} />
            <Row label="Last checked" value={formatRelative(update.lastCheckedAt)} />
            <Row label="Provider" value="GitHub Releases" />
          </dl>
          <div className="card-foot">
            <span className="row-inline">
              <ShieldCheck size={14} />
              Signed update manifests
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={actions.checkUpdates}>
              <RefreshCw size={13} />
              Check now
            </button>
          </div>
        </Card>
      </div>

      <Card title="Resources" subtitle="Project links and local folders">
        <div className="button-row wrap">
          <a className="btn btn-ghost" href={REPO_URL} target="_blank" rel="noreferrer">
            <Globe size={15} />
            GitHub repository
            <ExternalLink size={13} />
          </a>
          <a className="btn btn-ghost" href={`${REPO_URL}/releases`} target="_blank" rel="noreferrer">
            <FileText size={15} />
            Releases
            <ExternalLink size={13} />
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => actions.openPath('logs')}>
            <FolderOpen size={15} />
            Open logs
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => actions.openPath('userData')}
          >
            <FolderOpen size={15} />
            Application data
          </button>
        </div>
        <p className="fine-print">
          Update the repository URL in <code>src/renderer/src/pages/AboutPage.tsx</code> and the
          publisher settings in <code>electron-builder.yml</code> before shipping.
        </p>
      </Card>

      <footer className="about-footer">
        <span>MIT licensed · © 2026 Nova</span>
        <span className="dot-sep" />
        <span>Built with Electron {system.electron}</span>
        <span className="dot-sep" />
        <span>Started {formatRelative(system.startedAt)}</span>
      </footer>
    </>
  )
}
