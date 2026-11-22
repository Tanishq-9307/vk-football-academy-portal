import { lazy } from 'react'
import { Award, MapPin, Shield, Target, Trophy, Users } from 'lucide-react'
import Logo from '../../components/Logo'
import { Reveal } from '../../components/ui'
import { ThreeStage } from '../../components/three/ThreeStage'

const Crest3D = lazy(() => import('../../components/three/Crest3D'))

const PILLARS = [
  {
    icon: Users,
    title: 'Grassroots to youth',
    body: 'Players join young and grow through the age groups — U12, U14, U16 and U18 — with training that matches their stage of development. The focus is always on the long game: technique, understanding and character before results.',
  },
  {
    icon: Shield,
    title: 'Qualified coaches',
    body: 'Sessions are led by nationally licensed coaches, including former academy players who have come back to coach the next generation. Every session is planned in advance, and attendance is tracked per player.',
  },
  {
    icon: Target,
    title: 'A real pathway',
    body: 'The academy competes in leagues and tournaments, runs trials for international exposure, and works with partners such as YUVHA Games, the YG Asian Football 7 League and International Football Tours — opening doors beyond Thane for players who earn them.',
  },
  {
    icon: Trophy,
    title: 'Proof it works',
    body: 'VKFA player Sharvil Deorukhkar signed for CD Chamartín Vergara Alcobendas, Madrid, and is playing U13 División de Honor Infantil (RFFM) in the 2026/27 season.',
  },
]

export default function About() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal>
        <p className="eyebrow">About the academy</p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl leading-[1.02] font-bold tracking-wide text-white uppercase sm:text-6xl">
          Developing players, building believers
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">
          VK Football Academy is a professional youth football academy based at
          Urban Turf, Rustomjee Urbania, Majiwada, Thane West. Founded by{' '}
          <strong className="text-white">Vaibhav Karpe</strong>, the academy
          coaches players from grassroots to youth football, with qualified
          nationally licensed coaches.
        </p>
        <ul className="mt-8 flex flex-wrap gap-2.5">
          {['Ages 5–18', 'Boys & Girls', 'AIFF & AFC Licensed Coaches'].map(
            (chip) => (
              <li
                key={chip}
                className="rounded-full border border-charcoal-700 bg-charcoal-900/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300"
              >
                {chip}
              </li>
            ),
          )}
        </ul>
      </Reveal>

      {/* Scrollytelling — the 3D crest stays pinned on one side while one
          idea per screen scrolls past on the other. The crest is
          interactive (drag to rotate, tap to spin). */}
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ThreeStage
            scene={Crest3D}
            fallback={
              <div className="flex items-center justify-center py-10">
                <div className="animate-float-slow">
                  <Logo size={280} />
                </div>
              </div>
            }
            label="VK Football Academy crest in 3D"
            className="relative h-80 sm:h-96 lg:h-[62vh]"
          />
        </div>
        <div>
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className="flex min-h-[55vh] flex-col justify-center border-b border-charcoal-800/60 py-10 last:border-0"
            >
              <Reveal delay={(i % 2) * 90}>
                <p className="font-display text-6xl font-bold text-gold-400/25">
                  0{i + 1}
                </p>
                <span className="mt-5 inline-flex rounded-2xl border border-gold-600/40 bg-gold-500/10 p-3.5 text-gold-400">
                  <p.icon className="h-6 w-6" />
                </span>
                <h2 className="font-display mt-5 text-2xl font-semibold tracking-wide text-white uppercase sm:text-3xl">
                  {p.title}
                </h2>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-zinc-400">
                  {p.body}
                </p>
              </Reveal>
            </div>
          ))}
        </div>
      </div>

      <Reveal>
        <section className="card mt-10 p-8 sm:p-10">
          <p className="eyebrow">Our values</p>
          <h2 className="font-display mt-3 text-2xl font-semibold tracking-wide text-white uppercase sm:text-3xl">
            What we stand for
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              { title: 'Discipline', body: 'On time, prepared, accountable — in training and in life.' },
              { title: 'Development', body: 'Every player has a plan and a next step.' },
              { title: 'Dedication', body: 'Effort, attitude and consistency — every single session.' },
            ].map((v) => (
              <div key={v.title} className="border-l-2 border-gold-400/60 pl-5">
                <p className="font-display text-lg font-semibold tracking-wide text-white uppercase">
                  {v.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{v.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 space-y-2.5 border-t border-charcoal-700/70 pt-7 text-sm text-zinc-400">
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              Urban Turf, Rustomjee Urbania, Majiwada, Thane West, Maharashtra
            </p>
            <p className="flex items-center gap-2.5">
              <Award className="h-4 w-4 shrink-0 text-brand-500" />
              VKFA — Developing Players, Building Believers
            </p>
          </div>
        </section>
      </Reveal>
    </div>
  )
}
