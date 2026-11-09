export function ProgressBar({ percent }: { percent: number }): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
    >
      <div className="progress-fill" style={{ width: `${Math.max(clamped, 3)}%` }} />
    </div>
  )
}
