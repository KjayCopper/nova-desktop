import type { AppSettings, OpenPathKind } from '../../../shared/types'
import type { Route } from './routes'

export interface AppActions {
  navigate: (route: Route) => void
  checkUpdates: () => void
  downloadUpdate: () => void
  installUpdate: () => void
  updateSettings: (patch: Partial<AppSettings>) => void
  resetSettings: () => void
  openPath: (kind: OpenPathKind) => void
  copy: (text: string) => void
  quit: () => void
}
