import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  ClipboardList,
  MapPin,
  Shield,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import Football3D from '../../components/Football3D'
import Reveal from '../../components/Reveal'

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
  { group: 'U12', focus: 'First touch, 1v1 confidence and love of the game.' },
  { group: 'U14', focus: 'Technique under pressure, small-sided decisions, teamwork.' },
  { group: 'U16', focus: 'Tactical understanding, positional play and physical development.' },
  { group: 'U18', focus: 'Performance football — preparing players for senior and higher-level pathways.' },
]

const HERO_CHIPS = [
  { label: 'Ages 5–18', sub: 'Boys & Girls', depth: 10, pos: 'left-0 top-10 sm:left-2' },
  { label: 'AIFF & AFC', sub: 'Licensed coaches', depth: -14, pos: 'right-0 top-24 sm:right-2' },
  { label: 'Tournaments', sub: 'Exposure trips', depth: 7, pos: 'bottom-10 left-4 sm:left-10' },
]

export default function Home() {
  const heroRef = useRef<HTMLElement>(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  const handleHeroPointer = (e: React.PointerEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return
    setPointer({
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
    })
  }

  return (
    <div>
      {/* Hero — calm, airy, the 3D ball as centrepiece */}
      <section
        ref={heroRef}
        onPointerMove={handleHeroPointer}
        onPointerLeave={() => setPointer({ x: 0, y: 0 })}
        className="relative overflow-hidden border-b border-white/10"
      >
        <div
          className="glow-red pointer-events-none absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full"
          aria-hidden="true"
        />
        <div
          className="glow-gold pointer-events-none absolute bottom-[-20%] left-[-5%] h-[420px] w-[420px] rounded-full"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="glass-soft inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium tracking-[0.16em] text-zinc-300 uppercase">
              <MapPin className="h-3.5 w-3.5 text-gold-400" />
              Rustomjee Urbania · Majiwada · Thane West
            </p>
            <h1 className="font-display mt-7 text-5xl leading-[1.04] font-medium tracking-wide text-white sm:text-6xl lg:text-7xl">
              Building Better Players.{' '}
              <span className="text-zinc-400">Building Better People.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">
              VK Football Academy develops young footballers from grassroots
              to youth football — with nationally licensed coaches, structured
              sessions and a clear pathway for every player.
            </p>
            <p className="font-display mt-5 text-lg font-medium tracking-[0.3em] text-gold-400 uppercase">
              Develop. Compete. Excel.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/programmes"
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/10 transition hover:bg-brand-600"
              >
                Explore programmes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-white/25"
              >
                Enquire about trials
              </Link>
            </div>
          </div>

          {/* 3D ball + floating glass chips at different depths */}
          <div className="relative">
            <Football3D />
            {HERO_CHIPS.map((chip) => (
              <div
                key={chip.label}
                className={`glass pointer-events-none absolute ${chip.pos} hidden rounded-2xl px-4 py-3 transition-transform duration-300 ease-out sm:block`}
                style={{
                  transform: `translate3d(${pointer.x * chip.depth}px, ${pointer.y * chip.depth}px, 0)`,
                }}
                aria-hidden="true"
              >
                <p className="text-sm font-semibold text-white">{chip.label}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{chip.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-400 uppercase">
            What we stand for
          </p>
          <h2 className="font-display mt-3 text-3xl font-medium tracking-normal text-white sm:text-4xl">
            Three values, every session
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 90}>
              <article className="glass group h-full rounded-3xl p-7 transition hover:border-gold-500/40">
                <span className="glass-soft inline-flex rounded-2xl p-3 text-gold-400">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="font-display mt-5 text-xl font-medium tracking-normal text-white">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{v.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Age groups */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-gold-400 uppercase">
                  Programmes
                </p>
                <h2 className="font-display mt-3 text-3xl font-medium tracking-normal text-white sm:text-4xl">
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
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AGE_GROUPS.map((a, i) => (
              <Reveal key={a.group} delay={i * 80}>
                <article className="glass h-full rounded-3xl p-7 transition hover:border-gold-500/40">
                  <p className="font-display text-5xl font-medium text-white">
                    {a.group}
                  </p>
                  <div className="mt-4 h-px w-10 bg-gold-500/50" aria-hidden="true" />
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                    {a.focus}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Success story */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[2rem] p-8 sm:p-12">
            <div
              className="glow-gold pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full"
              aria-hidden="true"
            />
            <div className="relative">
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-gold-400 uppercase">
                <Award className="h-4 w-4" />
                Academy success story
              </p>
              <h2 className="font-display mt-4 max-w-2xl text-3xl leading-tight font-medium tracking-normal text-white sm:text-4xl">
                From Rustomjee Urbania to Madrid, Spain
              </h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-zinc-300">
                VKFA player <strong className="text-white">Sharvil Deorukhkar</strong>{' '}
                signed for CD Chamartín Vergara Alcobendas, Madrid, and is playing
                U13 División de Honor Infantil (RFFM) in the 2026/27 season — proof
                of what the academy's pathway can produce.
              </p>
              <Link
                to="/about"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300"
              >
                More about the academy <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Coach tools strip */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <article className="glass h-full rounded-3xl p-7 transition hover:border-gold-500/40">
              <ClipboardList className="h-6 w-6 text-gold-400" />
              <h3 className="font-display mt-4 text-xl font-medium tracking-normal text-white">
                Session plans, organised
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Coaches plan every session — objectives, drills, tactics and
                conditioning — and keep every plan linked to its training session.
              </p>
            </article>
          </Reveal>
          <Reveal delay={90}>
            <article className="glass h-full rounded-3xl p-7 transition hover:border-gold-500/40">
              <Users className="h-6 w-6 text-gold-400" />
              <h3 className="font-display mt-4 text-xl font-medium tracking-normal text-white">
                Attendance, tracked
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Attendance is marked per session and per player, so coaches and
                the academy can see who is turning up — and who needs a nudge.
              </p>
            </article>
          </Reveal>
        </div>
        <p className="mt-10 text-center text-sm text-zinc-500">
          Are you a VKFA coach or admin?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
            Sign in to the portal →
          </Link>
        </p>
      </section>
    </div>
  )
}
