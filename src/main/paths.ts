import { app } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'

const DATA_DIR_NAME = 'data'

export function getDataRoot(): string | null {
  if (!app.isPackaged) return null
  return join(dirname(process.execPath), DATA_DIR_NAME)
}

function copyDir(source: string, target: string): void {
  mkdirSync(target, { recursive: true })
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const src = join(source, entry.name)
    const dst = join(target, entry.name)
    if (entry.isDirectory()) {
      copyDir(src, dst)
    } else if (entry.isFile()) {
      copyFileSync(src, dst)
    }
  }
}

function migrateLegacyData(newRoot: string, appDataPath: string): void {
  const legacy = join(appDataPath, 'Nova')
  if (!existsSync(legacy)) return
  try {
    mkdirSync(newRoot, { recursive: true })
    for (const name of ['settings.json', 'window-state.json']) {
      const src = join(legacy, name)
      const dst = join(newRoot, name)
      if (existsSync(src) && !existsSync(dst)) copyFileSync(src, dst)
    }
    const legacyLogs = join(legacy, 'logs')
    const newLogs = join(newRoot, 'logs')
    if (existsSync(legacyLogs) && !existsSync(newLogs)) copyDir(legacyLogs, newLogs)

    rmSync(legacy, { recursive: true, force: true })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Nova: legacy data migration failed', error)
  }
}

export function configurePaths(): void {
  const root = getDataRoot()
  if (!root) return

  // Capture the original appData location before we override anything.
  const originalAppData = app.getPath('appData')

  const paths: Record<string, string> = {
    userData: root,
    sessionData: join(root, 'session'),
    logs: join(root, 'logs'),
    crashDumps: join(root, 'crash-dumps'),
    temp: join(root, 'temp')
  }

  for (const dir of Object.values(paths)) {
    mkdirSync(dir, { recursive: true })
  }
  for (const [name, dir] of Object.entries(paths)) {
    app.setPath(name, dir)
  }

  migrateLegacyData(root, originalAppData)
}
