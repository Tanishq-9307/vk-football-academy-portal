import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Sparkles } from '@react-three/drei'
import { Hand } from 'lucide-react'
import { Football } from './Football'
import { createGlowTexture } from './ballTexture'
import { useInteraction } from './useInteraction'

/**
 * Public hero scene: an interactive football floating above a red/gold
 * turf glow, with gold sparkles and a soft contact shadow. Transparent
 * canvas so the page gradient shows through.
 *
 * Interactive on every device: drag (mouse or touch) to spin the ball
 * with momentum, tap / click to kick it (spin burst + bounce + gold
 * flash), and scroll to turn the ball and pull the camera in. The hint
 * pill fades out after the first interaction. Vertical swipes still
 * scroll the page (touch-action: pan-y); the render loop pauses while
 * the hero is off-screen.
 */
export default function HeroScene() {
  const glow = useMemo(
    () => createGlowTexture('rgba(227,6,19,0.55)', 'rgba(212,175,55,0.14)'),
    [],
  )
  const { state, handlers, wrapRef, interacted, frameloop } = useInteraction({
    trackScroll: true,
  })

  return (
    <div
      ref={wrapRef}
      {...handlers}
      className="relative h-full w-full cursor-grab select-none active:cursor-grabbing"
      style={{ touchAction: 'pan-y', WebkitTapHighlightColor: 'transparent' }}
      role="img"
      aria-label="Interactive 3D football — drag to spin, tap to kick"
    >
      <Canvas
        dpr={[1, 1.75]}
        frameloop={frameloop}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 0.5, 7.5], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 6]} intensity={1.4} />
        <pointLight position={[-5, 2, 3]} intensity={30} color="#e30613" />
        <pointLight position={[5, -1, 2]} intensity={18} color="#d4af37" />
        <Suspense fallback={null}>
          <Football
            position={[0, 0.25, 0]}
            scale={1.05}
            spin={0.22}
            interaction={state}
            scrollRig
          />
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
      <p
        className={`pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gold-600/40 bg-charcoal-950/70 px-3 py-1.5 text-[11px] font-semibold tracking-wider whitespace-nowrap text-gold-400 uppercase backdrop-blur transition-opacity duration-700 ${
          interacted ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      >
        <Hand className="h-3.5 w-3.5" />
        Drag to spin · Tap to kick
      </p>
    </div>
  )
}
