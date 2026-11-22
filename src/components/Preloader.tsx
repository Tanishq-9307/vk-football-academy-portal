import { useEffect, useRef, useState } from 'react'
import Logo from './Logo'

/**
 * Short intro preloader: the academy crest + a 0–100 counter and a thin
 * gold progress line. It waits for the display fonts and the 3D chunk
 * (warmed by dynamic import) with a 900ms minimum and a 2.8s hard cap,
 * then exits with a wipe (the whole overlay slides up) and tells the
 * parent to start the hero headline reveal as the wipe lifts.
 *
 * Reduced motion: exits immediately — no waiting, no animation.
 */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0)
  const [exiting, setExiting] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    let cancelled = false
    const t0 = performance.now()
    const tick = (now: number) => {
      if (cancelled) return
      const p = Math.min(1, (now - t0) / 1100)
      setCount(Math.round(100 * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(tick)
    }
    const raf = requestAnimationFrame(tick)

    const ready = Promise.all([
      typeof document !== 'undefined' && document.fonts
        ? document.fonts.ready
        : Promise.resolve(),
      // Warm the 3D chunk so the ball is ready when the wipe lifts.
      import('./three/ScrollBall').catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, reduced ? 0 : 900)),
    ])
    const timeout = new Promise((resolve) => setTimeout(resolve, 2800))
    Promise.race([ready, timeout]).then(() => {
      if (cancelled || doneRef.current) return
      doneRef.current = true
      setCount(100)
      setExiting(true)
      onDone()
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
    // Runs once on mount — onDone is a stable setState wrapper from Home.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-charcoal-950 ${
        exiting ? 'preloader-exit' : ''
      }`}
    >
      <div className="animate-float-slow">
        <Logo size={120} />
      </div>
      <p className="font-display mt-6 text-6xl font-bold text-white">
        {count}
        <span className="text-brand-500">%</span>
      </p>
      <div className="mt-6 h-px w-40 bg-charcoal-700">
        <div
          className="h-px bg-gold-400 transition-[width] duration-150"
          style={{ width: `${count}%` }}
        />
      </div>
      <p className="mt-4 text-[11px] font-semibold tracking-[0.3em] text-zinc-500 uppercase">
        VK Football Academy · Thane
      </p>
    </div>
  )
}
