import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { LogIn, Mail, MapPin, Menu, Phone, X } from 'lucide-react'
import InstagramIcon from './InstagramIcon'
import Logo from './Logo'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/programmes', label: 'Programmes' },
  { to: '/coaches', label: 'Coaches' },
  { to: '/contact', label: 'Contact' },
]

const PROGRAMME_LINKS = [
  { to: '/programmes', label: 'U12 — Foundations' },
  { to: '/programmes', label: 'U14 — Development' },
  { to: '/programmes', label: 'U16 — Performance' },
  { to: '/programmes', label: 'U18 — Pathway' },
]

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-charcoal-950">
      {/* Film grain over the whole public site — texture, not decoration. */}
      <div className="grain" aria-hidden="true" />
      <header className="sticky top-0 z-50 border-b border-charcoal-800/80 bg-charcoal-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <Logo size={44} withWordmark />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'text-white after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-brand-500'
                      : 'text-zinc-400 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="ml-3 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600 active:scale-[0.98]"
            >
              <LogIn className="h-4 w-4" />
              Coach / Admin Login
            </Link>
          </nav>
          <button
            type="button"
            className="rounded-xl p-2 text-zinc-300 transition hover:bg-charcoal-800 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <nav
            className="border-t border-charcoal-800 px-4 py-3 md:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'border-l-2 border-gold-400 bg-charcoal-800 text-white'
                        : 'text-zinc-400 hover:bg-charcoal-800 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <LogIn className="h-4 w-4" />
                Coach / Admin Login
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-charcoal-800 bg-charcoal-900">
        <div className="h-1 bg-gold-400" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo size={48} withWordmark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
              Building Better Players. Building Better People. A youth football
              academy in Thane, developing players from grassroots to youth
              football.
            </p>
            <a
              href="https://www.instagram.com/vk_football_academy"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2.5 rounded-xl border border-charcoal-700 bg-charcoal-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-brand-500 hover:text-white"
            >
              <InstagramIcon className="h-4 w-4 text-brand-500" />
              @vk_football_academy
            </a>
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold tracking-widest text-zinc-200 uppercase">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-zinc-400 transition hover:text-gold-400">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/login" className="text-zinc-400 transition hover:text-gold-400">
                  Coach / Admin Login
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold tracking-widest text-zinc-200 uppercase">
              Programmes
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {PROGRAMME_LINKS.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-zinc-400 transition hover:text-gold-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              Ages 5–18 · Boys &amp; Girls · AIFF &amp; AFC Licensed Coaches
            </p>
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold tracking-widest text-zinc-200 uppercase">
              Visit us
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <span>
                  Urban Turf, Rustomjee Urbania, Majiwada, Thane West,
                  Maharashtra
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-brand-500" />
                <a href="tel:+917304666815" className="hover:text-white">
                  +91 73046 66815
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-brand-500" />
                <a
                  href="mailto:vkfootballacademy@gmail.com"
                  className="break-all hover:text-white"
                >
                  vkfootballacademy@gmail.com
                </a>
              </li>
              <li className="text-xs leading-relaxed text-zinc-500">
                Training at Urban Turf, Rustomjee Urbania. Open daily, 12:00–8:00
                pm (as listed).
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-charcoal-800 py-5 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} VK Football Academy, Thane. Develop.
          Compete. Excel.
        </div>
      </footer>
    </div>
  )
}
