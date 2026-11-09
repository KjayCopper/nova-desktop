import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/**
 * Small, dependency-free JSON store with debounced atomic writes.
 * Perfect for settings and window state in the userData directory.
 */
export class JsonStore<T extends object> {
  private data: T
  private writeTimer: NodeJS.Timeout | undefined
  private readonly filePath: string
  private readonly defaults: T
  private readonly merge: (raw: unknown, defaults: T) => T

  constructor(filePath: string, defaults: T, merge: (raw: unknown, defaults: T) => T) {
    this.filePath = filePath
    this.defaults = defaults
    this.merge = merge
    this.data = this.read()
  }

  private read(): T {
    try {
      const raw: unknown = JSON.parse(readFileSync(this.filePath, 'utf8'))
      return this.merge(raw, this.defaults)
    } catch {
      return structuredClone(this.defaults)
    }
  }

  get(): T {
    return this.data
  }

  patch(patch: Partial<T>): T {
    this.data = { ...this.data, ...patch }
    this.queueWrite()
    return this.data
  }

  replace(next: T): T {
    this.data = next
    this.queueWrite()
    return this.data
  }

  private queueWrite(): void {
    if (this.writeTimer) clearTimeout(this.writeTimer)
    this.writeTimer = setTimeout(() => this.writeNow(), 200)
  }

  flush(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer)
      this.writeTimer = undefined
    }
    this.writeNow()
  }

  private writeNow(): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      const temp = `${this.filePath}.tmp`
      writeFileSync(temp, `${JSON.stringify(this.data, null, 2)}\n`, 'utf8')
      renameSync(temp, this.filePath)
    } catch (error) {
      console.error(`[store] Failed to persist ${this.filePath}`, error)
    }
  }
}
