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
    <nav className="flex flex-col gap-1 p-3" aria-label="Portal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/portal'}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-white/[0.07] text-white shadow-[inset_2px_0_0_#d4af37]'
                : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white'
            }`
          }
        >
          <item.icon className="h-4.5 w-4.5 shrink-0 text-zinc-500" />
          {item.label}
        </NavLink>
      ))}
      <div className="mt-5 border-t border-white/10 pt-5">
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          ← Public website
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          Sign out
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-charcoal-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0e0e12]/70 backdrop-blur-xl">
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
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-400 sm:block">
              {profile?.full_name ?? profile?.email}
            </span>
            <button
              type="button"
              className="rounded-full p-2 text-zinc-300 hover:bg-white/[0.06] lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {menuOpen && <div className="border-t border-white/10 lg:hidden">{navContent}</div>}
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="glass sticky top-24 rounded-3xl p-2">
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
