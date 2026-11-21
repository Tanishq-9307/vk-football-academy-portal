import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchAttendanceForPlayer,
  fetchFeeRecordsForPlayers,
  fetchMatchesForTeams,
  fetchReportsForPlayer,
  fetchTeamsForPlayers,
  fetchVisibleSessions,
  supabaseErrorMessage,
} from '../../lib/data'
import type {
  AttendanceRecord,
  FeeRecord,
  Match,
  PlayerReport,
  Team,
  TrainingSession,
} from '../../lib/types'
import { REPORT_AREAS } from '../../lib/types'
import {
  ageFromDob,
  attendancePct,
  feeOutstanding,
  feeStatus,
  formatDate,
  formatDateTime,
  formatINR,
  formatTime,
  todayIso,
} from '../../lib/utils'
import {
  DemoBadge,
  EmptyState,
  ErrorBanner,
  FeeStatusPill,
  Spinner,
  StatCard,
  StatusPill,
} from '../../components/ui'
import { MATCH_STATUS_LABELS } from '../../lib/types'

export default function ParentChild() {
  const { playerId } = useParams<{ playerId: string }>()
  const { profile, children } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [upcoming, setUpcoming] = useState<TrainingSession[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [reports, setReports] = useState<PlayerReport[]>([])
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [matches, setMatches] = useState<Match[]>([])

  const child = children.find((c) => c.id === playerId) ?? null

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!profile || !child || !supabase) return
      setLoading(true)
      setError(null)
      try {
        const childTeams = await fetchTeamsForPlayers([child.id])
        if (cancelled) return
        setTeams(childTeams)
        const teamIds = childTeams.map((t) => t.id)
        const [sessions, attendance, reps, feeRecs, matchList] = await Promise.all([
          fetchVisibleSessions(profile, null, []),
          fetchAttendanceForPlayer(child.id),
          fetchReportsForPlayer(child.id),
          fetchFeeRecordsForPlayers([child.id]),
          fetchMatchesForTeams(teamIds),
        ])
        if (cancelled) return
        const today = todayIso()
        setUpcoming(
          sessions
            .filter(
              (s) =>
                s.status === 'scheduled' &&
                s.session_date >= today &&
                teamIds.includes(s.team_id),
            )
            .sort((a, b) =>
              `${a.session_date}T${a.start_time}`.localeCompare(
                `${b.session_date}T${b.start_time}`,
              ),
            )
            .slice(0, 5),
        )
        setRecords(attendance)
        setReports(reps)
        setFees(feeRecs)
        setMatches(matchList)
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
  }, [profile, child])

  if (!child) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
          Child not found
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          This player is not linked to your account. If this is your child,
          ask the academy admin to link them to your login.
        </p>
        <Link
          to="/portal/children"
          className="mt-4 inline-block text-sm font-semibold text-brand-400 hover:text-brand-300"
        >
          ← Back to My Children
        </Link>
      </div>
    )
  }

  if (loading) return <Spinner label="Loading your child's record…" />
  if (error) return <ErrorBanner message={error} />

  const stats = attendancePct(records)
  const outstanding = fees.reduce(
    (sum, f) => sum + feeOutstanding(f.amount_due, f.amount_paid),
    0,
  )
  const latestReport = reports[0] ?? null
  const age = ageFromDob(child.date_of_birth)

  return (
    <div>
      <Link
        to="/portal/children"
        className="text-sm font-semibold text-brand-400 hover:text-brand-300"
      >
        ← My Children
      </Link>
      <h1 className="font-display mt-3 flex flex-wrap items-center gap-3 text-3xl font-semibold tracking-wide text-white uppercase">
        {child.full_name}
        {child.is_demo && <DemoBadge />}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        {teams.map((t) => t.name).join(' · ') || 'No team yet'}
        {child.age_group ? ` · ${child.age_group}` : ''}
        {age !== null ? ` · Age ${age}` : ''}
        {child.position ? ` · ${child.position}` : ''}
        {child.date_of_birth ? ` · Born ${formatDate(child.date_of_birth)}` : ''}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance"
          value={`${stats.pct}%`}
          sub={
            stats.total === 0
              ? 'No attendance marked yet'
              : `${stats.present + stats.late} attended of ${stats.total} sessions`
          }
        />
        <StatCard
          label="Outstanding fees"
          value={formatINR(outstanding)}
          sub={fees.length === 0 ? 'No fee records' : `${fees.length} fee record${fees.length === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Development reports"
          value={String(reports.length)}
          sub={
            latestReport
              ? `Latest: ${formatDate(latestReport.assessment_date)}`
              : 'No assessments yet'
          }
        />
        <StatCard
          label="Upcoming sessions"
          value={String(upcoming.length)}
          sub="Scheduled from today"
        />
      </div>

      {/* Upcoming training */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
          Upcoming training
        </h2>
        {upcoming.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No upcoming sessions"
              body="No training sessions are scheduled from today for your child's team."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {upcoming.map((s) => (
              <li
                key={s.id}
                className="stadium-card px-5 py-4"
              >
                <p className="font-semibold text-white">
                  {s.title ?? `${s.category} session`}
                </p>
                <p className="mt-0.5 text-sm text-zinc-400">
                  {s.team?.name} · {formatDateTime(s.session_date, s.start_time)} ·{' '}
                  {s.duration_minutes} min
                  {s.pitch ? ` · ${s.pitch}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Attendance history */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
          Attendance history
        </h2>
        {records.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No attendance yet"
              body="Once coaches mark attendance for your child's sessions, the record will show here."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-charcoal-700">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-charcoal-700 bg-charcoal-900 text-xs tracking-widest text-zinc-400 uppercase">
                  <th className="px-4 py-3">Marked</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-700 bg-charcoal-850">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-zinc-300">
                      {formatDate(r.marked_at.slice(0, 10))} ·{' '}
                      {formatTime(r.marked_at.slice(11, 19) || '00:00')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {records.length > 0 && (
          <p className="mt-3 text-sm text-zinc-400">
            {stats.present} present · {stats.late} late · {stats.absent} absent ·{' '}
            {stats.excused} excused — attendance counts present and late as
            attended.
          </p>
        )}
      </section>

      {/* Development reports */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
          Development reports
        </h2>
        {reports.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No reports yet"
              body="When your child's coach writes a development assessment, it will appear here."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {reports.map((rep, i) => {
              const previous = reports[i + 1] ?? null
              return (
                <li
                  key={rep.id}
                  className="stadium-card p-5"
                >
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                    Assessment — {formatDate(rep.assessment_date)}
                    {rep.is_demo && <DemoBadge />}
                    <span className="text-xs font-normal text-zinc-500">
                      by {rep.coach?.full_name ?? 'Coach'}
                      {rep.session ? ` · after ${rep.session.title ?? 'a session'}` : ''}
                    </span>
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {REPORT_AREAS.map((area) => {
                      const value = rep.ratings[area.key]
                      const prev = previous?.ratings[area.key]
                      return (
                        <div
                          key={area.key}
                          className="rounded-xl border border-charcoal-700 bg-charcoal-900 px-4 py-3"
                        >
                          <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                            {area.label}
                          </p>
                          <p className="mt-1 text-xl font-semibold text-white">
                            {value ?? '—'}
                            <span className="text-sm font-normal text-zinc-500"> / 10</span>
                            {value !== undefined && prev !== undefined && (
                              <span
                                className={`ml-2 text-sm font-semibold ${
                                  value > prev
                                    ? 'text-green-400'
                                    : value < prev
                                      ? 'text-brand-400'
                                      : 'text-zinc-500'
                                }`}
                              >
                                {value > prev ? `▲ +${value - prev}` : value < prev ? `▼ ${value - prev}` : '— same'}
                              </span>
                            )}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    {(
                      [
                        ['Strengths', rep.strengths],
                        ['Areas to improve', rep.areas_of_improvement],
                        ['Areas needing attention', rep.areas_requiring_attention],
                        ['Weaknesses', rep.weaknesses],
                        ['Development objectives', rep.objectives],
                        ['Coach recommendations', rep.recommendations],
                      ] as const
                    ).map(
                      ([label, value]) =>
                        value && (
                          <div key={label} className="flex gap-2">
                            <dt className="w-48 shrink-0 font-semibold text-zinc-300">{label}</dt>
                            <dd className="text-zinc-400">{value}</dd>
                          </div>
                        ),
                    )}
                  </dl>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Fees */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            Fees
          </h2>
          <Link
            to="/portal/fees"
            className="text-sm font-semibold text-brand-400 hover:text-brand-300"
          >
            All fees →
          </Link>
        </div>
        {fees.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No fee records"
              body="No fees have been recorded for your child yet."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-charcoal-700">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-charcoal-700 bg-charcoal-900 text-xs tracking-widest text-zinc-400 uppercase">
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Outstanding</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-700 bg-charcoal-850">
                {fees.map((f) => {
                  const status = feeStatus(
                    f.amount_due,
                    f.amount_paid,
                    f.structure?.due_date ?? null,
                  )
                  return (
                    <tr key={f.id}>
                      <td className="px-4 py-3 font-medium text-white">
                        {f.structure?.name ?? 'Fee'}
                        {f.is_demo && <DemoBadge />}
                        <span className="block text-xs font-normal text-zinc-500">
                          {f.structure?.due_date
                            ? `Due ${formatDate(f.structure.due_date)}`
                            : 'No due date set'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{formatINR(f.amount_due)}</td>
                      <td className="px-4 py-3 text-zinc-300">{formatINR(f.amount_paid)}</td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {formatINR(feeOutstanding(f.amount_due, f.amount_paid))}
                      </td>
                      <td className="px-4 py-3">
                        <FeeStatusPill status={status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-sm text-zinc-500">
          Fees are settled with the academy directly — this portal does not
          take online payments.
        </p>
      </section>

      {/* Matches */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
          Matches
        </h2>
        {matches.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No matches yet"
              body="Fixtures for your child's team will appear here once the coach schedules them."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {matches.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 stadium-card px-5 py-4"
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                    {m.team?.name} vs {m.opponent}
                    {m.is_demo && <DemoBadge />}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {formatDateTime(m.match_date, m.start_time)}
                    {m.venue ? ` · ${m.venue}` : ''}
                  </p>
                  {m.observations && (
                    <p className="mt-1 text-sm text-zinc-500">{m.observations}</p>
                  )}
                </div>
                <div className="text-right">
                  {m.status === 'completed' && m.home_score !== null && m.away_score !== null ? (
                    <p className="font-display text-2xl font-semibold text-white">
                      {m.home_score} – {m.away_score}
                    </p>
                  ) : (
                    <span className="rounded-full bg-charcoal-800 px-3 py-1 text-xs font-semibold text-zinc-300">
                      {MATCH_STATUS_LABELS[m.status]}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
