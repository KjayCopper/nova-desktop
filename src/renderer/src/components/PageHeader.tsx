import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}): React.JSX.Element {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  )
}
