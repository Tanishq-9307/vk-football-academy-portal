import { useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Variant C — "Clean / Glass" hero ball.
 * A classic football built procedurally: the 12 black pentagons sit on the
 * vertices of an icosahedron, projected onto an equirectangular canvas
 * texture, with short seam stubs between neighbouring pentagons. No external
 * texture or HDR is fetched — lighting is plain studio lights, so the scene
 * works offline.
 */

const PHI = (1 + Math.sqrt(5)) / 2

/** The 12 vertices of an icosahedron (unit sphere) — the pentagon centres. */
function icosahedronVertices(): THREE.Vector3[] {
  const raw: Array<[number, number, number]> = []
  const a = 0
  const b = 1
  const c = PHI
  raw.push(
    [a, b, c], [a, b, -c], [a, -b, c], [a, -b, -c],
    [b, c, a], [b, -c, a], [-b, c, a], [-b, -c, a],
    [c, a, b], [c, a, -b], [-c, a, b], [-c, a, -b],
  )
  return raw.map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize())
}

function createFootballTexture(): THREE.CanvasTexture {
  const W = 1024
  const H = 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas unavailable')

  // Base — warm white, like a match ball.
  ctx.fillStyle = '#f6f6f3'
  ctx.fillRect(0, 0, W, H)

  const verts = icosahedronVertices()
  const pxPerRad = H / Math.PI
  // Angular radius of a pentagon face on a real ball (~29°).
  const pentRad = 0.5

  // Neighbour pairs (icosahedron edges) — used for seam stubs.
  const edges: Array<[number, number]> = []
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      if (verts[i].distanceTo(verts[j]) < 1.1) edges.push([i, j])
    }
  }

  const project = (v: THREE.Vector3) => {
    const u = ((Math.atan2(v.z, v.x) / (2 * Math.PI) + 0.5) * W) % W
    const vv = (Math.acos(THREE.MathUtils.clamp(v.y, -1, 1)) / Math.PI) * H
    return { u, v: vv, lat: Math.asin(THREE.MathUtils.clamp(v.y, -1, 1)) }
  }

  const drawPentagon = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    rot: number,
  ) => {
    ctx.beginPath()
    for (let k = 0; k < 5; k++) {
      const a = rot + (k / 5) * Math.PI * 2 - Math.PI / 2
      const x = cx + Math.cos(a) * rx
      const y = cy + Math.sin(a) * ry
      if (k === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = '#111114'
    ctx.fill()
  }

  // Seam stubs: short dark lines from each pentagon vertex toward its
  // neighbouring pentagon centre — the panel seams of a real ball.
  const drawSeams = () => {
    ctx.strokeStyle = 'rgba(17, 17, 20, 0.9)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    for (const [i, j] of edges) {
      const a = project(verts[i])
      const b = project(verts[j])
      // Shortest u direction (handles the texture seam).
      let du = b.u - a.u
      if (du > W / 2) du -= W
      if (du < -W / 2) du += W
      const dv = b.v - a.v
      const len = Math.hypot(du, dv)
      const ux = du / len
      const uy = dv / len
      const stub = len * 0.22
      // Stub from pentagon i's edge toward j, and vice versa.
      for (const [p, dir] of [
        [a, 1],
        [b, -1],
      ] as const) {
        const x0 = p.u + ux * dir * (len * 0.28)
        const y0 = p.v + uy * dir * (len * 0.28)
        const x1 = x0 + ux * dir * stub
        const y1 = y0 + uy * dir * stub
        for (const off of [-W, 0, W]) {
          ctx.beginPath()
          ctx.moveTo(x0 + off, y0)
          ctx.lineTo(x1 + off, y1)
          ctx.stroke()
        }
      }
    }
  }

  drawSeams()

  // Pentagons — drawn at u - W, u, u + W so the texture seam is clean.
  for (const v of verts) {
    const { u, v: vv, lat } = project(v)
    const ry = pentRad * pxPerRad
    const rx = ry / Math.max(Math.cos(lat), 0.35)
    // Point one vertex toward the nearest pole.
    const rot = lat >= 0 ? 0 : Math.PI / 5
    for (const off of [-W, 0, W]) {
      drawPentagon(u + off, vv, rx, ry, rot)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export interface PointerRef {
  x: number
  y: number
}

function Ball({ pointerRef }: { pointerRef: MutableRefObject<PointerRef> }) {
  const group = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const texture = useMemo(() => createFootballTexture(), [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    // Slow spin + gentle float.
    group.current.rotation.y += delta * 0.32
    group.current.position.y = Math.sin(t * 0.8) * 0.07
    // Ease the tilt toward the pointer — the ball leans as you move.
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      pointerRef.current.y * 0.2,
      0.05,
    )
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      -pointerRef.current.x * 0.13,
      0.05,
    )
    if (ring.current) ring.current.rotation.z += delta * 0.08
  })

  return (
    <>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[1.15, 64, 64]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.5}
            metalness={0.04}
          />
        </mesh>
      </group>
      {/* Thin gold orbital ring — the premium accent, kept subtle. */}
      <mesh ref={ring} rotation={[1.15, 0.15, 0]}>
        <torusGeometry args={[1.85, 0.012, 12, 128]} />
        <meshStandardMaterial
          color="#c9a227"
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.42}
        scale={9}
        blur={2.6}
        far={3}
        color="#000000"
      />
    </>
  )
}

export default function FootballScene({
  pointerRef,
}: {
  pointerRef: MutableRefObject<PointerRef>
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.3, 5.4], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 4]} intensity={2.4} />
      <directionalLight position={[-5, -2, -3]} intensity={0.6} color="#ffd9a8" />
      <pointLight position={[-4, 1.5, -4]} intensity={8} color="#e30613" />
      <Ball pointerRef={pointerRef} />
    </Canvas>
  )
}
