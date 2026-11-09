import type { ThemeMode } from '../../../shared/types'

/** Applies the selected theme immediately and keeps "system" in sync with the OS. */
export function watchTheme(mode: ThemeMode): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  const apply = (): void => {
    const resolved = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode
    const root = document.documentElement
    root.dataset.theme = resolved
    root.style.colorScheme = resolved
  }

  apply()
  media.addEventListener('change', apply)
  return () => media.removeEventListener('change', apply)
}
