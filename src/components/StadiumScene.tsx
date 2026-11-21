import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Stars } from '@react-three/drei'

/* --------------------------- Procedural textures -------------------------- */

/** Mowing stripes + white pitch markings on a dark night green. */
function makePitchTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 640
  const g = c.getContext('2d')!
  // Base + mowing stripes
  g.fillStyle = '#0e2115'
  g.fillRect(0, 0, 1024, 640)
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 === 0 ? '#102619' : '#0c1d12'
    g.fillRect(i * 128, 0, 128, 640)
  }
  // Lines
  g.strokeStyle = 'rgba(255,255,255,0.85)'
  g.lineWidth = 4
  g.strokeRect(36, 36, 952, 568)
  g.beginPath()
  g.moveTo(512, 36)
  g.lineTo(512, 604)
  g.stroke()
  g.beginPath()
  g.arc(512, 320, 92, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.beginPath()
  g.arc(512, 320, 6, 0, Math.PI * 2)
  g.fill()
  // Penalty boxes
  g.strokeRect(36, 190, 150, 260)
  g.strokeRect(838, 190, 150, 260)
  g.strokeRect(36, 260, 62, 120)
  g.strokeRect(926, 260, 62, 120)
  // Corner arcs
  for (const [x, y, a0] of [
    [36, 36, 0],
    [988, 36, Math.PI / 2],
    [988, 604, Math.PI],
    [36, 604, (Math.PI * 3) / 2],
  ] as const) {
    g.beginPath()
    g.arc(x, y, 26, a0, a0 + Math.PI / 2)
    g.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Classic black-and-white ball: white panels, black pentagons, seams. */
function makeBallTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#f4f4f5'
  g.fillRect(0, 0, 512, 256)

  const pentagon = (x: number, y: number, r: number, rot: number) => {
    g.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = rot + (i * Math.PI * 2) / 5 - Math.PI / 2
      const px = x + Math.cos(a) * r
      const py = y + Math.sin(a) * r
      if (i === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.closePath()
    g.fillStyle = '#0a0a0a'
    g.fill()
  }
  // Scattered pentagons, like a real ball's panels
  const spots: Array<[number, number, number, number]> = [
    [64, 64, 26, 0.3],
    [192, 40, 24, 1.1],
    [320, 70, 26, 0.6],
    [448, 52, 24, 1.4],
    [128, 150, 26, 0.9],
    [256, 128, 28, 0.2],
    [384, 160, 26, 1.2],
    [64, 210, 22, 0.7],
    [192, 216, 24, 1.5],
    [320, 214, 22, 0.4],
    [448, 200, 24, 1.0],
  ]
  for (const [x, y, r, rot] of spots) pentagon(x, y, r, rot)
  // Seams between panels
  g.strokeStyle = 'rgba(10,10,10,0.55)'
  g.lineWidth = 2
  for (const [x1, y1, x2, y2] of [
    [90, 64, 168, 52],
    [216, 56, 296, 62],
    [346, 78, 424, 60],
    [150, 132, 228, 122],
    [284, 122, 358, 150],
    [90, 168, 104, 200],
    [232, 152, 240, 200],
    [372, 176, 420, 196],
  ] as const) {
    g.beginPath()
    g.moveTo(x1, y1)
    g.lineTo(x2, y2)
    g.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/* ------------------------------ Floodlights ------------------------------- */

function FloodlightTower({
  position,
  tilt,
}: {
  position: [number, number, number]
  tilt: [number, number, number]
}) {
  return (
    <group position={position} rotation={tilt}>
      {/* Pole */}
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.09, 0.14, 7, 8]} />
        <meshStandardMaterial color="#1f1f24" roughness={0.6} metalness={0.6} />
      </mesh>
      {/* Lamp head */}
      <mesh position={[0, 7.1, 0]}>
        <boxGeometry args={[1.5, 0.55, 0.4]} />
        <meshStandardMaterial
          color="#111113"
          emissive="#fff6d8"
          emissiveIntensity={2.4}
        />
      </mesh>
      {/* Visible beam */}
      <mesh position={[0, 3.4, 0]}>
        <coneGeometry args={[3.4, 7.4, 24, 1, true]} />
        <meshBasicMaterial
          color="#fff3c4"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

/* --------------------------------- Ball ----------------------------------- */

function Ball({ texture }: { texture: THREE.CanvasTexture }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state, delta) => {
    const el = ref.current
    if (!el) return
    const t = state.clock.elapsedTime
    // Roll across the pitch, bouncing as it goes
    el.position.x = Math.sin(t * 0.38) * 7
    el.position.z = Math.cos(t * 0.21) * 3.2
    el.position.y = Math.abs(Math.sin(t * 1.35)) * 1.7 + 0.55
    el.rotation.x -= delta * 2.2
    el.rotation.z -= delta * 0.9
  })
  return (
    <group ref={ref} position={[0, 0.55, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.55, 48, 32]} />
        <meshStandardMaterial map={texture} roughness={0.35} metalness={0.05} />
      </mesh>
    </group>
  )
}

/* ------------------------------ Camera rig -------------------------------- */

function CameraRig() {
  useFrame((state, delta) => {
    const cam = state.camera
    const scroll = Math.min(window.scrollY / 700, 1)
    const px = state.pointer.x
    const py = state.pointer.y
    const target = new THREE.Vector3(
      px * 1.4,
      5.6 - scroll * 1.1 + py * 0.5,
      15 - scroll * 3.2,
    )
    cam.position.lerp(target, 1 - Math.exp(-2.2 * delta))
    cam.lookAt(0, 1, 0)
  })
  return null
}

/* --------------------------------- Scene ---------------------------------- */

function Scene() {
  const pitchTex = useMemo(() => makePitchTexture(), [])
  const ballTex = useMemo(() => makeBallTexture(), [])
  useEffect(() => {
    return () => {
      pitchTex.dispose()
      ballTex.dispose()
    }
  }, [pitchTex, ballTex])

  return (
    <>
      <color attach="background" args={['#05070a']} />
      <fog attach="fog" args={['#05070a', 22, 46]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 14, 6]} intensity={0.55} color="#dfe8ff" />
      {/* Brand-red glow over the centre circle */}
      <pointLight position={[0, 2.2, 0]} intensity={26} color="#e30613" distance={13} decay={2} />
      <Stars radius={70} depth={35} count={1400} factor={3} fade speed={0.6} />

      {/* Pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 17]} />
        <meshStandardMaterial map={pitchTex} roughness={0.9} metalness={0} />
      </mesh>

      {/* Floodlight towers at the corners */}
      <FloodlightTower position={[-12, 0, -8]} tilt={[0.32, 0, -0.3]} />
      <FloodlightTower position={[12, 0, -8]} tilt={[0.32, 0, 0.3]} />
      <FloodlightTower position={[-12, 0, 8]} tilt={[-0.32, 0, -0.3]} />
      <FloodlightTower position={[12, 0, 8]} tilt={[-0.32, 0, 0.3]} />
      <spotLight
        position={[-12, 7.2, -8]}
        intensity={260}
        angle={0.55}
        penumbra={0.7}
        color="#fff3c4"
        distance={34}
        decay={1.6}
      />
      <spotLight
        position={[12, 7.2, 8]}
        intensity={260}
        angle={0.55}
        penumbra={0.7}
        color="#fff3c4"
        distance={34}
        decay={1.6}
      />

      <Ball texture={ballTex} />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.65} scale={26} blur={2.4} far={4} />
      <CameraRig />
    </>
  )
}

export default function StadiumScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 5.6, 15], fov: 42 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <Scene />
    </Canvas>
  )
}
