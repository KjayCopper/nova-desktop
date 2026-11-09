import { app } from 'electron'
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  statSync,
  type WriteStream
} from 'node:fs'
import { join } from 'node:path'
import type { LogEntry, LogLevel } from '../shared/types'

const MAX_ENTRIES = 400
const MAX_FILE_BYTES = 2 * 1024 * 1024

function describe(error: unknown): string {
  if (error instanceof Error) return error.stack ? `${error.message}\n${error.stack}` : error.message
  return String(error)
}

/** True for closed/absent stdio pipes — common when Electron is launched detached. */
export function isBrokenPipeError(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined
  if (code === 'EPIPE' || code === 'ERR_STREAM_DESTROYED' || code === 'ERR_STREAM_WRITE_AFTER_END') {
    return true
  }
  const message = error instanceof Error ? error.message : String(error)
  return /\bEPIPE\b|broken pipe|write after end/i.test(message)
}

export class Logger {
  readonly directory: string
  readonly file: string

  private entries: LogEntry[] = []
  private sequence = 0
  private stream: WriteStream | null = null
  private consoleBroken = false
  private readonly listeners = new Set<(entry: LogEntry) => void>()

  constructor() {
    this.directory = join(app.getPath('userData'), 'logs')
    this.file = join(this.directory, 'main.log')
    this.watchStdio()
    this.open()
  }

  /** A detached Electron process can have no readable stdout; never let that crash us. */
  private watchStdio(): void {
    for (const stream of [process.stdout, process.stderr]) {
      stream?.on?.('error', (error) => {
        if (isBrokenPipeError(error)) this.consoleBroken = true
      })
    }
  }

  private emitConsole(line: string, level: LogLevel): void {
    if (this.consoleBroken) return
    try {
      if (level === 'error') console.error(line)
      else if (level === 'warn') console.warn(line)
      else console.log(line)
    } catch (error) {
      if (isBrokenPipeError(error)) this.consoleBroken = true
    }
  }

  private open(): void {
    try {
      mkdirSync(this.directory, { recursive: true })
      if (existsSync(this.file) && statSync(this.file).size > MAX_FILE_BYTES) {
        const rotated = join(this.directory, 'main.old.log')
        rmSync(rotated, { force: true })
        renameSync(this.file, rotated)
      }
      this.stream = createWriteStream(this.file, { flags: 'a' })
      this.stream.on('error', (error) => {
        console.error('[logger] Log stream error', error)
        this.stream = null
      })
    } catch (error) {
      console.error('[logger] Unable to open log file', error)
      this.stream = null
    }
  }

  write(level: LogLevel, scope: string, message: string): LogEntry {
    const entry: LogEntry = {
      id: ++this.sequence,
      time: new Date().toISOString(),
      level,
      scope,
      message
    }

    this.entries.push(entry)
    if (this.entries.length > MAX_ENTRIES) this.entries.shift()

    const line = `${entry.time} ${level.toUpperCase().padEnd(5)} [${scope}] ${message}`
    this.emitConsole(line, level)

    try {
      this.stream?.write(`${line}\n`)
    } catch {
      // The log file is best-effort; the in-memory ring buffer already has the entry.
      this.stream = null
    }
    for (const listener of this.listeners) {
      try {
        listener(entry)
      } catch {
        // A listener must never break logging.
      }
    }
    return entry
  }

  debug(scope: string, message: string): void {
    this.write('debug', scope, message)
  }

  info(scope: string, message: string): void {
    this.write('info', scope, message)
  }

  warn(scope: string, message: string): void {
    this.write('warn', scope, message)
  }

  error(scope: string, error: unknown): void {
    this.write('error', scope, describe(error))
  }

  recent(): LogEntry[] {
    return [...this.entries]
  }

  subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose(): void {
    this.listeners.clear()
    this.stream?.end()
    this.stream = null
  }
}
