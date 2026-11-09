export const IPC = {
  init: 'app:init',
  appInfo: 'app:info',
  openPath: 'app:open-path',
  copyText: 'app:copy-text',
  quit: 'app:quit',

  settingsSet: 'settings:set',
  settingsReset: 'settings:reset',

  updateState: 'updates:state',
  updateCheck: 'updates:check',
  updateDownload: 'updates:download',
  updateInstall: 'updates:install',

  updateStateEvent: 'updates:state-changed',
  logEntryEvent: 'logs:entry'
} as const
