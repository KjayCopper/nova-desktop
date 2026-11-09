export const ROUTES = ['overview', 'updates', 'logs', 'settings', 'about'] as const

export type Route = (typeof ROUTES)[number]

export const ROUTE_META: Record<Route, { title: string; subtitle: string }> = {
  overview: {
    title: 'Overview',
    subtitle: 'Runtime health and release status at a glance.'
  },
  updates: {
    title: 'Updates',
    subtitle: 'Signed releases delivered through GitHub.'
  },
  logs: {
    title: 'Activity',
    subtitle: 'Live diagnostics streamed from the main process.'
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
