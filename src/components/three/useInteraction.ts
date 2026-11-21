import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

/**
 * Shared interaction engine for the 3D scenes (hero ball, crest, mini ball).
 *
 * One mutable state object is created per scene and passed down to the
 * three.js components, which read it inside useFrame. Pointer handlers go
 * on the scene's wrapper <div> (the canvas itself has pointer-events none
 * and sits behind the page), with `touch-action: pan-y` so a vertical swipe
 * still scrolls the page while a horizontal drag rotates the model.
 *
 * - Drag (mouse or touch) rotates the model, with momentum after release.
 * - A quick tap / click "kicks" it: spin burst + bounce + gold flash.
 * - Scroll progress of the wrapper is tracked for scroll-linked motion.
 * - An IntersectionObserver pauses the render loop (frameloop "never")
 *   while the scene is off-screen, so phones don't burn battery.
 */

export interface InteractionState {
  /** Accumulated rotation offsets from dragging (radians). */
  rotX: number
  rotY: number
  /** Momentum angular velocity (rad/s) — decays after release. */
  velX: number
  velY: number
  dragging: boolean
  /** 0..1 kick energy — drives the spin burst, bounce and gold flash. */
  kick: number
  /** Vertical bounce offset (scene units) and its velocity. */
  bounce: number
  bounceVel: number
  /** 0..1 squash amount on landing. */
  squash: number
  /** 0 at rest → 1 once the wrapper has scrolled mostly out of view. */
  scroll: number
}

export function createInteractionState(): InteractionState {
  return {
    rotX: 0,
    rotY: 0,
    velX: 0,
    velY: 0,
    dragging: false,
    kick: 0,
    bounce: 0,
    bounceVel: 0,
    squash: 0,
    scroll: 0,
  }
}

/** Fire a kick: spin burst + bounce + flash. `dir` picks the spin direction. */
export function triggerKick(s: InteractionState, dir = 1, power = 1) {
  s.kick = 1
  s.bounceVel = 3.6 * power
  s.velY += 7 * dir * power
  s.velX += (Math.random() - 0.5) * 2 * power
}

/** Advance momentum / kick / bounce physics by dt seconds. Call from useFrame. */
export function stepInteraction(s: InteractionState, dt: number) {
  const d = Math.min(Math.max(dt, 0), 0.05)
  if (!s.dragging) {
    const decay = Math.exp(-d * 2.4)
    s.velX *= decay
    s.velY *= decay
    s.rotY += s.velY * d
    s.rotX += s.velX * d
    if (s.rotX > 0.7) {
      s.rotX = 0.7
      s.velX = 0
    }
    if (s.rotX < -0.7) {
      s.rotX = -0.7
      s.velX = 0
    }
  }
  if (s.kick > 0) {
    s.kick *= Math.exp(-d * 3.2)
    if (s.kick < 0.01) s.kick = 0
  }
  if (s.squash > 0) {
    s.squash *= Math.exp(-d * 5)
    if (s.squash < 0.01) s.squash = 0
  }
  if (s.bounce !== 0 || s.bounceVel !== 0) {
    s.bounceVel -= 14 * d
    s.bounce += s.bounceVel * d
    if (s.bounce <= 0) {
      if (s.bounceVel < -2) s.squash = Math.min(1, -s.bounceVel / 7)
      s.bounce = 0
      s.bounceVel = 0
    }
  }
}

export interface InteractionOptions {
  /** Drag to rotate. Default true. */
  drag?: boolean
  /** Tap / click triggers a kick. Default true. */
  kickOnTap?: boolean
  /** Track scroll progress of the wrapper (0 at rest → 1 scrolled away). Default false. */
  trackScroll?: boolean
  /** Radians of rotation per pixel dragged. Default 0.008. */
  sensitivity?: number
  /** Kick strength multiplier (1 = full bounce + spin burst). Default 1. */
  kickPower?: number
}

export interface Interaction {
  /** Mutable state — pass it to the three.js components. */
  state: InteractionState
  /** Spread onto the scene's wrapper <div>. */
  handlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void
    onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void
  }
  /** Attach to the scene's wrapper <div> (scroll + visibility tracking). */
  wrapRef: React.RefObject<HTMLDivElement | null>
  /** True once the user has dragged or tapped (drives the hint fade-out). */
  interacted: boolean
  /** R3F frameloop value — "never" while the scene is off-screen. */
  frameloop: 'always' | 'never'
}

export function useInteraction(options: InteractionOptions = {}): Interaction {
  const {
    drag = true,
    kickOnTap = true,
    trackScroll = false,
    sensitivity = 0.008,
    kickPower = 1,
  } = options

  const stateRef = useRef<InteractionState | null>(null)
  if (stateRef.current === null) stateRef.current = createInteractionState()
  const state = stateRef.current
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [interacted, setInteracted] = useState(false)
  const [inView, setInView] = useState(true)
  const dragRef = useRef({
    id: -1,
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    lastT: 0,
    t: 0,
    moved: 0,
  })

  const markInteracted = useCallback(() => {
    setInteracted((v) => (v ? v : true))
  }, [])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = dragRef.current
      if (d.id !== -1) return // one pointer at a time
      d.id = e.pointerId
      d.x = e.clientX
      d.y = e.clientY
      d.lastX = e.clientX
      d.lastY = e.clientY
      d.lastT = performance.now()
      d.t = d.lastT
      d.moved = 0
      state.dragging = drag
      state.velX = 0
      state.velY = 0
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* pointer capture not available — moves still arrive via bubbling */
      }
      markInteracted()
    },
    [drag, state, markInteracted],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = dragRef.current
      if (d.id !== e.pointerId || !state.dragging) return
      const dx = e.clientX - d.lastX
      const dy = e.clientY - d.lastY
      const now = performance.now()
      const dt = Math.max(now - d.lastT, 1) / 1000
      d.lastX = e.clientX
      d.lastY = e.clientY
      d.lastT = now
      d.moved += Math.abs(dx) + Math.abs(dy)
      state.rotY += dx * sensitivity
      state.rotX = Math.max(-0.7, Math.min(0.7, state.rotX + dy * sensitivity))
      // Smooth the fling velocity from the last few moves.
      state.velY = state.velY * 0.65 + ((dx * sensitivity) / dt) * 0.35
      state.velX = state.velX * 0.65 + ((dy * sensitivity) / dt) * 0.35
    },
    [state, sensitivity],
  )

  const endDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, tapped: boolean) => {
      const d = dragRef.current
      if (d.id !== e.pointerId) return
      d.id = -1
      state.dragging = false
      if (tapped && kickOnTap && d.moved < 12 && performance.now() - d.t < 400) {
        triggerKick(state, 1, kickPower)
      }
    },
    [state, kickOnTap, kickPower],
  )

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => endDrag(e, true),
    [endDrag],
  )

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => endDrag(e, false),
    [endDrag],
  )

  const handlers = useMemo(
    () => ({ onPointerDown, onPointerMove, onPointerUp, onPointerCancel }),
    [onPointerDown, onPointerMove, onPointerUp, onPointerCancel],
  )

  // Scroll progress: 0 while the wrapper is in view at rest, → 1 as it
  // scrolls up and out. Read by scenes for scroll-linked motion.
  useEffect(() => {
    if (!trackScroll) return
    const update = () => {
      const el = wrapRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const p = -r.top / (r.height * 0.8)
      state.scroll = Math.max(0, Math.min(1, p))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [trackScroll, state])

  // Pause the render loop while the scene is off-screen (battery on phones).
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { threshold: 0.02 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const frameloop: 'always' | 'never' = inView ? 'always' : 'never'

  return { state, handlers, wrapRef, interacted, frameloop }
}
