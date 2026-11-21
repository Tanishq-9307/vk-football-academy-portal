import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Spinner, ToastProvider } from './components/ui'
import PublicLayout from './components/PublicLayout'
import Home from './pages/public/Home'
import About from './pages/public/About'
import Programmes from './pages/public/Programmes'
import Coaches from './pages/public/Coaches'
import Contact from './pages/public/Contact'
import Login from './pages/Login'
import NotConfigured from './pages/NotConfigured'
import PortalLayout from './components/PortalLayout'
import Dashboard from './pages/portal/Dashboard'
import Teams from './pages/portal/Teams'
import Sessions from './pages/portal/Sessions'
import SessionDetail from './pages/portal/SessionDetail'
import PlanForm from './pages/portal/PlanForm'
import {
  PlanEdit,
  PlanView,
  SessionPlansList,
} from './pages/portal/SessionPlans'
import Attendance from './pages/portal/Attendance'
import Matches from './pages/portal/Matches'
import Development from './pages/portal/Development'
import Announcements from './pages/portal/Announcements'
import ParentChildren from './pages/portal/ParentChildren'
import ParentChild from './pages/portal/ParentChild'
import ParentFees from './pages/portal/ParentFees'
import AdminCoaches from './pages/portal/admin/AdminCoaches'
import AdminTeams from './pages/portal/admin/AdminTeams'
import AdminPlayers from './pages/portal/admin/AdminPlayers'
import AdminOverview from './pages/portal/admin/AdminOverview'
import AdminParents from './pages/portal/admin/AdminParents'
import AdminFees from './pages/portal/admin/AdminFees'
import AdminAnnouncements from './pages/portal/admin/AdminAnnouncements'
import type { Role } from './lib/types'

/**
 * Route protection is enforced here AND in the database (RLS):
 * - Supabase must be configured
 * - a signed-in session must exist
 * - the user's role is read from the profiles table (not from local storage
 *   or a hidden nav item)
 * - admin routes additionally require role === 'admin'
 * - coach/parent routes additionally require the matching role
 */
function ProtectedRoute({
  adminOnly = false,
  roles,
}: {
  adminOnly?: boolean
  roles?: Role[]
}) {
  const { configured, loading, user, profile, profileError, signOut } = useAuth()

  if (!configured) return <NotConfigured />
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal-950">
        <Spinner label="Checking your login…" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (!profile) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-medium tracking-normal text-white">
          Account not set up yet
        </h1>
        <p className="mt-3 leading-relaxed text-zinc-300">
          {profileError ??
            'Your login works, but no profile is linked to this account yet.'}
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-6 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Sign out
        </button>
      </div>
    )
  }
  if (adminOnly && profile.role !== 'admin') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-medium tracking-normal text-white">
          Not authorised
        </h1>
        <p className="mt-3 leading-relaxed text-zinc-300">
          This area is for academy admins only. Your account is signed in as
          a {profile.role}.
        </p>
      </div>
    )
  }
  if (roles && !roles.includes(profile.role)) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-medium tracking-normal text-white">
          Not authorised
        </h1>
        <p className="mt-3 leading-relaxed text-zinc-300">
          This area is not part of the {profile.role} portal. Your account is
          signed in as a {profile.role}.
        </p>
      </div>
    )
  }
  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="programmes" element={<Programmes />} />
              <Route path="coaches" element={<Coaches />} />
              <Route path="contact" element={<Contact />} />
              <Route path="login" element={<Login />} />
            </Route>

            <Route path="portal" element={<ProtectedRoute />}>
              <Route element={<PortalLayout />}>
                <Route index element={<Dashboard />} />
                <Route element={<ProtectedRoute roles={['admin', 'coach']} />}>
                  <Route path="teams" element={<Teams />} />
                  <Route path="sessions" element={<Sessions />} />
                  <Route path="sessions/:id" element={<SessionDetail />} />
                  <Route path="plans" element={<SessionPlansList />} />
                  <Route path="plans/new" element={<PlanForm />} />
                  <Route path="plans/:id" element={<PlanView />} />
                  <Route path="plans/:id/edit" element={<PlanEdit />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="development" element={<Development />} />
                </Route>
                <Route path="matches" element={<Matches />} />
                <Route path="announcements" element={<Announcements />} />
                <Route element={<ProtectedRoute roles={['parent']} />}>
                  <Route path="children" element={<ParentChildren />} />
                  <Route path="children/:playerId" element={<ParentChild />} />
                  <Route path="fees" element={<ParentFees />} />
                </Route>
                <Route path="admin" element={<ProtectedRoute adminOnly />}>
                  <Route path="overview" element={<AdminOverview />} />
                  <Route path="coaches" element={<AdminCoaches />} />
                  <Route path="teams" element={<AdminTeams />} />
                  <Route path="players" element={<AdminPlayers />} />
                  <Route path="parents" element={<AdminParents />} />
                  <Route path="fees" element={<AdminFees />} />
                  <Route path="announcements" element={<AdminAnnouncements />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
