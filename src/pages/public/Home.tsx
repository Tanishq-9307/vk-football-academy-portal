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
import {
  FloatingBall,
  Reveal,
  SectionHeading,
  StadiumHeroScene,
  Ticker,
  TiltCard,
} from '../../components/stadium'

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

export default function Home() {
  return (
    <div>
      {/* 3D stadium hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-[92svh] min-h-[620px] w-full">
          <StadiumHeroScene />
          {/* Readability gradient over the scene */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                'linear-gradient(180deg, rgba(5,7,10,0.55) 0%, rgba(5,7,10,0.15) 35%, rgba(5,7,10,0.55) 78%, #0c0c0e 100%)',
            }}
          />
          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16 sm:px-6 sm:pb-20">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-500/50 bg-black/50 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-brand-300 uppercase backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              Rustomjee Urbania · Majiwada · Thane West
            </p>
            <h1 className="font-display mt-6 max-w-5xl text-[13vw] leading-[0.95] font-bold tracking-wide text-white uppercase sm:text-8xl">
              Building Better
              <br />
              <span className="text-brand-500">Players.</span>{' '}
              <span className="text-outline">Building</span>
              <br />
              Better People.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-200">
              VK Football Academy develops young footballers from grassroots to
              youth football — with nationally licensed coaches, structured
              sessions and a clear pathway for every player.
            </p>
            <p className="font-display mt-4 text-xl font-semibold tracking-[0.25em] text-gold-400 uppercase">
              Develop. Compete. Excel.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/programmes"
                className="btn-angle inline-flex items-center gap-2 bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
              >
                Explore programmes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="btn-angle-outline inline-flex items-center gap-2 border border-white/30 bg-black/40 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-white/60"
              >
                Enquire about trials
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Ticker />

      {/* Values */}
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <FloatingBall className="absolute top-8 right-4 hidden lg:block" size={84} />
        <Reveal>
          <SectionHeading
            kicker="What we stand for"
            title="The VKFA way"
            intro="Three values, drilled into every session — on the pitch and beyond it."
          />
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 120}>
              <TiltCard className="h-full">
                <article className="stadium-card flex h-full flex-col p-7">
                  <span className="inline-flex w-fit rounded-xl bg-brand-500/15 p-3 text-brand-400">
                    <v.icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-display mt-5 text-2xl font-bold tracking-wide text-white uppercase">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{v.body}</p>
                  <p className="font-display text-outline mt-auto pt-6 text-6xl leading-none font-bold select-none" aria-hidden="true">
                    0{i + 1}
                  </p>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Age groups — squad-number tiles */}
      <section className="diag-top border-t border-charcoal-800 bg-gradient-to-b from-brand-900/40 via-charcoal-900 to-charcoal-950 pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                kicker="Programmes"
                title="Pick your squad"
              />
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
              <Reveal key={a.group} delay={i * 100}>
                <TiltCard className="h-full">
                  <Link to="/programmes" className="stadium-card block h-full p-7 transition hover:border-gold-500/60">
                    <p className="font-display text-7xl leading-none font-bold text-brand-500">
                      {a.group}
                    </p>
                    <p className="font-display mt-4 text-sm font-semibold tracking-[0.25em] text-gold-400 uppercase">
                      Squad {a.group}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                      {a.focus}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                      Train with us <ArrowRight className="h-4 w-4 text-brand-400" />
                    </span>
                  </Link>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Success story — match report */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="stadium-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal-700 bg-charcoal-950 px-7 py-4">
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-gold-400 uppercase">
                <Award className="h-4 w-4" />
                Match report · Academy success story
              </p>
              <p className="font-display text-sm font-bold tracking-widest text-white uppercase">
                VKFA <span className="text-brand-500">1 — 0</span> The Odds
              </p>
            </div>
            <div className="p-8 sm:p-10">
              <h2 className="font-display max-w-2xl text-3xl leading-tight font-bold tracking-wide text-white uppercase sm:text-5xl">
                From Rustomjee Urbania to{' '}
                <span className="text-brand-500">Madrid, Spain</span>
              </h2>
              <p className="mt-5 max-w-2xl leading-relaxed text-zinc-300">
                VKFA player <strong className="text-white">Sharvil Deorukhkar</strong>{' '}
                signed for CD Chamartín Vergara Alcobendas, Madrid, and is playing
                U13 División de Honor Infantil (RFFM) in the 2026/27 season — proof
                of what the academy's pathway can produce.
              </p>
              <Link
                to="/about"
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300"
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
            <TiltCard className="h-full">
              <article className="stadium-card flex h-full flex-col p-7">
                <ClipboardList className="h-7 w-7 text-brand-500" />
                <h3 className="font-display mt-4 text-2xl font-bold tracking-wide text-white uppercase">
                  Session plans, organised
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Coaches plan every session — objectives, drills, tactics and
                  conditioning — and keep every plan linked to its training session.
                </p>
              </article>
            </TiltCard>
          </Reveal>
          <Reveal delay={120}>
            <TiltCard className="h-full">
              <article className="stadium-card flex h-full flex-col p-7">
                <Users className="h-7 w-7 text-brand-500" />
                <h3 className="font-display mt-4 text-2xl font-bold tracking-wide text-white uppercase">
                  Attendance, tracked
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Attendance is marked per session and per player, so coaches and
                  the academy can see who is turning up — and who needs a nudge.
                </p>
              </article>
            </TiltCard>
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
