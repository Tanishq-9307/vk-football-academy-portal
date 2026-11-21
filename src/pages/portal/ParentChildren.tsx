import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Baby } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchAttendanceForPlayer,
  fetchFeeRecordsForPlayers,
  fetchReportsForPlayer,
  fetchTeamsForPlayers,
  supabaseErrorMessage,
} from '../../lib/data'
import type { Player } from '../../lib/types'
import { ageFromDob, attendancePct, feeOutstanding } from '../../lib/utils'
import { DemoBadge, EmptyState, ErrorBanner, Spinner } from '../../components/ui'

interface ChildSummary {
  child: Player
  teamNames: string
  attendancePct: number
  marks: number
  outstanding: number
  latestReport: string | null
}

export default function ParentChildren() {
  const { children } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<ChildSummary[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const childIds = children.map((c) => c.id)
        const fees = await fetchFeeRecordsForPlayers(childIds)
        // team names per child need the roster; fetch per child in parallel
        const perChild = await Promise.all(
          children.map(async (child) => {
            const [childTeams, records, reports] = await Promise.all([
              fetchTeamsForPlayers([child.id]),
              fetchAttendanceForPlayer(child.id),
              fetchReportsForPlayer(child.id),
            ])
            const stats = attendancePct(records)
            const outstanding = fees
              .filter((f) => f.player_id === child.id)
              .reduce((sum, f) => sum + feeOutstanding(f.amount_due, f.amount_paid), 0)
            return {
              child,
              teamNames: childTeams.map((t) => t.name).join(' · ') || 'No team yet',
              attendancePct: stats.pct,
              marks: stats.total,
              outstanding,
              latestReport: reports[0]?.assessment_date ?? null,
            } as ChildSummary
          }),
        )
        if (!cancelled) setSummaries(perChild)
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
  }, [children])

  if (loading) return <Spinner label="Loading your children…" />
  if (error) return <ErrorBanner message={error} />

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
        My Children
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Select a child to see their full profile, training, attendance,
        development reports and fees.
      </p>

      {summaries.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No children linked yet"
            body="Your login isn't linked to a player yet. Ask the academy admin to link your account to your child — then their record will appear here."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {summaries.map((s) => {
            const age = ageFromDob(s.child.date_of_birth)
            return (
              <li key={s.child.id}>
                <Link
                  to={`/portal/children/${s.child.id}`}
                  className="block card card-hover px-5 py-4"
                >
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                    <Baby className="h-4 w-4 text-brand-400" />
                    {s.child.full_name}
                    {s.child.is_demo && <DemoBadge />}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {s.teamNames}
                    {s.child.age_group ? ` · ${s.child.age_group}` : ''}
                    {age !== null ? ` · Age ${age}` : ''}
                    {s.child.position ? ` · ${s.child.position}` : ''}
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    Attendance:{' '}
                    {s.marks === 0 ? (
                      <span className="text-zinc-500">no marks yet</span>
                    ) : (
                      <span className="font-semibold text-white">{s.attendancePct}%</span>
                    )}
                    {' · '}
                    Outstanding fees:{' '}
                    <span className="font-semibold text-white">
                      ₹{s.outstanding.toLocaleString('en-IN')}
                    </span>
                    {' · '}
                    Latest report:{' '}
                    {s.latestReport ? (
                      <span className="text-white">{s.latestReport}</span>
                    ) : (
                      <span className="text-zinc-500">none yet</span>
                    )}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-brand-400">
                    View full record →
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
