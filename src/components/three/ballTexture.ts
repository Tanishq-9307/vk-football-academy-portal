import * as THREE from 'three'

/**
 * Procedural football texture: a white ball with black pentagons and faint
 * panel seams, drawn on a canvas. Deterministic (seeded) so the pattern is
 * stable between renders. Used by the 3D football meshes.
 */
export function createFootballTexture(): THREE.CanvasTexture {
  const w = 1024
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas unavailable')

  // Base: off-white with a soft vertical shade.
  const base = ctx.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, '#fdfdfd')
  base.addColorStop(0.5, '#f4f4f4')
  base.addColorStop(1, '#e8e8e8')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // Seeded pseudo-random so the layout never changes.
  let seed = 42
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }

  // Faint hexagon panel seams.
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'
  ctx.lineWidth = 2
  const hexR = 46
  const drawHex = (cx: number, cy: number, r: number) => {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6
      const x = cx + r * Math.cos(a)
      const y = cy + r * Math.sin(a)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 12; col++) {
      const cx = col * hexR * 1.5 + (row % 2 === 0 ? 0 : hexR * 0.75)
      const cy = row * hexR * 1.3 + hexR * 0.6
      drawHex(cx, cy, hexR)
    }
  }

  // Black pentagons — one row band pattern like a real ball's panels.
  const drawPentagon = (cx: number, cy: number, r: number, rot: number) => {
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = rot + (Math.PI * 2 * i) / 5 - Math.PI / 2
      const x = cx + r * Math.cos(a)
      const y = cy + r * Math.sin(a)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = '#101010'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 2
    ctx.stroke()
    // Seam lines from each vertex outward.
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'
    ctx.lineWidth = 2.5
    for (let i = 0; i < 5; i++) {
      const a = rot + (Math.PI * 2 * i) / 5 - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(cx + r * 0.9 * Math.cos(a), cy + r * 0.9 * Math.sin(a))
      ctx.lineTo(cx + r * 1.9 * Math.cos(a), cy + r * 1.9 * Math.sin(a))
      ctx.stroke()
    }
  }

  const spots: Array<[number, number, number]> = [
    [128, 110, 40],
    [384, 70, 36],
    [640, 120, 40],
    [896, 80, 36],
    [256, 300, 42],
    [512, 260, 38],
    [768, 310, 42],
    [1024, 280, 36],
    [0, 280, 36],
    [128, 450, 36],
    [384, 430, 40],
    [640, 455, 36],
    [896, 440, 40],
  ]
  for (const [x, y, r] of spots) {
    drawPentagon(x, y, r, rand() * Math.PI)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Soft radial glow texture for the ground under the ball. */
export function createGlowTexture(inner: string, outer: string): THREE.CanvasTexture {
  const s = 256
  const canvas = document.createElement('canvas')
  canvas.width = s
  canvas.height = s
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas unavailable')
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, inner)
  g.addColorStop(0.55, outer)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
