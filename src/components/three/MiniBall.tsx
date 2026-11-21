import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Football } from './Football'

/**
 * Small decorative football for portal headers (e.g. the dashboard).
 * Slow spin only — no pointer interaction, no float, low pixel ratio.
 */
export default function MiniBall() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5.2], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent', pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.3} />
      <pointLight position={[-4, 1, 3]} intensity={12} color="#e30613" />
      <Suspense fallback={null}>
        <Football position={[0, 0, 0]} scale={0.62} spin={0.35} interactive={false} float={false} />
      </Suspense>
    </Canvas>
  )
}
