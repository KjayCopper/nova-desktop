export const ROUTES = [
  'console',
  'library',
  'updates',
  'logs',
  'settings',
  'about'
] as const

export type Route = (typeof ROUTES)[number]

export const ROUTE_META: Record<Route, { title: string; subtitle: string }> = {
  console: {
    title: 'Console',
    subtitle: 'Live playlist, players and quick keys.'
  },
  library: {
    title: 'Library',
    subtitle: 'Search, cue and schedule media.'
  },
  updates: {
    title: 'Updates',
    subtitle: 'Releases delivered through GitHub.'
  },
  logs: {
    title: 'Activity',
    subtitle: 'Live diagnostics from the playout engine.'
  },
  settings: {
    title: 'Settings',
    subtitle: 'Appearance, startup and update behaviour.'
  },
  about: {
    title: 'About',
    subtitle: 'Versions, storage paths and links.'
  }
}

export function isRoute(value: unknown): value is Route {
  return typeof value === 'string' && (ROUTES as readonly string[]).includes(value)
}
