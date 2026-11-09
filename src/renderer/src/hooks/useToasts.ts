import { useCallback, useState } from 'react'

export type ToastTone = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: number
  tone: ToastTone
  title: string
  message?: string
}

let nextId = 0

export function useToasts(): {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
} {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = ++nextId
      setToasts((current) => [...current.slice(-3), { ...toast, id }])
      window.setTimeout(() => dismiss(id), 5400)
    },
    [dismiss]
  )

  return { toasts, push, dismiss }
}
