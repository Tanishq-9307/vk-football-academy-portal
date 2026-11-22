import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  GraduationCap,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import Logo from '../../components/Logo'
import { CountUp, Magnetic, Reveal, TiltCard } from '../../components/ui'
import Preloader from '../../components/Preloader'

const ScrollBall = lazy(() => import('../../components/three/ScrollBall'))

const VALUES = [
  {
    icon: Shield,
    title: 'Discipline',
    body: 'Structure in every session — on time, prepared, and accountable, on and off the pitch.',
  },
  {
    icon: Target,
    title: 'Development',
    body: 'Every player has a plan. Training is built around age, ability and the next step, not just the next match.',
  },
  {
    icon: Trophy,
    title: 'Dedication',
    body: 'Progress takes repetition. We coach the habits — effort, attitude and consistency — that carry players further.',
  },
]

const AGE_GROUPS = [
  {
    group: 'U12',
    ages: 'Ages 11–12',
    focus: 'First touch, 1v1 confidence and love of the game.',
    tag: 'Foundations',
  },
  {
    group: 'U14',
    ages: 'Ages 13–14',
    focus: 'Technique under pressure, small-sided decisions, teamwork.',
    tag: 'Development',
  },
  {
    group: 'U16',
    ages: 'Ages 15–16',
    focus: 'Tactical understanding, positional play and physical development.',
    tag: 'Performance',
  },
  {
    group: 'U18',
    ages: 'Ages 17–18',
    focus: 'Performance football — preparing players for senior and higher-level pathways.',
    tag: 'Pathway',
  },
]

const STORY_BLOCKS = [
  'Sharvil Deorukhkar signed for CD Chamartín Vergara Alcobendas, Madrid.',
  'He is playing U13 División de Honor Infantil (RFFM) in the 2026/27 season.',
  'From grassroots football in Thane to competitive youth football in Spain — proof of what the academy’s pathway can produce.',
]

const MARQUEE = ['Discipline', 'Development', 'Dedication']

function BallFallback() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="animate-float-slow">
        <Logo size={260} />
      </div>
    </div>
  )
}

export default function Home() {
  // Preloader shows once per session; the hero headline rises out of its
  // masks as the wipe lifts.
  const [showPreloader, setShowPreloader] = useState(() => {
    try {
      return window.sessionStorage.getItem('vkfa-preloader-seen') === null
    } catch {
      return true
    }
  })
  const [ready, setReady] = useState(!showPreloader)

  const handlePreloaderDone = useCallback(() => {
    setReady(true)
    try {
      window.sessionStorage.setItem('vkfa-preloader-seen', '1')
    } catch {
      /* session storage unavailable — preloader simply shows again */
    }
    window.setTimeout(() => setShowPreloader(false), 850)
  }, [])

  // Keep the page at the top while the preloader is up.
  useEffect(() => {
    if (showPreloader) window.scrollTo(0, 0)
  }, [showPreloader])

  return (
    <div id="home-root" className="relative">
      {showPreloader && <Preloader onDone={handlePreloaderDone} />}

      {/* Hero — 100svh. The 3D ball is a fixed stage (see ScrollBall):
          on desktop it sits in front of the headline, on the right; on
          mobile it stacks below the headline in the reserved slot. */}
      <section className="relative min-h-svh overflow-hidden">
        <div className="relative mx-auto grid max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:grid-cols-12 lg:pt-24">
          {/* z-2: the ball is z-5 in front of the type at rest, and drops
              to z-1 (behind this text) as soon as scrolling starts. */}
          <div className="relative z-[2] lg:col-span-8">
            <p className="text-[11px] font-bold tracking-[0.2em] text-gold-400 uppercase sm:text-xs">
              VK Football Academy — Thane · Ages 5–18
            </p>
            <h1 className="font-display mt-6 text-[clamp(3.75rem,10.5vw,10rem)] leading-[0.88] font-bold tracking-[-0.03em] text-white uppercase">
              <span className={`mask-line ${ready ? 'ready' : ''}`}>
                <span style={{ transitionDelay: '0ms' }}>Building</span>
              </span>
              <span className={`mask-line ${ready ? 'ready' : ''}`}>
                <span className="text-outline" style={{ transitionDelay: '90ms' }}>
                  Better
                </span>
              </span>
              <span className={`mask-line ${ready ? 'ready' : ''}`}>
                <span className="text-brand-500" style={{ transitionDelay: '180ms' }}>
                  Players.
                </span>
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-zinc-300">
              VK Football Academy develops young footballers from grassroots
              to youth football — with nationally licensed coaches, structured
              sessions and a clear pathway for every player.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <Link
                  to="/programmes"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-500/30 transition hover:bg-brand-600 active:scale-[0.98]"
                >
                  Explore programmes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <Magnetic>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-gold-500/60 bg-gold-500/10 px-6 py-3.5 text-sm font-semibold text-gold-300 transition hover:border-gold-400 hover:bg-gold-500/20 active:scale-[0.98]"
                >
                  Book a free trial
                </Link>
              </Magnetic>
            </div>
            <ul className="mt-10 flex flex-wrap gap-2.5">
              {[
                { icon: Users, text: 'Ages 5–18 · Boys & Girls' },
                { icon: GraduationCap, text: 'AIFF & AFC Licensed Coaches' },
                { icon: MapPin, text: 'Urban Turf, Rustomjee Urbania' },
              ].map((chip) => (
                <li
                  key={chip.text}
                  className="inline-flex items-center gap-2 rounded-full border border-charcoal-700 bg-charcoal-900/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300"
                >
                  <chip.icon className="h-3.5 w-3.5 text-gold-400" />
                  {chip.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-4">
            <Suspense fallback={<BallFallback />}>
              <ScrollBall />
            </Suspense>
          </div>
        </div>
        {/* Scroll cue — desktop only; on mobile the ball is the cue. */}
        <div
          className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex"
          aria-hidden="true"
        >
          <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase">
            Scroll
          </span>
          <span className="scroll-cue-line" />
        </div>
      </section>

      {/* Everything below the hero sits in a z-2 wrapper: the travelling
          ball (z-1) passes behind this content, above the page ground. */}
      <div className="relative z-[2]">
        {/* Marquee band — full-bleed, gold on black */}
        <div
          className="overflow-hidden bg-black py-4"
          aria-hidden="true"
        >
          <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
            {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map(
              (word, i) => (
                <span key={i} className="flex items-center gap-8">
                  <span className="font-display text-xl font-semibold tracking-[0.25em] text-gold-400 uppercase">
                    {word}
                  </span>
                  <span className="h-2 w-2 rotate-45 bg-brand-500" />
                </span>
              ),
            )}
          </div>
        </div>

        {/* Values — "Why VKFA" */}
        <section id="why-vkfa" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Reveal>
            <p className="eyebrow">What we stand for</p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-wide text-white uppercase sm:text-4xl">
              More than football
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 90} className="h-full">
                <TiltCard className="h-full">
                  <article className="card card-hover h-full p-7">
                    <span className="inline-flex rounded-2xl border border-gold-600/40 bg-gold-500/10 p-3.5 text-gold-400">
                      <v.icon className="h-6 w-6" />
                    </span>
                    <h3 className="font-display mt-5 text-xl font-semibold tracking-wide text-white uppercase">
                      {v.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {v.body}
                    </p>
                  </article>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Stats band — count-up gold numerals (site's own numbers only) */}
        <section className="border-y border-charcoal-800 bg-charcoal-900">
          <div className="mx-auto grid max-w-7xl grid-cols-3 gap-6 px-4 py-14 text-center sm:px-6">
            {[
              { to: 100, suffix: '+', label: 'Players' },
              { to: 10, suffix: '+', label: 'Coaches' },
              { to: 2, suffix: '', label: 'Locations' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-6xl font-bold text-gold-400 sm:text-7xl">
                  <CountUp to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-zinc-400 uppercase">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Programmes — bento grid (2 large + 2 small frosted-glass tiles) */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Programmes · Ages 05–18</p>
                <h2
                  id="programmes-heading"
                  className="font-display mt-3 text-3xl font-semibold tracking-wide text-white uppercase sm:text-4xl"
                >
                  Age-group programmes
                </h2>
              </div>
              <Link
                to="/programmes"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300"
              >
                View all programmes <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {AGE_GROUPS.map((a, i) => (
              <Reveal
                key={a.group}
                delay={i * 80}
                className={`h-full ${i === 0 || i === 3 ? 'lg:col-span-2' : ''}`}
              >
                <TiltCard className="h-full">
                  <article className="glass-tile group relative h-full overflow-hidden p-7">
                    <p className="font-display text-6xl leading-none font-bold text-gold-400">
                      {a.group}
                    </p>
                    <p className="mt-3 inline-flex rounded-full border border-gold-600/50 bg-gold-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
                      {a.tag} · {a.ages}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                      {a.focus}
                    </p>
                  </article>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Success story — sticky panel, text scrolls past */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Reveal>
                <p className="eyebrow">Academy success story</p>
                <h2 className="font-display mt-4 text-4xl leading-[1.02] font-bold tracking-wide text-white uppercase sm:text-6xl">
                  From Rustomjee Urbania to Madrid, Spain
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-300">
                  VKFA player{' '}
                  <strong className="text-white">Sharvil Deorukhkar</strong>{' '}
                  — the academy’s proof that the pathway works.
                </p>
              </Reveal>
            </div>
            <div>
              {STORY_BLOCKS.map((b, i) => (
                <div
                  key={i}
                  className="flex min-h-[55vh] items-center border-b border-charcoal-800/60 py-10 last:border-0"
                >
                  <Reveal delay={i * 60}>
                    <p className="font-display text-6xl font-bold text-gold-400/25">
                      0{i + 1}
                    </p>
                    <p className="mt-4 text-2xl leading-snug font-medium text-zinc-100 sm:text-3xl">
                      {b}
                    </p>
                  </Reveal>
                </div>
              ))}
              <Reveal>
                <Link
                  to="/about"
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-charcoal-950 shadow-lg transition hover:bg-zinc-200 active:scale-[0.98]"
                >
                  More about the academy <ArrowRight className="h-4 w-4" />
                </Link>
              </Reveal>
            </div>
          </div>
        </section>
      </div>

      {/* Join / trials CTA — one saturated scarlet field, near-black type.
          The travelling ball returns large behind this text (z-5 stage,
          z-10 content). */}
      <section className="relative overflow-hidden bg-brand-500">
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-xs font-bold tracking-[0.25em] text-charcoal-950/70 uppercase">
            Free trial · Ages 5–18 · Boys &amp; Girls
          </p>
          <h2 className="font-display mt-4 text-[clamp(3.5rem,12vw,10rem)] leading-[0.9] font-bold tracking-[-0.02em] text-charcoal-950 uppercase">
            Book a
            <br />
            free trial
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed font-medium text-charcoal-950/80">
            Call or WhatsApp the academy to book a free trial session at Urban
            Turf, Rustomjee Urbania.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="tel:+917304666815"
              className="inline-flex items-center gap-2 rounded-xl bg-charcoal-950 px-6 py-3.5 text-sm font-semibold text-white shadow-xl transition hover:bg-black active:scale-[0.98]"
            >
              <Phone className="h-4 w-4" />
              Call +91 73046 66815
            </a>
            <a
              href="https://wa.me/917304666815"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-charcoal-950 shadow-xl transition hover:bg-zinc-200 active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp the academy
            </a>
          </div>
          <p className="mt-8 text-sm font-medium text-charcoal-950/70">
            Urban Turf, Rustomjee Urbania, Majiwada, Thane West · Open daily,
            12:00–8:00 pm
          </p>
        </div>
      </section>
    </div>
  )
}
