import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Football } from './Football'
import { useInteraction } from './useInteraction'

/**
 * Small football for portal headers (e.g. the dashboard). Slow spin by
 * default — tap / click it and it spins faster with a small hop and gold
 * flash. Drag is disabled (it lives in a small header card), and the
 * render loop pauses while it is off-screen.
 */
export default function MiniBall() {
  const { state, handlers, wrapRef, frameloop } = useInteraction({
    drag: false,
    kickPower: 0.5,
  })
  return (
    <div
      ref={wrapRef}
      {...handlers}
      className="relative h-full w-full cursor-pointer select-none"
      style={{ touchAction: 'pan-y', WebkitTapHighlightColor: 'transparent' }}
      role="img"
      aria-label="Spinning football — tap to spin it faster"
    >
      <Canvas
        dpr={[1, 1.5]}
        frameloop={frameloop}
        camera={{ position: [0, 0, 5.2], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={1.3} />
        <pointLight position={[-4, 1, 3]} intensity={12} color="#e30613" />
        <Suspense fallback={null}>
          <Football
            position={[0, 0, 0]}
            scale={0.62}
            spin={0.35}
            interactive={false}
            float={false}
            interaction={state}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
