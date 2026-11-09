import type { UpdatePhase } from '../../../shared/types'

type Tone = 'neutral' | 'info' | 'accent' | 'success' | 'danger' | 'warning'

const PHASE_META: Record<UpdatePhase, { label: string; tone: Tone; live?: boolean }> = {
  idle: { label: 'Idle', tone: 'neutral' },
  checking: { label: 'Checking…', tone: 'info', live: true },
  available: { label: 'Update available', tone: 'accent' },
  'not-available': { label: 'Up to date', tone: 'success' },
  downloading: { label: 'Downloading', tone: 'info', live: true },
  downloaded: { label: 'Ready to install', tone: 'success' },
  error: { label: 'Update error', tone: 'danger' }
}

export function StatusPill({
  phase,
  className
}: {
  phase: UpdatePhase
  className?: string
}): React.JSX.Element {
  const meta = PHASE_META[phase]
  return (
    <span className={`pill tone-${meta.tone} ${className ?? ''}`}>
      <span className={`dot ${meta.live ? 'live' : ''}`} />
      {meta.label}
    </span>
  )
}
