import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import Logo from './Logo'
import type { PointerRef } from './FootballScene'

/**
 * Variant C — "Clean / Glass" hero ball, loaded lazily.
 * The three.js scene is a separate chunk and only mounts when the hero is
 * on screen. If WebGL is unavailable (or on low-end devices), the static
 * crest is shown instead — never a blank or broken section.
 */

const FootballScene = lazy(() => import('./FootballScene'))

function webglSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    )
  } catch {
    return false
  }
}

function StaticBall() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="glow-gold absolute h-72 w-72 rounded-full"
        aria-hidden="true"
      />
      <div
        className="glass animate-float-slow relative flex h-56 w-56 items-center justify-center rounded-full sm:h-64 sm:w-64"
        aria-hidden="true"
      >
        <Logo size={150} />
      </div>
    </div>
  )
}

export default function Football3D() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef<PointerRef>({ x: 0, y: 0 })
  const [inView, setInView] = useState(false)
  const [webgl] = useState(webglSupported)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    pointerRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
    }
  }

  return (
    <div
      ref={wrapRef}
      onPointerMove={handlePointer}
      onPointerLeave={() => {
        pointerRef.current = { x: 0, y: 0 }
      }}
      className="relative h-[340px] w-full sm:h-[420px] lg:h-[480px]"
      role="img"
      aria-label="A football floating above the pitch"
    >
      {!webgl || !inView ? (
        <StaticBall />
      ) : (
        <Suspense fallback={<StaticBall />}>
          <FootballScene
            pointerRef={pointerRef as MutableRefObject<PointerRef>}
          />
        </Suspense>
      )}
    </div>
  )
}
