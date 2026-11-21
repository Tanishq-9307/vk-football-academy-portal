import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router-dom'

/* ------------------------------ Scroll reveal ----------------------------- */

/** Fades/slides children in the first time they scroll into view. */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

/* ------------------------------- Tilt cards ------------------------------- */

/** Mouse-driven 3D tilt. Disabled on touch / reduced-motion automatically
    (no pointer movement = no tilt; the card still renders normally). */
export function TiltCard({
  children,
  className = '',
  max = 7,
}: {
  children: ReactNode
  className?: string
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`
  }

  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt ${className}`}
    >
      <div className="tilt-inner h-full">{children}</div>
    </div>
  )
}

/* --------------------------------- Ticker --------------------------------- */

const TICKER_ITEMS = [
  'Develop',
  'Compete',
  'Excel',
  'Discipline',
  'Development',
  'Dedication',
  'Thane West',
  'Ages 5–18',
]

export function Ticker({ className = '' }: { className?: string }) {
  const row = (key: string) => (
    <span key={key} className="flex shrink-0 items-center" aria-hidden="true">
      {TICKER_ITEMS.map((item) => (
        <span key={`${key}-${item}`} className="flex items-center">
          <span className="font-display px-5 text-sm font-semibold tracking-[0.3em] text-white/85 uppercase">
            {item}
          </span>
          <span className="h-2 w-2 rotate-45 bg-gold-500" />
        </span>
      ))}
    </span>
  )
  return (
    <div
      className={`overflow-hidden border-y border-brand-500/40 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 py-2.5 ${className}`}
      aria-label="Academy values: Develop, Compete, Excel"
    >
      <div className="ticker-track flex w-max">
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}

/* --------------------------- Section headings ----------------------------- */

export function SectionHeading({
  kicker,
  title,
  intro,
  align = 'left',
}: {
  kicker: string
  title: string
  intro?: string
  align?: 'left' | 'center'
}) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <p className="flex items-center gap-3 text-xs font-bold tracking-[0.3em] text-gold-400 uppercase">
        <span className="inline-block h-2.5 w-2.5 rotate-45 bg-brand-500" aria-hidden="true" />
        {kicker}
        {align === 'center' && (
          <span className="inline-block h-2.5 w-2.5 rotate-45 bg-brand-500" aria-hidden="true" />
        )}
      </p>
      <h2 className="font-display mt-3 text-3xl leading-[1.05] font-bold tracking-wide text-white uppercase sm:text-5xl">
        {title}
      </h2>
      {intro && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
          {intro}
        </p>
      )}
    </div>
  )
}

/* ---------------------------- Scoreboard header --------------------------- */

/** Match-day style header for portal pages: big scoreboard title, red LED
    accent bar, and a "fixture" meta line. */
export function ScoreboardHeader({
  kicker,
  title,
  meta,
  action,
}: {
  kicker: string
  title: string
  meta?: string
  action?: ReactNode
}) {
  return (
    <div className="overflow-hidden stadium-card">
      <div className="h-1.5 bg-gradient-to-r from-brand-500 via-brand-500 to-gold-500" />
      <div className="pitch-stripes flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] text-gold-400 uppercase">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-500" aria-hidden="true" />
            {kicker}
          </p>
          <h1 className="font-display mt-2 text-3xl leading-none font-bold tracking-wide text-white uppercase sm:text-4xl">
            {title}
          </h1>
          {meta && <p className="mt-2 text-sm text-zinc-400">{meta}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}

/* ------------------------------ Fixture card ------------------------------ */

/** A session / match rendered like a match-day fixture: home side, date
    block, meta line, status, actions. */
export function FixtureCard({
  home,
  title,
  meta,
  dateLabel,
  status,
  badge,
  href,
  actions,
}: {
  home: string
  title: string
  meta: string
  dateLabel: string
  status?: ReactNode
  badge?: ReactNode
  href?: string
  actions?: ReactNode
}) {
  const inner = (
    <>
      <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-charcoal-600 bg-charcoal-950 px-3 py-2 text-center">
        <span className="font-display text-lg leading-none font-bold text-gold-400">
          {dateLabel}
        </span>
        <span className="mt-1 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
          Matchday
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-[0.2em] text-brand-400 uppercase">
          {home}
          {badge}
        </p>
        <p className="mt-1 truncate text-base font-semibold text-white">{title}</p>
        <p className="mt-0.5 truncate text-sm text-zinc-400">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {status}
        {actions}
      </div>
    </>
  )

  const cls =
    'stadium-card flex flex-wrap items-center gap-4 px-5 py-4 transition hover:border-brand-500/60'

  return href ? (
    <Link to={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

/* ----------------------------- Floating ball ------------------------------ */

/** Decorative football motif (inline SVG, no image asset). */
export function FloatingBall({
  className = '',
  size = 72,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`float-y pointer-events-none opacity-25 ${className}`}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="29" fill="#f4f4f5" />
      <polygon points="32,22 41,28.5 37.5,39 26.5,39 23,28.5" fill="#0a0a0a" />
      <path
        d="M32 22 V8 M41 28.5 L55 24 M37.5 39 L46 51 M26.5 39 L18 51 M23 28.5 L9 24"
        stroke="#0a0a0a"
        strokeWidth="2.5"
        fill="none"
      />
      <polygon points="32,4 35,6.5 33.8,10 30.2,10 29,6.5" fill="#0a0a0a" />
      <polygon points="55,20 58,22.5 56.8,26 53.2,26 52,22.5" fill="#0a0a0a" />
      <polygon points="46,47 49,49.5 47.8,53 44.2,53 43,49.5" fill="#0a0a0a" />
      <polygon points="18,47 21,49.5 19.8,53 16.2,53 15,49.5" fill="#0a0a0a" />
      <polygon points="9,20 12,22.5 10.8,26 7.2,26 6,22.5" fill="#0a0a0a" />
      <circle cx="32" cy="32" r="29" fill="none" stroke="#d4af37" strokeWidth="2" />
    </svg>
  )
}

/* ------------------------- WebGL support + fallback ----------------------- */

export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
    )
  } catch {
    return false
  }
}

/** Static night-pitch fallback used when WebGL is unavailable. */
export function PitchFallback({ label }: { label?: string }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      role="img"
      aria-label={label ?? 'Floodlit football pitch at night'}
    >
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(227,6,19,0.35),transparent_65%),linear-gradient(180deg,#0a0f0c_0%,#0d1f14_55%,#08130c_100%)]" />
      {/* Pitch lines */}
      <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-white/25" />
      <div className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
      <div className="absolute top-0 bottom-0 left-8 w-px bg-white/15" />
      <div className="absolute top-0 bottom-0 right-8 w-px bg-white/15" />
      <div className="flood-glow absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-brand-500/25 blur-3xl" />
      <FloatingBall className="absolute right-[12%] bottom-[18%]" size={96} />
    </div>
  )
}

/* ------------------------------ Lazy 3D scene ----------------------------- */

/**
 * The R3F stadium scene is code-split: three.js only downloads when this
 * mounts. While it loads (or when WebGL is missing) the static pitch shows.
 */
const StadiumScene = lazy(
  () => import('./StadiumScene') as Promise<{ default: ComponentType }>
)

export function StadiumHeroScene() {
  if (!supportsWebGL()) return <PitchFallback />
  return (
    <Suspense fallback={<PitchFallback />}>
      <StadiumScene />
    </Suspense>
  )
}
