import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Sparkles, Text } from '@react-three/drei'
import { Football } from './Football'
import { stepInteraction, useInteraction, type InteractionState } from './useInteraction'

/**
 * The academy crest in 3D: an extruded gold shield (bevelled), a black
 * inset shield, a red ribbon bar across the lower third, a football in a
 * gold ring overlapping the top edge, and "VK" in 3D type (white V, red K)
 * using the bundled Oswald Bold font. Slow sway + pointer tilt, and fully
 * interactive when an `interaction` state is passed: drag (mouse or touch)
 * to rotate it with momentum, tap / click for a spin burst.
 *
 * The font is served locally (/fonts/Oswald-Bold.ttf) so the text never
 * depends on a runtime CDN fetch.
 */

// Logo.tsx shield path, viewBox 64x72: M32 2 L58 10 V36 C58 54 46 64 32 70
// C18 64 6 54 6 36 V10 Z — mapped into a ~4.4 x 5 unit shape, Y flipped.
function shieldShape(): THREE.Shape {
  const X = (x: number) => (x - 32) / 14
  const Y = (y: number) => -(y - 36) / 14
  const s = new THREE.Shape()
  s.moveTo(X(32), Y(2))
  s.lineTo(X(58), Y(10))
  s.lineTo(X(58), Y(36))
  s.bezierCurveTo(X(58), Y(54), X(46), Y(64), X(32), Y(70))
  s.bezierCurveTo(X(18), Y(64), X(6), Y(54), X(6), Y(36))
  s.lineTo(X(6), Y(10))
  s.closePath()
  return s
}

function CrestModel({ interaction }: { interaction?: InteractionState }) {
  const group = useRef<THREE.Group>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const tilt = useRef({ x: 0 })
  const shape = useMemo(() => shieldShape(), [])
  const extrude = useMemo(
    () => ({
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.07,
      bevelSegments: 2,
      curveSegments: 16,
    }),
    [],
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    let rotY = Math.sin(t * 0.4) * 0.22
    if (interaction) {
      stepInteraction(interaction, dt)
      rotY += interaction.rotY
    }
    // Hover tilt (mouse only) — halved so the crest can never tilt its
    // top out of frame; the model already fills most of the view.
    const targetX = interaction?.dragging ? 0 : pointer.current.y * 0.06
    tilt.current.x = THREE.MathUtils.lerp(tilt.current.x, targetX, 0.05)
    g.rotation.y = rotY
    g.rotation.x = tilt.current.x
    g.position.y = Math.sin(t * 0.7) * 0.06
  })

  return (
    <group ref={group} scale={0.9}>
      {/* Gold back shield */}
      <mesh position={[0, 0, -0.28]}>
        <extrudeGeometry args={[shape, extrude]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Black inset shield */}
      <mesh position={[0, 0, 0.02]} scale={0.88}>
        <extrudeGeometry args={[shape, { ...extrude, depth: 0.26 }]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.25} roughness={0.5} />
      </mesh>
      {/* Red ribbon bar across the lower third */}
      <group position={[0, -1.15, 0.42]} rotation={[0, 0, -0.03]}>
        <mesh>
          <boxGeometry args={[3.3, 0.52, 0.2]} />
          <meshStandardMaterial color="#e30613" metalness={0.2} roughness={0.45} />
        </mesh>
        {/* Folded ribbon tails */}
        <mesh position={[-1.85, -0.1, -0.04]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.55, 0.3, 0.16]} />
          <meshStandardMaterial color="#a80510" metalness={0.2} roughness={0.45} />
        </mesh>
        <mesh position={[1.85, -0.1, -0.04]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.55, 0.3, 0.16]} />
          <meshStandardMaterial color="#a80510" metalness={0.2} roughness={0.45} />
        </mesh>
      </group>
      {/* Football in a gold ring, overlapping the top edge */}
      <group position={[0, 2.35, 0.35]}>
        <Football position={[0, 0, 0]} scale={0.32} spin={0.3} interactive={false} float={false} />
        <mesh rotation={[0.35, 0, 0]}>
          <torusGeometry args={[0.62, 0.045, 12, 48]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
      {/* VK letters */}
      <Suspense fallback={null}>
        <Text
          font="/fonts/Oswald-Bold.ttf"
          fontSize={1.5}
          position={[-0.52, 0.45, 0.55]}
          anchorX="center"
          anchorY="middle"
          color="#f4f4f5"
        >
          V
        </Text>
        <Text
          font="/fonts/Oswald-Bold.ttf"
          fontSize={1.5}
          position={[0.52, 0.45, 0.55]}
          anchorX="center"
          anchorY="middle"
          color="#e30613"
        >
          K
        </Text>
      </Suspense>
    </group>
  )
}

/** Large 3D crest. Mount lazily (React.lazy) and only when 3D is allowed.
 * Interactive on every device: drag (mouse or touch) to rotate it with
 * momentum, tap / click for a spin burst. Vertical swipes still scroll
 * the page (touch-action: pan-y); the render loop pauses off-screen. */
export default function Crest3D() {
  const { state, handlers, wrapRef, frameloop } = useInteraction()
  return (
    <div
      ref={wrapRef}
      {...handlers}
      className="relative h-full w-full cursor-grab select-none active:cursor-grabbing"
      style={{ touchAction: 'pan-y', WebkitTapHighlightColor: 'transparent' }}
      role="img"
      aria-label="VK Football Academy crest in 3D — drag to rotate, tap to spin"
    >
      <Canvas
        dpr={[1, 1.75]}
        frameloop={frameloop}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 0.2, 10], fov: 36 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 6]} intensity={1.5} />
        <pointLight position={[-5, 2, 4]} intensity={25} color="#e30613" />
        <pointLight position={[5, -1, 3]} intensity={15} color="#d4af37" />
        <Suspense fallback={null}>
          <CrestModel interaction={state} />
          <ContactShadows
            position={[0, -2.9, 0]}
            opacity={0.5}
            scale={8}
            blur={2.4}
            far={3}
            color="#000000"
          />
          <Sparkles
            count={40}
            scale={[7, 5, 3]}
            size={2}
            speed={0.2}
            color="#d4af37"
            position={[0, 0, -1]}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
