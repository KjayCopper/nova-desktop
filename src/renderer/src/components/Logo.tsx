export function Logo({ size = 32, className }: { size?: number; className?: string }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Nova"
    >
      <defs>
        <linearGradient id="nova-logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="52%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="62" height="62" rx="17" fill="url(#nova-logo-gradient)" />
      <rect
        x="1.75"
        y="1.75"
        width="60.5"
        height="60.5"
        rx="16.25"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.18"
      />
      <path
        d="M26 18.8c0-2.1 2.3-3.4 4.1-2.4l17.4 10.2c1.8 1 1.8 3.7 0 4.7L30.1 41.6c-1.8 1-4.1-.3-4.1-2.4V18.8Z"
        fill="#ffffff"
      />
      <circle cx="20.5" cy="45" r="2.6" fill="#ffffff" fillOpacity="0.72" />
    </svg>
  )
}
