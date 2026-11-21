import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { LogIn, Mail, MapPin, Menu, Phone, X } from 'lucide-react'
import InstagramIcon from './InstagramIcon'
import Logo from './Logo'
import { Ticker } from './stadium'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/programmes', label: 'Programmes' },
  { to: '/coaches', label: 'Coaches' },
  { to: '/contact', label: 'Contact' },
]

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-charcoal-950">
      {/* Scoreboard strip */}
      <div className="bg-brand-600 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] uppercase sm:px-6">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden="true" />
            VKFA · Thane West · Under the lights
          </span>
          <a href="tel:+917304666815" className="hidden hover:underline sm:block">
            +91 73046 66815
          </a>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-charcoal-800 bg-charcoal-950/95 backdrop-blur">
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
                  `font-display relative px-3 py-2 text-sm font-semibold tracking-[0.15em] uppercase transition ${
                    isActive
                      ? 'text-white after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:bg-brand-500'
                      : 'text-zinc-400 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="btn-angle ml-3 inline-flex items-center gap-2 bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600"
            >
              <LogIn className="h-4 w-4" />
              Coach / Admin Login
            </Link>
          </nav>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-300 hover:bg-charcoal-800 md:hidden"
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
                    `font-display rounded-lg px-3 py-2.5 text-sm font-semibold tracking-[0.15em] uppercase ${
                      isActive
                        ? 'bg-charcoal-800 text-white'
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
                className="btn-angle mt-2 inline-flex items-center justify-center gap-2 bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white"
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

      <Ticker />
      <footer className="relative overflow-hidden border-t border-charcoal-800 bg-charcoal-900">
        <p
          className="font-display text-outline pointer-events-none absolute -top-4 left-0 hidden text-[11rem] leading-none font-bold tracking-tight whitespace-nowrap uppercase opacity-60 select-none lg:block"
          aria-hidden="true"
        >
          VKFA · VKFA
        </p>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
          <div>
            <Logo size={48} withWordmark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
              Building Better Players. Building Better People. A youth football
              academy in Thane, developing players from grassroots to youth
              football.
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
                  className="hover:text-white"
                >
                  vkfootballacademy@gmail.com
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold tracking-widest text-zinc-200 uppercase">
              Follow the academy
            </h3>
            <a
              href="https://www.instagram.com/vk_football_academy"
              target="_blank"
              rel="noreferrer"
              className="btn-angle-outline mt-4 inline-flex items-center gap-2.5 border border-charcoal-700 bg-charcoal-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-brand-500 hover:text-white"
            >
              <InstagramIcon className="h-4 w-4 text-brand-500" />
              @vk_football_academy
            </a>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              Training at Urban Turf, Rustomjee Urbania. Open daily, 12:00–8:00
              pm (as listed).
            </p>
          </div>
        </div>
        <div className="relative border-t border-charcoal-800 py-4 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} VK Football Academy, Thane. Develop.
          Compete. Excel.
        </div>
      </footer>
    </div>
  )
}
