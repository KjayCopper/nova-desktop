import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Production CSP is injected into index.html because file:// responses do not
// reliably pass through session.webRequest (which only covers the dev server).
// NOTE: frame-ancestors is intentionally absent here — it is ignored when
// delivered via a <meta> element. The response-header policy in
// src/main/security.ts carries it instead.
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
  "form-action 'none'"
].join('; ')

function injectCsp(): Plugin {
  return {
    name: 'nova:inject-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${PROD_CSP}" />`
      )
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [react(), injectCsp()],
    build: {
      chunkSizeWarningLimit: 900
    }
  }
})
