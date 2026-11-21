import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Sparkles } from '@react-three/drei'
import { Football } from './Football'
import { createGlowTexture } from './ballTexture'

/**
 * Public hero scene: a spinning football floating above a red/gold turf
 * glow, with gold sparkles and a soft contact shadow. Transparent canvas
 * so the page gradient shows through. Pointer tilt is handled inside
 * <Football /> (window pointer tracking).
 */
export default function HeroScene() {
  const glow = useMemo(
    () => createGlowTexture('rgba(227,6,19,0.55)', 'rgba(212,175,55,0.14)'),
    [],
  )

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.5, 7.5], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent', pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 6]} intensity={1.4} />
      <pointLight position={[-5, 2, 3]} intensity={30} color="#e30613" />
      <pointLight position={[5, -1, 2]} intensity={18} color="#d4af37" />
      <Suspense fallback={null}>
        <Football position={[0, 0.25, 0]} scale={1.05} spin={0.22} />
        {/* Turf glow disc under the ball */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.05, -0.4]}>
          <planeGeometry args={[7.5, 7.5]} />
          <meshBasicMaterial
            map={glow}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
        <ContactShadows
          position={[0, -2.02, -0.4]}
          opacity={0.55}
          scale={9}
          blur={2.4}
          far={3}
          color="#000000"
        />
        <Sparkles
          count={70}
          scale={[9, 5, 4]}
          size={2.4}
          speed={0.25}
          color="#d4af37"
          position={[0, 0.4, -1]}
        />
      </Suspense>
    </Canvas>
  )
}
