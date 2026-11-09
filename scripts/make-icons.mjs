/**
 * Generates build/icon.png (512x512) and build/icon.ico (256x256 PNG entry)
 * without any native image dependencies.
 *
 *   npm run icons
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const buildDir = join(root, 'build')
mkdirSync(buildDir, { recursive: true })

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i++) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData), 0)
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // truecolor + alpha
  header[10] = 0
  header[11] = 0
  header[12] = 0

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // no filter
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

function mix(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ]
}

function blend(base, over, alpha) {
  return [
    base[0] + (over[0] - base[0]) * alpha,
    base[1] + (over[1] - base[1]) * alpha,
    base[2] + (over[2] - base[2]) * alpha
  ]
}

const INDIGO_LIGHT = [129, 140, 248]
const INDIGO = [99, 102, 241]
const CYAN = [34, 211, 238]
const WHITE = [255, 255, 255]

function inRoundedRect(x, y, size, radius) {
  const min = radius
  const max = size - radius
  if (x >= min && x <= max) return y >= 0 && y <= size
  if (y >= min && y <= max) return x >= 0 && x <= size
  const cx = x < min ? min : max
  const cy = y < min ? min : max
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2
}

function inTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by)
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy)
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

function renderIcon(size) {
  const scale = size / 64
  const radius = 17 * scale
  const samples = 2
  const rgba = Buffer.alloc(size * size * 4)

  // Scaled geometry from the 64x64 master vector.
  const tri = [
    [26, 16.6],
    [48.6, 32],
    [26, 47.4]
  ].map(([x, y]) => [x * scale, y * scale])

  const dot = { x: 20.5 * scale, y: 45 * scale, r: 2.6 * scale }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = x + (sx + 0.5) / samples
          const py = y + (sy + 0.5) / samples

          if (!inRoundedRect(px, py, size, radius)) continue

          const t = Math.min(1, (px / size) * 0.45 + (py / size) * 0.55)
          let color =
            t < 0.52 ? mix(INDIGO_LIGHT, INDIGO, t / 0.52) : mix(INDIGO, CYAN, (t - 0.52) / 0.48)

          // Thin white inner stroke along the rounded edge.
          const edge =
            !inRoundedRect(px - 1.6 * scale, py, size, radius) ||
            !inRoundedRect(px + 1.6 * scale, py, size, radius) ||
            !inRoundedRect(px, py - 1.6 * scale, size, radius) ||
            !inRoundedRect(px, py + 1.6 * scale, size, radius)
          if (edge) color = blend(color, WHITE, 0.2)

          if (inTriangle(px, py, ...tri[0], ...tri[1], ...tri[2])) {
            color = WHITE
          } else if ((px - dot.x) ** 2 + (py - dot.y) ** 2 <= dot.r ** 2) {
            color = blend(color, WHITE, 0.74)
          }

          r += color[0]
          g += color[1]
          b += color[2]
          a += 1
        }
      }

      const count = samples * samples
      const index = (y * size + x) * 4
      rgba[index] = Math.round(r / count)
      rgba[index + 1] = Math.round(g / count)
      rgba[index + 2] = Math.round(b / count)
      rgba[index + 3] = Math.round((a / count) * 255)
    }
  }

  return encodePng(size, size, rgba)
}

function icoFromPng(png) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)

  const entry = Buffer.alloc(16)
  entry[0] = 0 // 256px
  entry[1] = 0
  entry[2] = 0
  entry[3] = 0
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(header.length + entry.length, 12)

  return Buffer.concat([header, entry, png])
}

const png512 = renderIcon(512)
const png256 = renderIcon(256)

writeFileSync(join(buildDir, 'icon.png'), png512)
writeFileSync(join(buildDir, 'icon.ico'), icoFromPng(png256))

console.log(`Icons written to ${buildDir}`)
console.log(`  icon.png  ${png512.length.toLocaleString()} bytes (512x512)`)
console.log(`  icon.ico  ${png256.length.toLocaleString()} bytes (256x256)`)
