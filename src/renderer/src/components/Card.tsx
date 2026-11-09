import type { ReactNode } from 'react'

export function Card({
  title,
  subtitle,
  action,
  children,
  className
}: {
  title?: ReactNode
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <section className={`card ${className ?? ''}`}>
      {title || action ? (
        <header className="card-head">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {action ? <div className="card-action">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}
