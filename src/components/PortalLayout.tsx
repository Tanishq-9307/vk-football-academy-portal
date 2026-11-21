import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Baby,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../lib/types'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  /** Roles that see this item. Omitted = every signed-in role. */
  roles?: Role[]
  adminOnly?: boolean
}

const NAV: NavItem[] = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/portal/teams', label: 'My Teams', icon: Users, roles: ['admin', 'coach'] },
  { to: '/portal/sessions', label: 'Training Sessions', icon: CalendarDays, roles: ['admin', 'coach'] },
  { to: '/portal/plans', label: 'Session Plans', icon: ClipboardList, roles: ['admin', 'coach'] },
  { to: '/portal/attendance', label: 'Attendance', icon: ShieldCheck, roles: ['admin', 'coach'] },
  { to: '/portal/matches', label: 'Matches', icon: Trophy },
  { to: '/portal/development', label: 'Player Development', icon: TrendingUp, roles: ['admin', 'coach'] },
  { to: '/portal/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/portal/children', label: 'My Children', icon: Baby, roles: ['parent'] },
  { to: '/portal/fees', label: 'Fees', icon: Wallet, roles: ['parent'] },
  { to: '/portal/admin/overview', label: 'Admin Overview', icon: LayoutDashboard, adminOnly: true },
  { to: '/portal/admin/coaches', label: 'Manage Coaches', icon: Users, adminOnly: true },
  { to: '/portal/admin/teams', label: 'Manage Teams', icon: Users, adminOnly: true },
  { to: '/portal/admin/players', label: 'Manage Players', icon: Users, adminOnly: true },
  { to: '/portal/admin/parents', label: 'Manage Parents', icon: Baby, adminOnly: true },
  { to: '/portal/admin/fees', label: 'Manage Fees', icon: Wallet, adminOnly: true },
  { to: '/portal/admin/announcements', label: 'Manage Announcements', icon: Megaphone, adminOnly: true },
]

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  coach: 'Coach',
  parent: 'Parent',
}

export default function PortalLayout() {
  const { profile, coach, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = profile?.role === 'admin'

  const items = NAV.filter(
    (i) =>
      (!i.adminOnly || isAdmin) &&
      (!i.roles || (profile && i.roles.includes(profile.role))),
  )

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  const navContent = (
    <nav className="flex flex-col gap-1 p-2" aria-label="Portal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/portal'}
          onClick={() => setMenuOpen(false)}
          title={item.label}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-brand-500/15 text-white'
                : 'text-zinc-400 hover:bg-charcoal-800 hover:text-white'
            }`
          }
        >
          <item.icon className="h-4.5 w-4.5 shrink-0 text-brand-400" />
          {item.label}
        </NavLink>
      ))}
      <div className="mt-4 border-t border-charcoal-700 pt-4">
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-charcoal-800 hover:text-white"
        >
          ← Public website
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-charcoal-800 hover:text-white"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          Sign out
        </button>
      </div>
    </nav>
  )

  /** Compact icon rail (desktop): icon + tiny label, red active block. */
  const railContent = (
    <nav className="flex flex-col items-center gap-1 p-2" aria-label="Portal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/portal'}
          title={item.label}
          className={({ isActive }) =>
            `flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-semibold tracking-wide uppercase transition ${
              isActive
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                : 'text-zinc-400 hover:bg-charcoal-800 hover:text-white'
            }`
          }
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="max-w-full truncate px-0.5 text-center leading-tight">
            {item.label.split(' ')[0]}
          </span>
        </NavLink>
      ))}
      <div className="mt-3 w-full border-t border-charcoal-700 pt-3">
        <Link
          to="/"
          title="Public website"
          className="flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase transition hover:bg-charcoal-800 hover:text-white"
        >
          ← Site
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out"
          className="mt-1 flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase transition hover:bg-charcoal-800 hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Exit
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-charcoal-950">
      {/* Top bar — match-day header */}
      <header className="sticky top-0 z-40 border-b border-charcoal-800 bg-charcoal-950/95 backdrop-blur">
        <div className="h-1 bg-gradient-to-r from-brand-500 via-brand-500 to-gold-500" />
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link to="/portal" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="leading-none">
              <span className="font-display block text-base font-semibold tracking-wide text-white">
                VKFA PORTAL
              </span>
              <span className="mt-0.5 block text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                {profile ? ROLE_LABEL[profile.role] : ''}
                {coach ? ` · ${coach.full_name}` : ''}
              </span>
            </span>
          </Link>
          {/* Horizontal nav (wide screens) */}
          <nav
            className="hidden items-center gap-0.5 overflow-x-auto xl:flex"
            aria-label="Portal"
          >
            {items.slice(0, 8).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/portal'}
                title={item.label}
                className={({ isActive }) =>
                  `font-display rounded-lg px-2.5 py-2 text-[13px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition ${
                    isActive
                      ? 'bg-brand-500/15 text-white'
                      : 'text-zinc-400 hover:bg-charcoal-800 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-gold-600/50 bg-gold-500/10 px-3 py-1.5 text-xs font-semibold text-gold-400 sm:block">
              {profile?.full_name ?? profile?.email}
            </span>
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-300 hover:bg-charcoal-800 lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {menuOpen && <div className="border-t border-charcoal-800 lg:hidden">{navContent}</div>}
      </header>

      <div className="pitch-stripes mx-auto flex max-w-[90rem] gap-5 px-4 py-6 sm:px-6">
        {/* Compact icon rail — desktop only */}
        <aside className="hidden w-[4.5rem] shrink-0 lg:block">
          <div className="sticky top-24 stadium-card">
            {railContent}
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
