import { Award, GraduationCap, UserRound } from 'lucide-react'
import { Reveal, TiltCard } from '../../components/ui'

export default function Coaches() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal>
        <p className="eyebrow">Coaches</p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl leading-[1.02] font-bold tracking-wide text-white uppercase sm:text-6xl">
          Coached by people who've lived it
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-300">
          VK Football Academy's sessions are led by qualified nationally licensed
          coaches. One of them came through the academy himself — and came back
          to coach the next generation.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Reveal>
          <TiltCard className="h-full">
            <article className="card-gold relative h-full overflow-hidden p-8">
              <span
                className="absolute inset-x-0 top-0 h-1 bg-gold-400"
                aria-hidden="true"
              />
              <span className="inline-flex rounded-2xl border border-gold-600/40 bg-gold-500/10 p-4 text-gold-400">
                <UserRound className="h-8 w-8" />
              </span>
              <h2 className="font-display mt-6 text-3xl font-semibold tracking-wide text-white uppercase">
                Dhyeya Tiwari
              </h2>
              <p className="mt-1.5 text-sm font-semibold tracking-wide text-brand-400">
                Coach · AIFF D Licence
              </p>
              <p className="mt-5 leading-relaxed text-zinc-300">
                An ex-VKFA player who completed his AIFF D Licence and returned to
                the academy as a coach — proof of the pathway the academy builds,
                from player to coach.
              </p>
              <p className="mt-6 flex items-center gap-2 rounded-xl border border-charcoal-700 bg-charcoal-900 px-4 py-3 text-sm text-zinc-300">
                <GraduationCap className="h-4 w-4 shrink-0 text-gold-400" />
                AIFF D Licence holder
              </p>
            </article>
          </TiltCard>
        </Reveal>

        <Reveal delay={100}>
          <article className="card flex h-full flex-col justify-between p-8">
            <div>
              <span className="inline-flex rounded-2xl bg-charcoal-800 p-4 text-zinc-400">
                <Award className="h-8 w-8" />
              </span>
              <h2 className="font-display mt-6 text-3xl font-semibold tracking-wide text-white uppercase">
                The wider coaching team
              </h2>
              <p className="mt-5 leading-relaxed text-zinc-300">
                The academy is led by founder Vaibhav Karpe and staffed by
                qualified nationally licensed coaches across the age groups.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Full coach profiles — with photos and specialisations — are being
                added. Only verified information is shown here.
              </p>
            </div>
            <p className="mt-8 border-t border-charcoal-700/70 pt-5 text-xs font-semibold tracking-[0.2em] text-gold-400 uppercase">
              AIFF &amp; AFC Licensed Coaches
            </p>
          </article>
        </Reveal>
      </div>
    </div>
  )
}
