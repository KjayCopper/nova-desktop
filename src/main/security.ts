import { app, session, shell } from 'electron'

const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join('; ')

const DEV_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://127.0.0.1:*",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join('; ')

/**
 * Applies a Content-Security-Policy to every response in the default session and
 * denies privileged web permissions the UI never needs.
 */
export function hardenSession(): void {
  const policy = app.isPackaged ? PROD_CSP : DEV_CSP

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [policy]
      }
    })
  })

  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => {
    callback(false)
  })
  session.defaultSession.setPermissionCheckHandler(() => false)
}

/** Global navigation hardening: no webviews, no in-app popups, external links open in the OS browser. */
export function hardenNavigation(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (event) => {
      event.preventDefault()
    })

    contents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) {
        void shell.openExternal(url)
      }
      return { action: 'deny' }
    })
  })
}
