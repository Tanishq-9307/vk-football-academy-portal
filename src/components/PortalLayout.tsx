import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
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
  section: 'portal' | 'admin'
}

const NAV: NavItem[] = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, section: 'portal' },
  { to: '/portal/teams', label: 'My Teams', icon: Users, roles: ['admin', 'coach'], section: 'portal' },
  { to: '/portal/sessions', label: 'Training Sessions', icon: CalendarDays, roles: ['admin', 'coach'], section: 'portal' },
  { to: '/portal/plans', label: 'Session Plans', icon: ClipboardList, roles: ['admin', 'coach'], section: 'portal' },
  { to: '/portal/attendance', label: 'Attendance', icon: ShieldCheck, roles: ['admin', 'coach'], section: 'portal' },
  { to: '/portal/matches', label: 'Matches', icon: Trophy, section: 'portal' },
  { to: '/portal/development', label: 'Player Development', icon: TrendingUp, roles: ['admin', 'coach'], section: 'portal' },
  { to: '/portal/announcements', label: 'Announcements', icon: Megaphone, section: 'portal' },
  { to: '/portal/children', label: 'My Children', icon: Baby, roles: ['parent'], section: 'portal' },
  { to: '/portal/fees', label: 'Fees', icon: Wallet, roles: ['parent'], section: 'portal' },
  { to: '/portal/admin/overview', label: 'Admin Overview', icon: LayoutDashboard, adminOnly: true, section: 'admin' },
  { to: '/portal/admin/coaches', label: 'Manage Coaches', icon: Users, adminOnly: true, section: 'admin' },
  { to: '/portal/admin/teams', label: 'Manage Teams', icon: Users, adminOnly: true, section: 'admin' },
  { to: '/portal/admin/players', label: 'Manage Players', icon: Users, adminOnly: true, section: 'admin' },
  { to: '/portal/admin/parents', label: 'Manage Parents', icon: Baby, adminOnly: true, section: 'admin' },
  { to: '/portal/admin/fees', label: 'Manage Fees', icon: Wallet, adminOnly: true, section: 'admin' },
  { to: '/portal/admin/announcements', label: 'Manage Announcements', icon: Megaphone, adminOnly: true, section: 'admin' },
]

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  coach: 'Coach',
  parent: 'Parent',
}

function initials(name?: string | null, email?: string | null): string {
  const src = (name ?? '').trim() || (email ?? '')
  const parts = src.split(/[\s@._-]+/).filter(Boolean)
  const first = parts[0]?.[0] ?? 'V'
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

export default function PortalLayout() {
  const { profile, coach, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = profile?.role === 'admin'

  const items = NAV.filter(
    (i) =>
      (!i.adminOnly || isAdmin) &&
      (!i.roles || (profile && i.roles.includes(profile.role))),
  )
  const portalItems = items.filter((i) => i.section === 'portal')
  const adminItems = items.filter((i) => i.section === 'admin')
  const current =
    [...items].sort((a, b) => b.to.length - a.to.length).find(
      (i) =>
        location.pathname === i.to ||
        (i.to !== '/portal' && location.pathname.startsWith(`${i.to}/`)),
    ) ?? items[0]
  const pageTitle = current?.label ?? 'Dashboard'

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  const renderGroup = (label: string, group: NavItem[]) => (
    <div key={label}>
      <p className="px-3 pt-4 pb-2 text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
        {label}
      </p>
      <div className="flex flex-col gap-0.5">
        {group.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/portal'}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500/20 to-transparent text-white'
                  : 'text-zinc-400 hover:bg-charcoal-800 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-500 to-gold-400"
                    aria-hidden="true"
                  />
                )}
                <item.icon
                  className={`h-4.5 w-4.5 shrink-0 transition ${
                    isActive ? 'text-gold-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )

  const navContent = (
    <nav className="flex flex-col gap-1 p-3" aria-label="Portal">
      {renderGroup('Portal', portalItems)}
      {adminItems.length > 0 && renderGroup('Admin', adminItems)}
      <div className="mt-4 border-t border-charcoal-700/70 pt-3">
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
          className="mt-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-charcoal-800 hover:text-white"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          Sign out
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-charcoal-950">
      {/* Top bar — page title + user chip */}
      <header className="sticky top-0 z-40 border-b border-charcoal-800/80 bg-charcoal-950/90 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/portal" className="flex shrink-0 items-center gap-2.5" aria-label="VKFA Portal home">
              <Logo size={34} />
              <span className="hidden leading-none sm:block">
                <span className="font-display block text-base font-semibold tracking-wide text-white">
                  VKFA PORTAL
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.18em] text-gold-400 uppercase">
                  Develop · Compete · Excel
                </span>
              </span>
            </Link>
            <span className="hidden h-6 w-px bg-charcoal-700 md:block" aria-hidden="true" />
            <h1 className="font-display hidden truncate text-xl font-semibold tracking-wide text-white uppercase md:block">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2.5 rounded-full border border-charcoal-700 bg-charcoal-850 py-1.5 pr-3 pl-1.5 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white">
                {initials(profile?.full_name, profile?.email)}
              </span>
              <span className="leading-none">
                <span className="block max-w-36 truncate text-sm font-semibold text-white">
                  {profile?.full_name ?? profile?.email ?? ''}
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold tracking-widest text-gold-400 uppercase">
                  {profile ? ROLE_LABEL[profile.role] : ''}
                  {coach ? ` · ${coach.full_name}` : ''}
                </span>
              </span>
            </span>
            <button
              type="button"
              className="rounded-xl p-2 text-zinc-300 transition hover:bg-charcoal-800 lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="max-h-[70vh] overflow-y-auto border-t border-charcoal-800 lg:hidden">
            {navContent}
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="card sticky top-[76px] overflow-hidden rounded-[24px]">
            <div className="h-1 bg-gradient-to-r from-brand-500 via-brand-600 to-gold-400" aria-hidden="true" />
            {navContent}
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
