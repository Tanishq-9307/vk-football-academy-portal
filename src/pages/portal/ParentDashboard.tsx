import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Baby, CalendarDays, Megaphone, Trophy, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchAnnouncementsForRole,
  fetchFeeRecordsForPlayers,
  fetchMatchesForTeams,
  fetchTeamsForPlayers,
  fetchVisibleSessions,
  supabaseErrorMessage,
} from '../../lib/data'
import type {
  Announcement,
  FeeRecord,
  Match,
  TrainingSession,
} from '../../lib/types'
import { feeOutstanding, feeStatus, formatDate, formatDateTime, formatINR, todayIso } from '../../lib/utils'
import {
  EmptyState,
  ErrorBanner,
  Spinner,
  StatCard,
} from '../../components/ui'

export default function ParentDashboard() {
  const { profile, children } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upcoming, setUpcoming] = useState<TrainingSession[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([])
  const [nextMatch, setNextMatch] = useState<Match | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!profile || !supabase) return
      setLoading(true)
      setError(null)
      try {
        const childIds = children.map((c) => c.id)
        const [childTeams, sessions, anns, fees] = await Promise.all([
          fetchTeamsForPlayers(childIds),
          fetchVisibleSessions(profile, null, []),
          fetchAnnouncementsForRole('parent'),
          fetchFeeRecordsForPlayers(childIds),
        ])
        if (cancelled) return
        setAnnouncements(anns.slice(0, 3))
        setFeeRecords(fees)
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
        const matches = await fetchMatchesForTeams(childTeams.map((t) => t.id))
        if (cancelled) return
        const upcomingMatches = matches
          .filter((m) => m.status === 'scheduled' && m.match_date >= today)
          .sort((a, b) =>
            `${a.match_date}T${a.start_time}`.localeCompare(
              `${b.match_date}T${b.start_time}`,
            ),
          )
        setNextMatch(upcomingMatches[0] ?? null)
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
  }, [profile, children])

  if (loading) return <Spinner label="Loading your dashboard…" />
  if (error) return <ErrorBanner message={error} />
  if (!profile) return null

  const outstanding = feeRecords.reduce(
    (sum, r) => sum + feeOutstanding(r.amount_due, r.amount_paid),
    0,
  )
  const overdueCount = feeRecords.filter(
    (r) => feeStatus(r.amount_due, r.amount_paid, r.structure?.due_date ?? null) === 'overdue',
  ).length

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
        Parent dashboard
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Welcome back, {profile.full_name ?? profile.email}. Everything about
        your {children.length === 1 ? 'child' : 'children'} at VK Football
        Academy, in one place.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={children.length === 1 ? 'My child' : 'My children'}
          value={String(children.length)}
          sub={children.map((c) => c.full_name).join(' · ') || 'No children linked yet'}
        />
        <StatCard
          label="Outstanding fees"
          value={formatINR(outstanding)}
          sub={
            overdueCount > 0
              ? `${overdueCount} overdue — please settle soon`
              : outstanding === 0
                ? 'All settled — thank you'
                : `${feeRecords.length} fee record${feeRecords.length === 1 ? '' : 's'}`
          }
        />
        <StatCard
          label="Upcoming sessions"
          value={String(upcoming.length)}
          sub="Scheduled from today"
        />
        <StatCard
          label="Next match"
          value={nextMatch ? formatDate(nextMatch.match_date) : '—'}
          sub={
            nextMatch
              ? `${nextMatch.team?.name ?? ''} vs ${nextMatch.opponent}`
              : 'No fixture scheduled'
          }
        />
      </div>

      {children.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No children linked yet"
            body="Your login isn't linked to a player yet. Ask the academy admin to link your account to your child — then their training, attendance, reports and fees will appear here."
          />
        </div>
      ) : (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            My children
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {children.map((child) => {
              return (
                <Link
                  key={child.id}
                  to={`/portal/children/${child.id}`}
                  className="stadium-card p-5 transition hover:border-brand-500/60"
                >
                  <p className="flex items-center gap-2 font-semibold text-white">
                    <Baby className="h-4 w-4 text-brand-400" />
                    {child.full_name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {child.age_group ?? 'Age group not set'}
                    {child.position ? ` · ${child.position}` : ''}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-brand-400">
                    View profile, attendance, reports &amp; fees →
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            Upcoming sessions
          </h2>
          <Link
            to="/portal/children"
            className="text-sm font-semibold text-brand-400 hover:text-brand-300"
          >
            View children →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No upcoming sessions"
              body="No training sessions are scheduled from today for your children's teams."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {upcoming.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 stadium-card px-5 py-4"
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
                <span className="rounded-full bg-charcoal-800 px-3 py-1 text-xs font-semibold text-zinc-300">
                  {s.category}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/portal/matches"
          className="flex items-start gap-4 stadium-card p-5 transition hover:border-brand-500/60"
        >
          <span className="rounded-xl bg-brand-500/15 p-3 text-brand-400">
            <Trophy className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-white">Matches</span>
            <span className="mt-1 block text-sm text-zinc-400">
              Fixtures and results for your children's teams.
            </span>
          </span>
        </Link>
        <Link
          to="/portal/fees"
          className="flex items-start gap-4 stadium-card p-5 transition hover:border-brand-500/60"
        >
          <span className="rounded-xl bg-brand-500/15 p-3 text-brand-400">
            <Wallet className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-white">Fees</span>
            <span className="mt-1 block text-sm text-zinc-400">
              Outstanding fees and payment history — no online payments here.
            </span>
          </span>
        </Link>
        <Link
          to="/portal/announcements"
          className="flex items-start gap-4 stadium-card p-5 transition hover:border-brand-500/60"
        >
          <span className="rounded-xl bg-brand-500/15 p-3 text-brand-400">
            <Megaphone className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-white">Announcements</span>
            <span className="mt-1 block text-sm text-zinc-400">
              News from the academy for parents.
            </span>
          </span>
        </Link>
      </section>

      {announcements.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
              Latest announcements
            </h2>
            <Link
              to="/portal/announcements"
              className="text-sm font-semibold text-brand-400 hover:text-brand-300"
            >
              View all →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="stadium-card px-5 py-4"
              >
                <p className="flex items-center gap-2 font-semibold text-white">
                  <CalendarDays className="h-4 w-4 text-brand-400" />
                  {a.title}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{a.body}</p>
                <p className="mt-1 text-xs text-zinc-500">{formatDate(a.created_at.slice(0, 10))}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
