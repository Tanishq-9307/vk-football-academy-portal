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
 *   hero (large, right of the headline) → drifts to the side as the
 *   "Why VKFA" text arrives → shrinks and docks beside the Programmes
 *   heading → returns large at the scarlet trial CTA, to the right of
 *   the text → fades out over the footer.
 *
 * Scroll drives the motion (GSAP ScrollTrigger, scrub) — no fixed on-load
 * timeline. The ball stays fully interactive the whole way: drag (mouse
 * or touch) to spin it with momentum, tap / click to kick it (spin burst
 * + bounce + gold flash). The hint pill fades once the user interacts or
 * starts scrolling.
 *
 * Positioning rules (learned from a live-browser check):
 * - The hero position is set synchronously in useLayoutEffect, before
 *   first paint — the stage is `fixed top-0 left-0`, so without this the
 *   ball flashes in the top-left corner over the headline/eyebrow.
 * - All journey measurements use document coordinates and are
 *   re-evaluated on every ScrollTrigger refresh (`invalidateOnRefresh`),
 *   because the timeline is built before the display fonts load, when
 *   the layout is still the fallback-font layout.
 * - The ball drops behind the page content (z-1) as soon as scrolling
 *   starts (timeline time 0.02) — it must never pass OVER readable
 *   text. The hero text column is z-2, so the ball is in front of the
 *   type at rest and behind it once the scroll begins.
 * - The dock is computed for the scroll position where the Programmes
 *   heading is actually in view (its centre at 30% viewport height),
 *   not a fixed journey fraction, and is clamped into the viewport.
 * - The CTA station sits to the right of the left-aligned text, behind
 *   it (text is z-10) — never on top of the headline or buttons.
 *
 * The stage is a square sized min(58vh, 42vw). Two layouts via
 * gsap.matchMedia — desktop and mobile. On mobile the hero stacks: the
 * ball sits in the reserved slot below the headline (measured, not
 * guessed). The render loop pauses off-screen via useInteraction; the
 * DPR cap is [1, 1.75].
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

    const size = () => stage.offsetWidth
    const clampNum = (v: number, lo: number, hi: number) =>
      Math.min(hi, Math.max(lo, v))

    // Deterministic hero position on first paint (see the header
    // comment). useLayoutEffect runs before paint, so the very first
    // frame already has the ball in its hero station; the scrubbed
    // timeline takes over from here on scroll.
    const setHeroNow = () => {
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches
      if (isDesktop) {
        gsap.set(stage, {
          x: window.innerWidth * 0.72 - size() / 2,
          y: window.innerHeight * 0.44 - size() / 2,
          scale: 1,
          zIndex: 5,
          opacity: 1,
        })
      } else {
        const slot = document.getElementById('hero-ball-slot')
        let y = window.innerHeight * 0.68 - size() / 2
        if (slot) {
          const r = slot.getBoundingClientRect()
          y = r.top + r.height / 2 - size() / 2
        }
        gsap.set(stage, {
          x: window.innerWidth * 0.5 - size() / 2,
          y,
          scale: 1,
          zIndex: 5,
          opacity: 1,
        })
      }
    }
    setHeroNow()

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
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
        // Dock target beside the Programmes heading, measured from the
        // heading's real document position. The scroll position used is
        // the one where the heading's centre sits at 30% viewport
        // height — the position where the heading is actually in view.
        // (The old code used a fixed 0.45 journey fraction; by then
        // the heading had already scrolled past the top of the viewport
        // and the dock point was off-screen.) The result is clamped so
        // the docked ball is always fully on-screen. Document
        // coordinates throughout, so the value does not depend on the
        // scroll position at measure time.
        const dock = () => {
          const vw = window.innerWidth
          const vh = window.innerHeight
          const half = size() / 2
          const radius = (size() * 0.24) / 2
          const fallback = {
            x: vw * 0.86 - half,
            y: vh * 0.2 - half,
          }
          const el = document.getElementById('programmes-heading')
          if (!el) return fallback
          const r = el.getBoundingClientRect()
          const docTop = r.top + window.scrollY
          const docLeft = r.left + window.scrollX
          const scrollYAtDock = docTop + r.height / 2 - vh * 0.3
          return {
            x: clampNum(
              docLeft + r.width + 96 - half,
              radius - half,
              vw - radius - half,
            ),
            y: clampNum(
              docTop - scrollYAtDock + r.height / 2 - half,
              radius - half,
              vh - radius - half,
            ),
          }
        }
        const tl = gsap.timeline({
          scrollTrigger: {
            id: 'vkfa-journey',
            trigger: '#home-root',
            // Scroll positions, not trigger-relative keywords: progress
            // 0 is scrollY 0, so the hero station and the slot
            // measurement agree with the first paint exactly.
            start: 0,
            end: 'max',
            scrub: 0.8,
            // Function-based tween values (dock, centres) are evaluated
            // when the timeline is built — before the display fonts
            // load, when the layout is still the fallback-font layout.
            // Re-evaluate them on every refresh so the dock and the
            // hero slot track the settled layout.
            invalidateOnRefresh: true,
            onUpdate: (self) => setProgress(self.progress),
          },
        })
        tl.set(
          stage,
          {
            x: () => centerX(0.72),
            y: () => centerY(0.44),
            scale: 1,
            zIndex: 5,
            opacity: 1,
          },
          0,
        )
          // Behind the page content as soon as scrolling starts — the
          // ball must never pass OVER readable text. (The hero text
          // column is z-2, so the ball is in front of the type at rest
          // and behind it once the scroll begins.)
          .set(stage, { zIndex: 1 }, 0.02)
          .to(
            stage,
            {
              x: () => centerX(0.1),
              y: () => centerY(0.58),
              scale: 0.55,
              duration: 0.18,
              ease: 'none',
            },
            0,
          )
          .to(
            stage,
            {
              x: () => dock().x,
              y: () => dock().y,
              scale: 0.24,
              duration: 0.14,
              ease: 'none',
            },
            0.18,
          )
          // Hold the dock while the reader is on the programmes section.
          .to(
            stage,
            {
              x: () => dock().x,
              y: () => dock().y,
              scale: 0.24,
              duration: 0.12,
              ease: 'none',
            },
            0.32,
          )
          .to(
            stage,
            {
              x: () => centerX(0.1),
              y: () => centerY(0.55),
              scale: 0.5,
              duration: 0.13,
              ease: 'none',
            },
            0.44,
          )
          // CTA: to the right of the left-aligned text, behind it
          // (the CTA text is z-10) — never on top of the headline or
          // the buttons.
          .to(
            stage,
            {
              x: () => centerX(0.78),
              y: () => centerY(0.5),
              scale: 0.85,
              duration: 0.25,
              ease: 'none',
            },
            0.57,
          )
          .set(stage, { zIndex: 5 }, 0.78)
          .to(stage, { opacity: 0, duration: 0.03, ease: 'none' }, 0.97)
      })

      mm.add('(max-width: 1023px)', () => {
        const centerX = (vw: number) =>
          window.innerWidth * vw - size() / 2
        const centerY = (vh: number) =>
          window.innerHeight * vh - size() / 2
        // Hero slot: the reserved space below the headline, measured in
        // document coordinates (rect.top + scrollY) so the value is
        // correct no matter the scroll position when it is evaluated.
        // With start: 0 the hero station is scrollY 0, so this agrees
        // with the first paint exactly.
        const heroSlotY = () => {
          const slot = document.getElementById('hero-ball-slot')
          if (!slot) return centerY(0.68)
          const r = slot.getBoundingClientRect()
          return r.top + window.scrollY + r.height / 2 - size() / 2
        }
        const tl = gsap.timeline({
          scrollTrigger: {
            id: 'vkfa-journey',
            trigger: '#home-root',
            start: 0,
            end: 'max',
            scrub: 0.8,
            invalidateOnRefresh: true,
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
          // Behind the page content as soon as scrolling starts.
          .set(stage, { zIndex: 1 }, 0.02)
          .to(
            stage,
            {
              x: () => centerX(0.5),
              y: () => centerY(0.14),
              scale: 0.42,
              duration: 0.2,
              ease: 'none',
            },
            0,
          )
          .to(
            stage,
            {
              x: () => centerX(0.86),
              y: () => centerY(0.12),
              scale: 0.22,
              duration: 0.15,
              ease: 'none',
            },
            0.2,
          )
          // Hold the small top-right marker while the reader is on the
          // programmes section.
          .to(
            stage,
            {
              x: () => centerX(0.86),
              y: () => centerY(0.12),
              scale: 0.22,
              duration: 0.12,
              ease: 'none',
            },
            0.35,
          )
          .to(
            stage,
            {
              x: () => centerX(0.5),
              y: () => centerY(0.8),
              scale: 0.5,
              duration: 0.15,
              ease: 'none',
            },
            0.47,
          )
          // CTA on mobile: small, bottom-centre, behind the text.
          .to(
            stage,
            {
              x: () => centerX(0.5),
              y: () => centerY(0.8),
              scale: 0.55,
              duration: 0.25,
              ease: 'none',
            },
            0.62,
          )
          .set(stage, { zIndex: 5 }, 0.78)
          .to(stage, { opacity: 0, duration: 0.03, ease: 'none' }, 0.97)
      })

      // Re-measure the journey once the display fonts settle (headline
      // height changes move every section below it).
      if (typeof document !== 'undefined' && document.fonts) {
        document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
      }
    }, wrapRef)

    // Also re-measure once the whole page (fonts, images) has loaded.
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)

    return () => {
      window.removeEventListener('load', onLoad)
      ctx.revert()
    }
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
          sits in this slot in the hero. Hidden on desktop. Taller than
          the ball (52vw vs 42vw) so a small measurement error never
          crops it against the header. */}
      <div
        id="hero-ball-slot"
        className="h-[52vw] lg:hidden"
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
