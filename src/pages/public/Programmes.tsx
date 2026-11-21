import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Clock, MapPin } from 'lucide-react'

const PROGRAMMES = [
  {
    group: 'U12',
    ages: 'Ages 11–12',
    title: 'Foundations',
    body: 'First touch, ball mastery, 1v1 confidence and a genuine love of the game. Small-sided football, lots of touches, lots of smiles.',
    focus: ['Ball mastery & first touch', '1v1 attacking & defending', 'Small-sided games', 'Fun, high-energy sessions'],
  },
  {
    group: 'U14',
    ages: 'Ages 13–14',
    title: 'Development',
    body: 'Technique under pressure, better decisions in small-sided games, and learning to work as a team.',
    focus: ['Passing & receiving under pressure', 'Decision-making in small-sided games', 'Basic team shape', 'Introduction to positions'],
  },
  {
    group: 'U16',
    ages: 'Ages 15–16',
    title: 'Performance',
    body: 'Tactical understanding, positional play and physical development — preparing players for competitive youth football.',
    focus: ['Tactical principles & shape', 'Positional understanding', 'Strength & conditioning basics', 'League & tournament football'],
  },
  {
    group: 'U18',
    ages: 'Ages 17–18',
    title: 'Pathway',
    body: 'Performance football for players aiming at senior football and higher-level opportunities, including exposure trials.',
    focus: ['Advanced tactics & game management', 'Physical performance', 'Trials & exposure opportunities', 'Senior football preparation'],
  },
]

export default function Programmes() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-brand-400 uppercase">
        Programmes
      </p>
      <h1 className="font-display mt-3 max-w-3xl text-4xl leading-tight font-medium tracking-normal text-white sm:text-5xl">
        Age-group training, built for each stage
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-300">
        Four age groups — U12, U14, U16 and U18 — each with its own training
        focus. Players train at Urban Turf, Rustomjee Urbania, with nationally
        licensed coaches.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {PROGRAMMES.map((p) => (
          <article
            key={p.group}
            className="rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-xl p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-5xl font-bold text-brand-500">
                  {p.group}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-400">{p.ages}</p>
              </div>
              <span className="rounded-full border border-gold-600/60 bg-gold-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-gold-400 uppercase">
                {p.title}
              </span>
            </div>
            <p className="mt-5 leading-relaxed text-zinc-300">{p.body}</p>
            <ul className="mt-5 space-y-2">
              {p.focus.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-400">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {f}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <h2 className="font-display text-2xl font-medium tracking-normal text-white">
          Training details
        </h2>
        <div className="mt-6 grid gap-4 text-sm text-zinc-300 sm:grid-cols-3">
          <p className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            Urban Turf, Rustomjee Urbania, Majiwada, Thane West
          </p>
          <p className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            Open daily, 12:00–8:00 pm (as listed)
          </p>
          <p className="flex items-start gap-2.5">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            Trial dates are announced on Instagram — follow @vk_football_academy
          </p>
        </div>
        <Link
          to="/contact"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
        >
          Enquire about joining
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
