import { Award, GraduationCap, UserRound } from 'lucide-react'

export default function Coaches() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-brand-400 uppercase">
        Coaches
      </p>
      <h1 className="font-display mt-3 max-w-3xl text-4xl leading-tight font-medium tracking-normal text-white sm:text-5xl">
        Coached by people who've lived it
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-300">
        VK Football Academy's sessions are led by qualified nationally licensed
        coaches. One of them came through the academy himself — and came back
        to coach the next generation.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-xl p-8">
          <span className="inline-flex rounded-2xl bg-brand-500/15 p-4 text-brand-400">
            <UserRound className="h-8 w-8" />
          </span>
          <h2 className="font-display mt-5 text-2xl font-medium tracking-normal text-white">
            Dhyeya Tiwari
          </h2>
          <p className="mt-1 text-sm font-medium text-brand-400">
            Coach · AIFF D Licence
          </p>
          <p className="mt-4 leading-relaxed text-zinc-300">
            An ex-VKFA player who completed his AIFF D Licence and returned to
            the academy as a coach — proof of the pathway the academy builds,
            from player to coach.
          </p>
          <p className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
            <GraduationCap className="h-4 w-4 shrink-0 text-gold-400" />
            AIFF D Licence holder
          </p>
        </article>

        <article className="flex flex-col justify-between rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8">
          <div>
            <span className="inline-flex rounded-2xl bg-white/[0.06] p-4 text-zinc-400">
              <Award className="h-8 w-8" />
            </span>
            <h2 className="font-display mt-5 text-2xl font-medium tracking-normal text-white">
              The wider coaching team
            </h2>
            <p className="mt-4 leading-relaxed text-zinc-300">
              The academy is led by founder Vaibhav Karpe and staffed by
              qualified nationally licensed coaches across the age groups.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Full coach profiles — with photos and specialisations — are being
              added. Only verified information is shown here.
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
