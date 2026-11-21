import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react'
import InstagramIcon from '../../components/InstagramIcon'
import { Reveal } from '../../components/ui'

const CHANNELS = [
  {
    href: 'tel:+917304666815',
    icon: Phone,
    label: 'Call the academy',
    value: '+91 73046 66815',
    sub: undefined as string | undefined,
  },
  {
    href: 'mailto:vkfootballacademy@gmail.com',
    icon: Mail,
    label: 'Email',
    value: 'vkfootballacademy@gmail.com',
    sub: undefined as string | undefined,
  },
  {
    href: 'https://www.instagram.com/vk_football_academy',
    icon: InstagramIcon,
    label: 'Instagram',
    value: '@vk_football_academy',
    sub: 'Trial dates, match updates and academy news',
    external: true,
  },
]

export default function Contact() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal>
        <p className="eyebrow">Contact</p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl leading-[1.02] font-bold tracking-wide text-white uppercase sm:text-6xl">
          Come and see a session
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-300">
          For admissions, trials and batch timings, call or message the academy
          directly — or follow the Instagram page, where trial dates and
          announcements are posted first.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {CHANNELS.map((c, i) => (
            <Reveal key={c.label} delay={i * 80}>
              <a
                href={c.href}
                {...(c.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="card card-hover group flex items-start gap-4 p-6"
              >
                <span className="rounded-2xl border border-gold-600/40 bg-gold-500/10 p-3 text-gold-400 transition group-hover:bg-gold-500/20">
                  <c.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                    {c.label}
                  </span>
                  <span className="mt-1 block truncate text-lg font-semibold text-white">
                    {c.value}
                  </span>
                  {c.sub && (
                    <span className="mt-1 block text-sm text-zinc-400">{c.sub}</span>
                  )}
                </span>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-zinc-500 transition group-hover:text-gold-400" />
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="card-gold relative h-full overflow-hidden p-8">
            <div className="pitch-lines pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
            <div className="relative">
              <p className="eyebrow">Venue</p>
              <h2 className="font-display mt-3 text-2xl font-semibold tracking-wide text-white uppercase">
                Urban Turf, Rustomjee Urbania
              </h2>
              <p className="mt-5 flex items-start gap-2.5 leading-relaxed text-zinc-300">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-500" />
                Urban Turf, Rustomjee Urbania, Majiwada, Thane West, Maharashtra
              </p>
              <p className="mt-4 flex items-start gap-2.5 text-zinc-300">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                Open daily, 12:00–8:00 pm (as listed)
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Rustomjee+Urbania+Majiwada+Thane+West"
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-charcoal-950 shadow-lg transition hover:bg-zinc-200 active:scale-[0.98]"
              >
                <MapPin className="h-4 w-4" />
                Open in Google Maps
              </a>
              <p className="mt-7 border-t border-charcoal-700/70 pt-6 text-sm leading-relaxed text-zinc-400">
                Parents: the best way to start is a call or a message on Instagram.
                The academy will confirm the right age-group batch and the next
                trial or admission date.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
