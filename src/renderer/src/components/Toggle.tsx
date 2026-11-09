export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}): React.JSX.Element {
  return (
    <div className="setting-row">
      <div className="setting-copy">
        <div className="setting-title">{label}</div>
        {description ? <div className="setting-desc">{description}</div> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="switch"
        data-on={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-knob" />
      </button>
    </div>
  )
}
