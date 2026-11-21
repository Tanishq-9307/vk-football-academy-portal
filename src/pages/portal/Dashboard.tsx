import { lazy, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchAttendanceForSessions,
  fetchVisibleSessions,
  fetchVisibleTeams,
  supabaseErrorMessage,
} from '../../lib/data'
import type { Team, TrainingSession } from '../../lib/types'
import { attendancePct, formatDateTime, todayIso } from '../../lib/utils'
import {
  AttendanceRing,
  Card,
  EmptyState,
  ErrorBanner,
  PageHeader,
  PrimaryButton,
  Reveal,
  Spinner,
  StatCard,
} from '../../components/ui'
import { ThreeStage } from '../../components/three/ThreeStage'
import Logo from '../../components/Logo'
import ParentDashboard from './ParentDashboard'

const MiniBall = lazy(() => import('../../components/three/MiniBall'))

export default function Dashboard() {
  const { profile, coach } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [upcoming, setUpcoming] = useState<TrainingSession[]>([])
  const [recentPct, setRecentPct] = useState(0)
  const [recentMarked, setRecentMarked] = useState(0)
  const [recentSessions, setRecentSessions] = useState(0)
  const [counts, setCounts] = useState({ coaches: 0, players: 0 })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!profile || !supabase) return
      if (profile.role === 'parent') {
        // Parents get their own dashboard — skip the coach/admin load.
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const visibleTeams = await fetchVisibleTeams(profile, coach)
        if (cancelled) return
        setTeams(visibleTeams)
        const teamIds = visibleTeams.map((t) => t.id)
        const sessions = await fetchVisibleSessions(profile, coach, teamIds)
        if (cancelled) return
        const today = todayIso()
        setUpcoming(
          sessions
            .filter((s) => s.status === 'scheduled' && s.session_date >= today)
            .sort((a, b) =>
              `${a.session_date}T${a.start_time}`.localeCompare(
                `${b.session_date}T${b.start_time}`,
              ),
            )
            .slice(0, 5),
        )
        // Attendance over the last 30 days (completed or past sessions).
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const recent = sessions.filter(
          (s) => s.session_date >= thirtyDaysAgo.toISOString().slice(0, 10),
        )
        const records = await fetchAttendanceForSessions(
          recent.map((s) => s.id),
        )
        if (cancelled) return
        const stats = attendancePct(records)
        setRecentPct(stats.pct)
        setRecentMarked(stats.total)
        setRecentSessions(new Set(records.map((r) => r.training_session_id)).size)

        if (profile.role === 'admin') {
          const [{ count: coachCount }, { count: playerCount }] =
            await Promise.all([
              supabase.from('coaches').select('*', { count: 'exact', head: true }),
              supabase.from('players').select('*', { count: 'exact', head: true }),
            ])
          if (!cancelled) {
            setCounts({ coaches: coachCount ?? 0, players: playerCount ?? 0 })
          }
        }
      } catch (e) {
        if (!cancelled) setError(await supabaseErrorMessage(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [profile, coach])

  if (profile?.role === 'parent') return <ParentDashboard />
  if (loading) return <Spinner label="Loading your dashboard…" />
  if (error) return <ErrorBanner message={error} />
  if (!profile) return null

  const isAdmin = profile.role === 'admin'

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          eyebrow={isAdmin ? 'VKFA Portal · Admin' : 'VKFA Portal · Coach'}
          title={isAdmin ? 'Admin dashboard' : 'Coach dashboard'}
          sub={
            isAdmin
              ? 'Academy-wide overview — teams, coaches, sessions and attendance.'
              : `Welcome back, ${coach?.full_name ?? profile.full_name ?? 'Coach'}. Here's what's coming up for your teams.`
          }
        />
        <div className="card-gold hidden h-24 w-24 shrink-0 items-center justify-center overflow-hidden sm:flex">
          <ThreeStage
            scene={MiniBall}
            fallback={
              <div className="flex h-full items-center justify-center">
                <Logo size={52} />
              </div>
            }
            label="Spinning football"
            className="h-full w-full"
          />
        </div>
      </div>

      <Reveal>
        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label={isAdmin ? 'Total teams' : 'My teams'}
            value={String(teams.length)}
            sub={teams.map((t) => t.name).join(' · ') || 'No teams assigned yet'}
            icon={<Users className="h-4 w-4" />}
            accent="red"
          />
          {isAdmin && (
            <>
              <StatCard
                label="Coaches"
                value={String(counts.coaches)}
                icon={<GraduationCap className="h-4 w-4" />}
                accent="gold"
              />
              <StatCard
                label="Players"
                value={String(counts.players)}
                icon={<Users className="h-4 w-4" />}
                accent="sky"
              />
            </>
          )}
          <StatCard
            label="Upcoming sessions"
            value={String(upcoming.length)}
            sub="Scheduled from today"
            icon={<CalendarDays className="h-4 w-4" />}
            accent="gold"
          />
          <Card className="relative overflow-hidden p-5">
            <span
              className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 to-gold-400"
              aria-hidden="true"
            />
            <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
              Attendance · last 30 days
            </p>
            <div className="mt-3">
              <AttendanceRing pct={recentPct} size={92} />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {recentMarked === 0
                ? 'No attendance marked yet'
                : `${recentMarked} marks across ${recentSessions} session${recentSessions === 1 ? '' : 's'}`}
            </p>
          </Card>
        </div>
      </Reveal>

      <section className="mt-9">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            Upcoming sessions
          </h2>
          <Link
            to="/portal/sessions"
            className="text-sm font-semibold text-brand-400 hover:text-brand-300"
          >
            View all →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No upcoming sessions"
              body={
                isAdmin
                  ? 'No sessions are scheduled from today. Coaches can create sessions from the Training Sessions page.'
                  : 'You have no sessions scheduled from today. Create one from the Training Sessions page.'
              }
              action={
                <Link to="/portal/sessions">
                  <PrimaryButton>
                    <CalendarDays className="h-4 w-4" />
                    Go to Training Sessions
                  </PrimaryButton>
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {upcoming.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/portal/sessions/${s.id}`}
                  className="card card-hover flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {s.title ?? `${s.category} session`}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      {s.team?.name} · {formatDateTime(s.session_date, s.start_time)} ·{' '}
                      {s.duration_minutes} min
                      {s.pitch ? ` · ${s.pitch}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full border border-gold-600/50 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-400">
                    {s.category}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-9 grid gap-4 sm:grid-cols-2">
        <Link
          to="/portal/plans"
          className="card card-hover flex items-start gap-4 p-5"
        >
          <span className="rounded-2xl border border-gold-600/40 bg-gold-500/10 p-3 text-gold-400">
            <ClipboardList className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-white">Session Plans</span>
            <span className="mt-1 block text-sm text-zinc-400">
              Create, upload and review training plans — linked to their session.
            </span>
          </span>
        </Link>
        <Link
          to="/portal/attendance"
          className="card card-hover flex items-start gap-4 p-5"
        >
          <span className="rounded-2xl border border-gold-600/40 bg-gold-500/10 p-3 text-gold-400">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-white">Attendance</span>
            <span className="mt-1 block text-sm text-zinc-400">
              Mark attendance per session and check each player's record.
            </span>
          </span>
        </Link>
      </section>

      {teams.length > 0 && (
        <section className="mt-9">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            {isAdmin ? 'Teams' : 'My teams'}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <Link
                key={t.id}
                to="/portal/teams"
                className="card card-hover group p-5"
              >
                <p className="flex items-center gap-2 font-semibold text-white">
                  <span className="rounded-lg bg-brand-500/15 p-1.5 text-brand-400 transition group-hover:bg-brand-500/25">
                    <Users className="h-4 w-4" />
                  </span>
                  {t.name}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  {t.age_group}
                  {t.coach ? ` · Coach: ${t.coach.full_name}` : ''}
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  View team →
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
