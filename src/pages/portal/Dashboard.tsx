import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ClipboardList, ShieldCheck, Users } from 'lucide-react'
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
  EmptyState,
  ErrorBanner,
  PrimaryButton,
  Spinner,
  StatCard,
} from '../../components/ui'
import {
  FixtureCard,
  Reveal,
  ScoreboardHeader,
  TiltCard,
} from '../../components/stadium'
import ParentDashboard from './ParentDashboard'

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
      <ScoreboardHeader
        kicker={isAdmin ? 'Matchday control · Admin' : 'Matchday control · Coach'}
        title={isAdmin ? 'Admin dashboard' : 'Coach dashboard'}
        meta={
          isAdmin
            ? 'Academy-wide overview — teams, coaches, sessions and attendance.'
            : `Welcome back, ${coach?.full_name ?? profile.full_name ?? 'Coach'}. Here's what's coming up for your teams.`
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={isAdmin ? 'Total teams' : 'My teams'}
          value={String(teams.length)}
          sub={teams.map((t) => t.name).join(' · ') || 'No teams assigned yet'}
        />
        {isAdmin && (
          <>
            <StatCard label="Coaches" value={String(counts.coaches)} />
            <StatCard label="Players" value={String(counts.players)} />
          </>
        )}
        <StatCard
          label="Upcoming sessions"
          value={String(upcoming.length)}
          sub="Scheduled from today"
        />
        <StatCard
          label="Attendance · last 30 days"
          value={`${recentPct}%`}
          sub={
            recentMarked === 0
              ? 'No attendance marked yet'
              : `${recentMarked} marks across ${recentSessions} session${recentSessions === 1 ? '' : 's'}`
          }
        />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            Upcoming fixtures
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
                <FixtureCard
                  home={s.team?.name ?? 'VKFA'}
                  title={s.title ?? `${s.category} session`}
                  meta={`${formatDateTime(s.session_date, s.start_time)} · ${s.duration_minutes} min${s.pitch ? ` · ${s.pitch}` : ''}`}
                  dateLabel={s.session_date.slice(8, 10)}
                  status={
                    <span className="rounded-full bg-charcoal-800 px-3 py-1 text-xs font-semibold text-zinc-300">
                      {s.category}
                    </span>
                  }
                  href={`/portal/sessions/${s.id}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Reveal>
          <TiltCard className="h-full">
            <Link
              to="/portal/plans"
              className="stadium-card flex h-full items-start gap-4 p-5 transition hover:border-brand-500/60"
            >
              <span className="rounded-xl bg-brand-500/15 p-3 text-brand-400">
                <ClipboardList className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-white">Session Plans</span>
                <span className="mt-1 block text-sm text-zinc-400">
                  Create, upload and review training plans — linked to their session.
                </span>
              </span>
            </Link>
          </TiltCard>
        </Reveal>
        <Reveal delay={120}>
          <TiltCard className="h-full">
            <Link
              to="/portal/attendance"
              className="stadium-card flex h-full items-start gap-4 p-5 transition hover:border-brand-500/60"
            >
              <span className="rounded-xl bg-brand-500/15 p-3 text-brand-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-white">Attendance</span>
                <span className="mt-1 block text-sm text-zinc-400">
                  Mark attendance per session and check each player's record.
                </span>
              </span>
            </Link>
          </TiltCard>
        </Reveal>
      </section>

      {teams.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            {isAdmin ? 'Squads' : 'My squads'}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <Link
                key={t.id}
                to="/portal/teams"
                className="stadium-card block p-5 transition hover:border-brand-500/60"
              >
                <p className="flex items-center gap-2 font-semibold text-white">
                  <Users className="h-4 w-4 text-brand-400" />
                  {t.name}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {t.age_group}
                  {t.coach ? ` · Coach: ${t.coach.full_name}` : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
