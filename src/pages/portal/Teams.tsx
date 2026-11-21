import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchAttendanceForSessions,
  fetchTeamPlayers,
  fetchVisibleSessions,
  fetchVisibleTeams,
  supabaseErrorMessage,
} from '../../lib/data'
import type {
  AttendanceRecord,
  Player,
  Team,
  TrainingSession,
} from '../../lib/types'
import {
  LOW_ATTENDANCE_THRESHOLD,
  attendancePct,
  formatDate,
  formatTime,
} from '../../lib/utils'
import {
  DemoBadge,
  EmptyState,
  ErrorBanner,
  Spinner,
} from '../../components/ui'

interface TeamData {
  team: Team
  players: Player[]
  sessions: TrainingSession[]
  records: AttendanceRecord[]
}

export default function Teams() {
  const { profile, coach } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TeamData[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!profile || !supabase) return
      setLoading(true)
      setError(null)
      try {
        const teams = await fetchVisibleTeams(profile, coach)
        const teamIds = teams.map((t) => t.id)
        const sessions = await fetchVisibleSessions(profile, coach, teamIds)
        const records = await fetchAttendanceForSessions(
          sessions.map((s) => s.id),
        )
        const rows: TeamData[] = []
        for (const team of teams) {
          const players = await fetchTeamPlayers(team.id)
          rows.push({
            team,
            players,
            sessions: sessions.filter((s) => s.team_id === team.id),
            records: records.filter((r) =>
              sessions.some(
                (s) => s.id === r.training_session_id && s.team_id === team.id,
              ),
            ),
          })
        }
        if (!cancelled) setData(rows)
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

  if (loading) return <Spinner label="Loading teams…" />
  if (error) return <ErrorBanner message={error} />

  return (
    <div>
      <h1 className="font-display text-3xl font-medium tracking-normal text-white">
        {profile?.role === 'admin' ? 'All teams' : 'My teams'}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Players, attendance statistics and training history — all from the
        database, nothing hardcoded.
      </p>

      {data.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No teams yet"
            body={
              profile?.role === 'admin'
                ? 'Create a team from Manage Teams, then assign a coach and players.'
                : 'No teams are assigned to you yet. Ask the academy admin to assign you a team.'
            }
            action={
              profile?.role === 'admin' ? (
                <Link
                  to="/portal/admin/teams"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Users className="h-4 w-4" />
                  Manage Teams
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {data.map(({ team, players, sessions, records }) => {
            const teamStats = attendancePct(records)
            return (
              <article
                key={team.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl"
              >
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                      {team.name}
                      {team.is_demo && <DemoBadge />}
                    </h2>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      {team.age_group}
                      {team.coach ? ` · Coach: ${team.coach.full_name}` : ' · No coach assigned'}
                      {` · ${players.length} player${players.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                      Team attendance
                    </p>
                    <p className="font-display text-2xl font-semibold text-white">
                      {records.length === 0 ? '—' : `${teamStats.pct}%`}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {records.length === 0
                        ? 'No attendance marked yet'
                        : `${teamStats.present + teamStats.late} attended of ${teamStats.total} marks`}
                    </p>
                  </div>
                </header>

                <div className="grid gap-0 md:grid-cols-2">
                  {/* Players + per-player attendance */}
                  <div className="border-b border-white/10 p-5 md:border-r md:border-b-0">
                    <h3 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                      Players &amp; attendance
                    </h3>
                    {players.length === 0 ? (
                      <p className="mt-3 text-sm text-zinc-500">
                        No players registered in this team yet.
                      </p>
                    ) : (
                      <ul className="mt-3 divide-y divide-white/10">
                        {players.map((p) => {
                          const mine = records.filter(
                            (r) => r.player_id === p.id,
                          )
                          const stats = attendancePct(mine)
                          const low =
                            mine.length >= 3 && stats.pct < LOW_ATTENDANCE_THRESHOLD
                          return (
                            <li
                              key={p.id}
                              className="flex items-center justify-between gap-3 py-2.5"
                            >
                              <span className="text-sm text-zinc-200">
                                {p.full_name}
                                {p.is_demo && (
                                  <span className="ml-2">
                                    <DemoBadge />
                                  </span>
                                )}
                              </span>
                              <span className="text-right text-sm">
                                {mine.length === 0 ? (
                                  <span className="text-zinc-500">No marks yet</span>
                                ) : (
                                  <>
                                    <span
                                      className={`font-semibold ${low ? 'text-amber-400' : 'text-white'}`}
                                    >
                                      {stats.pct}%
                                    </span>
                                    <span className="ml-1.5 text-xs text-zinc-500">
                                      ({stats.present + stats.late}/{stats.total})
                                    </span>
                                    {low && (
                                      <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                                        LOW
                                      </span>
                                    )}
                                  </>
                                )}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Training history */}
                  <div className="p-5">
                    <h3 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                      Training history
                    </h3>
                    {sessions.length === 0 ? (
                      <p className="mt-3 text-sm text-zinc-500">
                        No training sessions yet for this team.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {sessions.slice(0, 6).map((s) => (
                          <li key={s.id}>
                            <Link
                              to={`/portal/sessions/${s.id}`}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm transition hover:border-gold-500/40"
                            >
                              <span className="flex items-center gap-2 text-zinc-200">
                                <CalendarDays className="h-4 w-4 shrink-0 text-brand-400" />
                                {s.title ?? `${s.category} session`}
                              </span>
                              <span className="shrink-0 text-xs text-zinc-400">
                                {formatDate(s.session_date)} · {formatTime(s.start_time)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    {sessions.length > 6 && (
                      <Link
                        to="/portal/sessions"
                        className="mt-3 inline-block text-sm font-semibold text-brand-400 hover:text-brand-300"
                      >
                        View all {sessions.length} sessions →
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
