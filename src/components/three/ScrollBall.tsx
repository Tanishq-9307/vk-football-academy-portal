import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Sparkles } from '@react-three/drei'
import { Hand } from 'lucide-react'
import { Football } from './Football'
import { createGlowTexture } from './ballTexture'
import { useInteraction } from './useInteraction'
import { useShouldRender3D } from './useShouldRender3D'
import Logo from '../Logo'

gsap.registerPlugin(ScrollTrigger)

/**
 * The signature 3D football, as a fixed stage that travels the Home page
 * with the scroll — the core reel pattern:
 *
 *   hero (large, in front of the headline) → drifts to the side as the
 *   "Why VKFA" text arrives → shrinks and docks beside the Programmes
 *   heading → returns large behind the scarlet trial CTA → fades out
 *   over the footer.
 *
 * Scroll drives the motion (GSAP ScrollTrigger, scrub) — no fixed on-load
 * timeline. The ball stays fully interactive the whole way: drag (mouse
 * or touch) to spin it with momentum, tap / click to kick it (spin burst
 * + bounce + gold flash). The hint pill fades once the user interacts or
 * starts scrolling.
 *
 * The stage is a square sized min(58vh, 42vw); GSAP moves it by viewport
 * fractions and docks it beside the Programmes heading by measuring the
 * heading's document position against the scroll position at the dock
 * progress. Two layouts via gsap.matchMedia — desktop and mobile.
 * On mobile the hero stacks: the ball sits in the reserved slot below
 * the headline (measured, not guessed).
 *
 * z-index is choreographed: 5 in the hero (in front of the type) and at
 * the CTA (behind the CTA text, which is z-10), 1 in between (behind the
 * page content, which sits in a z-2 wrapper). The render loop pauses
 * off-screen via useInteraction; the DPR cap is [1, 1.75].
 *
 * When 3D is not allowed (no WebGL / reduced motion) this renders a
 * static crest block in the normal page flow instead of the fixed stage.
 */
export default function ScrollBall() {
  const ok = useShouldRender3D()
  const glow = useMemo(
    () => createGlowTexture('rgba(227,6,19,0.55)', 'rgba(212,175,55,0.14)'),
    [],
  )
  const { state, handlers, wrapRef, interacted, frameloop } = useInteraction({
    trackScroll: false,
  })
  const pillRef = useRef<HTMLParagraphElement>(null)
  const interactedRef = useRef(interacted)

  useEffect(() => {
    interactedRef.current = interacted
    if (interacted && pillRef.current) pillRef.current.style.opacity = '0'
  }, [interacted])

  useLayoutEffect(() => {
    if (!ok) return
    const stage = wrapRef.current
    if (!stage) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      const size = () => stage.offsetWidth
      const setProgress = (p: number) => {
        // Drives the ball's in-scene rotation + camera pull-in (scrollRig).
        state.scroll = p
        if (pillRef.current) {
          pillRef.current.style.opacity =
            p > 0.06 || interactedRef.current ? '0' : '1'
        }
      }

      mm.add('(min-width: 1024px)', () => {
        const centerX = (vw: number) =>
          window.innerWidth * vw - size() / 2
        const centerY = (vh: number) =>
          window.innerHeight * vh - size() / 2
        // Dock target beside the Programmes heading: the heading's
        // viewport position at the dock progress (0.45), from its
        // document position and the scroll position at that progress.
        const dock = () => {
          const el = document.getElementById('programmes-heading')
          const st = ScrollTrigger.getById('vkfa-journey')
          if (!el || !st) {
            return {
              x: window.innerWidth * 0.86 - size() / 2,
              y: window.innerHeight * 0.16 - size() / 2,
            }
          }
          const r = el.getBoundingClientRect()
          const docTop = r.top + window.scrollY
          const docLeft = r.left + window.scrollX
          const scrollYAtDock = st.start + 0.45 * (st.end - st.start)
          return {
            x: docLeft + r.width + 48 - size() / 2,
            y: docTop - scrollYAtDock + r.height / 2 - size() / 2,
          }
        }
        const tl = gsap.timeline({
          scrollTrigger: {
            id: 'vkfa-journey',
            trigger: '#home-root',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.8,
            onUpdate: (self) => setProgress(self.progress),
          },
        })
        tl.set(
          stage,
          {
            x: () => centerX(0.76),
            y: () => centerY(0.44),
            scale: 1,
            zIndex: 5,
            opacity: 1,
          },
          0,
        )
          .to(
            stage,
            {
              x: () => centerX(0.13),
              y: () => centerY(0.5),
              scale: 0.72,
              duration: 0.25,
              ease: 'none',
            },
            0,
          )
          .set(stage, { zIndex: 1 }, 0.22)
          .to(
            stage,
            {
              x: () => dock().x,
              y: () => dock().y,
              scale: 0.24,
              duration: 0.2,
              ease: 'none',
            },
            0.25,
          )
          .to(
            stage,
            {
              x: () => centerX(0.1),
              y: () => centerY(0.5),
              scale: 0.5,
              duration: 0.2,
              ease: 'none',
            },
            0.45,
          )
          .to(
            stage,
            {
              x: () => centerX(0.5),
              y: () => centerY(0.5),
              scale: 1.05,
              duration: 0.35,
              ease: 'none',
            },
            0.65,
          )
          .set(stage, { zIndex: 5 }, 0.68)
          .to(stage, { opacity: 0, duration: 0.03, ease: 'none' }, 0.97)
      })

      mm.add('(max-width: 1023px)', () => {
        const centerX = (vw: number) =>
          window.innerWidth * vw - size() / 2
        const centerY = (vh: number) =>
          window.innerHeight * vh - size() / 2
        // Hero slot: the reserved space below the headline, measured
        // (the hero is at the top of the page, so at progress 0 the
        // slot's viewport position is its document position).
        const heroSlotY = () => {
          const slot = document.getElementById('hero-ball-slot')
          if (!slot) return centerY(0.68)
          const r = slot.getBoundingClientRect()
          return r.top + r.height / 2 - size() / 2
        }
        const tl = gsap.timeline({
          scrollTrigger: {
            id: 'vkfa-journey',
            trigger: '#home-root',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.8,
            onUpdate: (self) => setProgress(self.progress),
          },
        })
        tl.set(
          stage,
          {
            x: () => centerX(0.5),
            y: () => heroSlotY(),
            scale: 1,
            zIndex: 5,
            opacity: 1,
          },
          0,
        )
          .to(
            stage,
            {
              x: () => centerX(0.5),
              y: () => centerY(0.16),
              scale: 0.42,
              duration: 0.25,
              ease: 'none',
            },
            0,
          )
          .set(stage, { zIndex: 1 }, 0.22)
          .to(
            stage,
            {
              x: () => centerX(0.86),
              y: () => centerY(0.14),
              scale: 0.22,
              duration: 0.2,
              ease: 'none',
            },
            0.25,
          )
          .to(
            stage,
            {
              x: () => centerX(0.5),
              y: () => centerY(0.82),
              scale: 0.5,
              duration: 0.2,
              ease: 'none',
            },
            0.45,
          )
          .to(
            stage,
            {
              x: () => centerX(0.5),
              y: () => centerY(0.5),
              scale: 1.0,
              duration: 0.35,
              ease: 'none',
            },
            0.65,
          )
          .set(stage, { zIndex: 5 }, 0.68)
          .to(stage, { opacity: 0, duration: 0.03, ease: 'none' }, 0.97)
      })

      // Re-measure the journey once the display fonts settle (headline
      // height changes move every section below it).
      if (typeof document !== 'undefined' && document.fonts) {
        document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
      }
    }, wrapRef)

    return () => ctx.revert()
    // Runs once on mount — `state` is a stable ref object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok])

  // No 3D on this device: a static crest in the normal page flow.
  if (!ok) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-float-slow">
          <Logo size={260} />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Reserved space below the headline on mobile — the fixed ball
          sits in this slot in the hero. Hidden on desktop. */}
      <div
        id="hero-ball-slot"
        className="h-[42vw] lg:hidden"
        aria-hidden="true"
      />
      <div
        ref={wrapRef}
        {...handlers}
        className="fixed top-0 left-0 z-[5] h-[min(58vh,42vw)] w-[min(58vh,42vw)] cursor-grab select-none active:cursor-grabbing"
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
        </Canvas>
        <p
          ref={pillRef}
          className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gold-600/40 bg-charcoal-950/70 px-3 py-1.5 text-[11px] font-semibold tracking-wider whitespace-nowrap text-gold-400 uppercase backdrop-blur transition-opacity duration-700"
          aria-hidden="true"
        >
          <Hand className="h-3.5 w-3.5" />
          Drag to spin · Tap to kick
        </p>
      </div>
    </>
  )
}
