import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { fetchAllMatches, supabaseErrorMessage } from '../../../lib/data'
import type { FeeRecord, Match, SessionPlan, Team } from '../../../lib/types'
import {
  attendancePct,
  feeOutstanding,
  feeStatus,
  formatDate,
  formatINR,
} from '../../../lib/utils'
import { DemoBadge, EmptyState, ErrorBanner, Spinner, StatCard } from '../../../components/ui'

interface TeamSummary {
  team: Team
  players: number
  sessions: number
  attendancePct: number
  marks: number
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<TeamSummary[]>([])
  const [plans, setPlans] = useState<SessionPlan[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase) return
      setLoading(true)
      setError(null)
      try {
        const [
          { data: teams, error: tErr },
          { data: tp },
          { data: sessions },
          { data: attendance },
          { data: plansData, error: pErr },
          { data: feeData, error: fErr },
          matchesData,
        ] = await Promise.all([
          supabase.from('teams').select('*, coach:coaches(*)').order('age_group').order('name'),
          supabase.from('team_players').select('team_id'),
          supabase.from('training_sessions').select('id, team_id'),
          supabase.from('attendance').select('training_session_id, status'),
          supabase
            .from('session_plans')
            .select('*, session:training_sessions(*), team:teams(*), coach:coaches(*)')
            .order('updated_at', { ascending: false })
            .limit(10),
          supabase
            .from('fee_records')
            .select('*, player:players(*), structure:fee_structures(*)')
            .order('created_at', { ascending: false }),
          fetchAllMatches(),
        ])
        if (tErr) throw new Error(tErr.message)
        if (pErr) throw new Error(pErr.message)
        if (fErr) throw new Error(fErr.message)
        const teamList = (teams ?? []) as Team[]
        const sessionTeam = new Map<string, string>()
        ;(sessions ?? []).forEach((s) => {
          sessionTeam.set(s.id as string, s.team_id as string)
        })
        const summaries: TeamSummary[] = teamList.map((team) => {
          const teamSessionIds = new Set(
            (sessions ?? [])
              .filter((s) => s.team_id === team.id)
              .map((s) => s.id as string),
          )
          const teamRecords = (attendance ?? []).filter((r) =>
            teamSessionIds.has(r.training_session_id as string),
          )
          const stats = attendancePct(
            teamRecords.map((r) => ({ status: r.status as 'present' | 'absent' | 'late' | 'excused' })),
          )
          return {
            team,
            players: (tp ?? []).filter((r) => r.team_id === team.id).length,
            sessions: teamSessionIds.size,
            attendancePct: stats.pct,
            marks: stats.total,
          }
        })
        if (!cancelled) {
          setSummaries(summaries)
          setPlans((plansData ?? []) as SessionPlan[])
          setMatches(matchesData)
          setFeeRecords((feeData ?? []) as FeeRecord[])
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
  }, [])

  if (loading) return <Spinner label="Loading overview…" />
  if (error) return <ErrorBanner message={error} />

  const feesDue = feeRecords.reduce((s, r) => s + r.amount_due, 0)
  const feesCollected = feeRecords.reduce((s, r) => s + r.amount_paid, 0)
  const feesOutstanding = feeRecords.reduce(
    (s, r) => s + feeOutstanding(r.amount_due, r.amount_paid),
    0,
  )
  const feesOverdue = feeRecords.filter(
    (r) =>
      feeStatus(r.amount_due, r.amount_paid, r.structure?.due_date ?? null) === 'overdue',
  ).length
  const sortedMatches = [...matches].sort((a, b) =>
    `${a.match_date}T${a.start_time ?? '00:00'}`.localeCompare(
      `${b.match_date}T${b.start_time ?? '00:00'}`,
    ),
  )
  const upcomingMatches = sortedMatches.filter((m) => m.status === 'scheduled').slice(0, 5)
  const recentResults = sortedMatches
    .filter((m) => m.status === 'completed')
    .sort((a, b) =>
      `${b.match_date}T${b.start_time ?? '00:00'}`.localeCompare(
        `${a.match_date}T${a.start_time ?? '00:00'}`,
      ),
    )
    .slice(0, 5)

  return (
    <div>
      <h1 className="font-display text-3xl font-medium tracking-normal text-white">
        Admin Overview
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Every team at a glance, plus the latest session plans across the academy.
      </p>

      <section className="mt-6">
        <h2 className="font-display text-xl font-medium tracking-normal text-white">
          Teams
        </h2>
        {summaries.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No teams yet"
              body="Create teams from Manage Teams — then assign coaches and players."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-xs tracking-widest text-zinc-400 uppercase">
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Coach</th>
                  <th className="px-4 py-3">Players</th>
                  <th className="px-4 py-3">Sessions</th>
                  <th className="px-4 py-3">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-white/[0.04]">
                {summaries.map((s) => (
                  <tr key={s.team.id}>
                    <td className="px-4 py-3 font-medium text-white">
                      <span className="flex items-center gap-2">
                        {s.team.name}
                        {s.team.is_demo && <DemoBadge />}
                      </span>
                      <span className="text-xs text-zinc-500">{s.team.age_group}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {s.team.coach?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{s.players}</td>
                    <td className="px-4 py-3 text-zinc-300">{s.sessions}</td>
                    <td className="px-4 py-3">
                      {s.marks === 0 ? (
                        <span className="text-zinc-500">No marks yet</span>
                      ) : (
                        <span className="font-semibold text-white">
                          {s.attendancePct}%
                          <span className="ml-1 text-xs font-normal text-zinc-500">
                            ({s.marks} marks)
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium tracking-normal text-white">
            Fees
          </h2>
          <Link
            to="/portal/admin/fees"
            className="text-sm font-semibold text-brand-400 hover:text-brand-300"
          >
            Manage fees →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total due" value={formatINR(feesDue)} />
          <StatCard label="Collected" value={formatINR(feesCollected)} />
          <StatCard label="Outstanding" value={formatINR(feesOutstanding)} />
          <StatCard
            label="Overdue records"
            value={String(feesOverdue)}
            sub="Unpaid past the due date"
          />
        </div>
        {feesOverdue > 0 && (
          <p className="mt-3 text-sm text-amber-400">
            {feesOverdue} payment record{feesOverdue === 1 ? ' is' : 's are'} overdue —
            check Manage Fees for details.
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium tracking-normal text-white">
            Matches
          </h2>
          <Link
            to="/portal/matches"
            className="text-sm font-semibold text-brand-400 hover:text-brand-300"
          >
            View all →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
              Upcoming fixtures
            </h3>
            {upcomingMatches.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No fixtures scheduled.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcomingMatches.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] backdrop-blur-xl px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-white">{m.team?.name}</span>
                    <span className="text-zinc-400">vs {m.opponent}</span>
                    {m.is_demo && <DemoBadge />}
                    <span className="ml-auto shrink-0 text-xs text-zinc-500">
                      {formatDate(m.match_date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
              Recent results
            </h3>
            {recentResults.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No results recorded yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recentResults.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] backdrop-blur-xl px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-white">{m.team?.name}</span>
                    <span className="text-zinc-400">vs {m.opponent}</span>
                    <span className="ml-auto shrink-0 font-semibold text-gold-400">
                      {m.home_score} – {m.away_score}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {formatDate(m.match_date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium tracking-normal text-white">
            Latest session plans
          </h2>
          <Link
            to="/portal/plans"
            className="text-sm font-semibold text-brand-400 hover:text-brand-300"
          >
            View all →
          </Link>
        </div>
        {plans.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No session plans yet"
              body="When coaches create plans, the newest ones will show up here for review."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {plans.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/portal/plans/${p.id}`}
                  className="block rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl px-5 py-4 transition hover:border-gold-500/40"
                >
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                    {p.title}
                    {p.is_demo && <DemoBadge />}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {p.team?.name}
                    {p.session ? ` · ${formatDate(p.session.session_date)}` : ''}
                    {p.coach ? ` · ${p.coach.full_name}` : ''}
                    {p.file_name ? ` · 📎 ${p.file_name}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
