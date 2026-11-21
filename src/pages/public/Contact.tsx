import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import InstagramIcon from '../../components/InstagramIcon'
import { SectionHeading } from '../../components/stadium'

export default function Contact() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeading
        kicker="Contact"
        title="Come and see a session"
      />
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-300">
        For admissions, trials and batch timings, call or message the academy
        directly — or follow the Instagram page, where trial dates and
        announcements are posted first.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <a
            href="tel:+917304666815"
            className="flex items-start gap-4 stadium-card p-6 transition hover:border-brand-500/60"
          >
            <span className="rounded-xl bg-brand-500/15 p-3 text-brand-400">
              <Phone className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Call the academy
              </span>
              <span className="mt-1 block text-lg font-semibold text-white">
                +91 73046 66815
              </span>
            </span>
          </a>
          <a
            href="mailto:vkfootballacademy@gmail.com"
            className="flex items-start gap-4 stadium-card p-6 transition hover:border-brand-500/60"
          >
            <span className="rounded-xl bg-brand-500/15 p-3 text-brand-400">
              <Mail className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Email
              </span>
              <span className="mt-1 block text-lg font-semibold break-all text-white">
                vkfootballacademy@gmail.com
              </span>
            </span>
          </a>
          <a
            href="https://www.instagram.com/vk_football_academy"
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-4 stadium-card p-6 transition hover:border-brand-500/60"
          >
            <span className="rounded-xl bg-brand-500/15 p-3 text-brand-400">
              <InstagramIcon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Instagram
              </span>
              <span className="mt-1 block text-lg font-semibold text-white">
                @vk_football_academy
              </span>
              <span className="mt-1 block text-sm text-zinc-400">
                Trial dates, match updates and academy news
              </span>
            </span>
          </a>
        </div>

        <div className="stadium-card p-6">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            Venue
          </h2>
          <p className="mt-4 flex items-start gap-2.5 leading-relaxed text-zinc-300">
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
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-charcoal-600 bg-charcoal-800 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-charcoal-500 hover:bg-charcoal-700"
          >
            <MapPin className="h-4 w-4" />
            Open in Google Maps
          </a>
          <p className="mt-6 text-sm leading-relaxed text-zinc-500">
            Parents: the best way to start is a call or a message on Instagram.
            The academy will confirm the right age-group batch and the next
            trial or admission date.
          </p>
        </div>
      </div>
    </div>
  )
}
