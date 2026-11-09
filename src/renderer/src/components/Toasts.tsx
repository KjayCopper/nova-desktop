import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import type { Toast } from '../hooks/useToasts'

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: TriangleAlert
} as const

export function Toasts({
  toasts,
  onDismiss
}: {
  toasts: Toast[]
  onDismiss: (id: number) => void
}): React.JSX.Element | null {
  if (toasts.length === 0) return null

  return (
    <div className="toasts" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.tone]
        return (
          <div key={toast.id} className={`toast tone-${toast.tone}`} role="status">
            <div className="toast-icon">
              <Icon size={17} />
            </div>
            <div className="toast-body">
              <div className="toast-title">{toast.title}</div>
              {toast.message ? <div className="toast-msg">{toast.message}</div> : null}
            </div>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
