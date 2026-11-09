import type { ReactNode } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  label
}: {
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  label?: string
}): React.JSX.Element {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          data-active={option.value === value}
          aria-pressed={option.value === value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}
