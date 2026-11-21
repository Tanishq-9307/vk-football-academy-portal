import { lazy } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  ClipboardList,
  GraduationCap,
  MapPin,
  Shield,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import Logo from '../../components/Logo'
import { Reveal, TiltCard } from '../../components/ui'
import { ThreeStage } from '../../components/three/ThreeStage'

const HeroScene = lazy(() => import('../../components/three/HeroScene'))

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
  { group: 'U12', focus: 'First touch, 1v1 confidence and love of the game.', tag: 'Foundations' },
  { group: 'U14', focus: 'Technique under pressure, small-sided decisions, teamwork.', tag: 'Development' },
  { group: 'U16', focus: 'Tactical understanding, positional play and physical development.', tag: 'Performance' },
  { group: 'U18', focus: 'Performance football — preparing players for senior and higher-level pathways.', tag: 'Pathway' },
]

const MARQUEE = [
  'Develop',
  'Compete',
  'Excel',
  'Discipline',
  'Development',
  'Dedication',
]

function HeroFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-float-slow relative">
        <div
          className="absolute inset-0 -z-10 scale-125 rounded-full bg-brand-500/25 blur-3xl"
          aria-hidden="true"
        />
        <Logo size={260} />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-charcoal-800">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(55% 70% at 82% 8%, rgba(227,6,19,0.30) 0%, transparent 62%), radial-gradient(45% 55% at 8% 95%, rgba(212,175,55,0.12) 0%, transparent 60%), radial-gradient(50% 60% at 10% 100%, rgba(227,6,19,0.12) 0%, transparent 60%)',
          }}
        />
        <div className="pitch-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <p
          className="ghost-word pointer-events-none absolute -bottom-6 left-0 hidden text-[22vw] select-none lg:block"
          aria-hidden="true"
        >
          VKFA
        </p>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-500/50 bg-brand-500/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-brand-300 uppercase">
              <MapPin className="h-3.5 w-3.5" />
              Rustomjee Urbania · Majiwada · Thane West
            </p>
            <h1 className="font-display mt-6 max-w-3xl text-6xl leading-[0.98] font-bold tracking-wide text-white uppercase sm:text-7xl xl:text-8xl">
              Building Better Players.{' '}
              <span className="bg-gradient-to-r from-brand-500 via-brand-400 to-gold-400 bg-clip-text text-transparent">
                Building Better People.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
              VK Football Academy develops young footballers from grassroots to
              youth football — with nationally licensed coaches, structured
              sessions and a clear pathway for every player.
            </p>
            <p className="font-display mt-5 text-xl font-semibold tracking-[0.25em] text-gold-400 uppercase">
              Develop. Compete. Excel.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/programmes"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-500/30 transition hover:bg-brand-600 active:scale-[0.98]"
              >
                Explore programmes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-charcoal-600 bg-charcoal-800/80 px-6 py-3.5 text-sm font-semibold text-zinc-100 backdrop-blur transition hover:border-gold-400/60 hover:bg-charcoal-700 active:scale-[0.98]"
              >
                Enquire about trials
              </Link>
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
          <div className="relative lg:col-span-5">
            <ThreeStage
              scene={HeroScene}
              fallback={<HeroFallback />}
              label="Interactive 3D football"
              className="relative h-72 sm:h-96 lg:h-[540px]"
            />
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="overflow-hidden border-b border-charcoal-800 bg-charcoal-900 py-3.5" aria-hidden="true">
        <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((word, i) => (
            <span key={i} className="flex items-center gap-8">
              <span className="font-display text-lg font-semibold tracking-[0.25em] text-zinc-500 uppercase">
                {word}
              </span>
              <span className="h-2 w-2 rotate-45 bg-brand-500" />
            </span>
          ))}
        </div>
      </div>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <p className="eyebrow">What we stand for</p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-wide text-white uppercase sm:text-4xl">
            More than football
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 90}>
              <TiltCard className="h-full">
                <article className="card card-hover h-full p-7">
                  <span className="inline-flex rounded-2xl border border-gold-600/40 bg-gold-500/10 p-3.5 text-gold-400">
                    <v.icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-display mt-5 text-xl font-semibold tracking-wide text-white uppercase">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{v.body}</p>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Age groups */}
      <section className="border-y border-charcoal-800 bg-charcoal-900">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Programmes</p>
                <h2 className="font-display mt-3 text-3xl font-semibold tracking-wide text-white uppercase sm:text-4xl">
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
                <TiltCard className="h-full">
                  <article className="card card-hover group relative h-full overflow-hidden p-7">
                    <span
                      className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 to-gold-400 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                    <p className="font-display text-5xl font-bold text-white transition-colors group-hover:text-brand-500">
                      {a.group}
                    </p>
                    <p className="mt-2 inline-flex rounded-full border border-gold-600/50 bg-gold-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-widest text-gold-400 uppercase">
                      {a.tag}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-zinc-400">{a.focus}</p>
                  </article>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Success story */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="card-gold relative overflow-hidden p-8 sm:p-12">
            <div className="pitch-lines pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
            <div className="relative">
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-gold-400 uppercase">
                <Award className="h-4 w-4" />
                Academy success story
              </p>
              <h2 className="font-display mt-4 max-w-2xl text-3xl leading-tight font-semibold tracking-wide text-white uppercase sm:text-5xl">
                From Rustomjee Urbania to Madrid, Spain
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-300">
                VKFA player <strong className="text-white">Sharvil Deorukhkar</strong>{' '}
                signed for CD Chamartín Vergara Alcobendas, Madrid, and is playing
                U13 División de Honor Infantil (RFFM) in the 2026/27 season — proof
                of what the academy's pathway can produce.
              </p>
              <Link
                to="/about"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-charcoal-950 shadow-lg transition hover:bg-zinc-200 active:scale-[0.98]"
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
            <article className="card card-hover h-full p-7">
              <span className="inline-flex rounded-2xl bg-brand-500/15 p-3.5 text-brand-400">
                <ClipboardList className="h-6 w-6" />
              </span>
              <h3 className="font-display mt-4 text-xl font-semibold tracking-wide text-white uppercase">
                Session plans, organised
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Coaches plan every session — objectives, drills, tactics and
                conditioning — and keep every plan linked to its training session.
              </p>
            </article>
          </Reveal>
          <Reveal delay={100}>
            <article className="card card-hover h-full p-7">
              <span className="inline-flex rounded-2xl bg-brand-500/15 p-3.5 text-brand-400">
                <Users className="h-6 w-6" />
              </span>
              <h3 className="font-display mt-4 text-xl font-semibold tracking-wide text-white uppercase">
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
