import { Award, MapPin, Shield, Target, Trophy, Users } from 'lucide-react'
import { SectionHeading } from '../../components/stadium'

export default function About() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeading
        kicker="About the academy"
        title="Developing players, building believers"
      />
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-300">
        VK Football Academy is a professional youth football academy based at
        Urban Turf, Rustomjee Urbania, Majiwada, Thane West. Founded by{' '}
        <strong className="text-white">Vaibhav Karpe</strong>, the academy
        coaches players from grassroots to youth football, with qualified
        nationally licensed coaches.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <article className="stadium-card p-6">
          <Users className="h-6 w-6 text-brand-500" />
          <h2 className="font-display mt-3 text-xl font-semibold tracking-wide text-white uppercase">
            Grassroots to youth
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Players join young and grow through the age groups — U12, U14, U16
            and U18 — with training that matches their stage of development.
            The focus is always on the long game: technique, understanding and
            character before results.
          </p>
        </article>
        <article className="stadium-card p-6">
          <Shield className="h-6 w-6 text-brand-500" />
          <h2 className="font-display mt-3 text-xl font-semibold tracking-wide text-white uppercase">
            Qualified coaches
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Sessions are led by nationally licensed coaches, including former
            academy players who have come back to coach the next generation.
            Every session is planned in advance, and attendance is tracked per
            player.
          </p>
        </article>
        <article className="stadium-card p-6">
          <Target className="h-6 w-6 text-brand-500" />
          <h2 className="font-display mt-3 text-xl font-semibold tracking-wide text-white uppercase">
            A real pathway
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            The academy competes in leagues and tournaments, runs trials for
            international exposure, and works with partners such as YUVHA
            Games, the YG Asian Football 7 League and International Football
            Tours — opening doors beyond Thane for players who earn them.
          </p>
        </article>
        <article className="stadium-card p-6">
          <Trophy className="h-6 w-6 text-brand-500" />
          <h2 className="font-display mt-3 text-xl font-semibold tracking-wide text-white uppercase">
            Proof it works
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            VKFA player Sharvil Deorukhkar signed for CD Chamartín Vergara
            Alcobendas, Madrid, and is playing U13 División de Honor Infantil
            (RFFM) in the 2026/27 season.
          </p>
        </article>
      </div>

      <section className="mt-12 stadium-card stadium-card-lg p-8">
        <h2 className="font-display text-2xl font-semibold tracking-wide text-white uppercase">
          Our values
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg font-semibold text-brand-500 uppercase">
              Discipline
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              On time, prepared, accountable — in training and in life.
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-brand-500 uppercase">
              Development
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Every player has a plan and a next step.
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-brand-500 uppercase">
              Dedication
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Effort, attitude and consistency — every single session.
            </p>
          </div>
        </div>
        <p className="mt-8 flex items-start gap-2 text-sm text-zinc-400">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          Urban Turf, Rustomjee Urbania, Majiwada, Thane West, Maharashtra
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
          <Award className="h-4 w-4 shrink-0 text-brand-500" />
          VKFA — Developing Players, Building Believers
        </p>
      </section>
    </div>
  )
}
