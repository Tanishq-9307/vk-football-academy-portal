import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchAttendanceForSession,
  fetchAttendanceForSessions,
  fetchTeamPlayers,
  fetchVisibleSessions,
  fetchVisibleTeams,
  supabaseErrorMessage,
} from '../../lib/data'
import type {
  AttendanceRecord,
  AttendanceStatus,
  Player,
  Team,
  TrainingSession,
} from '../../lib/types'
import { ATTENDANCE_LABELS } from '../../lib/types'
import {
  LOW_ATTENDANCE_THRESHOLD,
  attendancePct,
  formatDate,
  formatDateTime,
  todayIso,
} from '../../lib/utils'
import {
  DemoBadge,
  EmptyState,
  ErrorBanner,
  PrimaryButton,
  Spinner,
  StatusPill,
  useToast,
} from '../../components/ui'

type Tab = 'mark' | 'history'

export default function Attendance() {
  const { profile, coach } = useAuth()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(
    searchParams.get('tab') === 'history' ? 'history' : 'mark',
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])

  // Mark tab state
  const [sessionId, setSessionId] = useState(searchParams.get('session') ?? '')
  const [players, setPlayers] = useState<Player[]>([])
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({})
  const [markedBy, setMarkedBy] = useState<Record<string, { at: string }>>({})
  const [markLoading, setMarkLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // History tab state
  const [historyTeam, setHistoryTeam] = useState('all')
  const [historyPlayer, setHistoryPlayer] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([])
  const [historySessions, setHistorySessions] = useState<TrainingSession[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!profile) return
      setLoading(true)
      setError(null)
      try {
        const visibleTeams = await fetchVisibleTeams(profile, coach)
        if (cancelled) return
        setTeams(visibleTeams)
        const list = await fetchVisibleSessions(
          profile,
          coach,
          visibleTeams.map((t) => t.id),
        )
        if (cancelled) return
        setSessions(list)
        if (!sessionId && list.length > 0) {
          // Default to the nearest session: today or the most recent past one.
          const today = todayIso()
          const upcoming = list
            .filter((s) => s.status !== 'cancelled' && s.session_date >= today)
            .sort((a, b) =>
              `${a.session_date}T${a.start_time}`.localeCompare(
                `${b.session_date}T${b.start_time}`,
              ),
            )
          const chosen =
            upcoming[0] ??
            list
              .filter((s) => s.status !== 'cancelled')
              .sort((a, b) =>
                `${b.session_date}T${b.start_time}`.localeCompare(
                  `${a.session_date}T${a.start_time}`,
                ),
              )[0]
          if (chosen) setSessionId(chosen.id)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, coach])

  const selectedSession = sessions.find((s) => s.id === sessionId)

  // Load the roster + existing marks whenever the selected session changes.
  useEffect(() => {
    let cancelled = false
    async function loadSession() {
      if (!selectedSession) {
        setPlayers([])
        setMarks({})
        return
      }
      setMarkLoading(true)
      try {
        const [roster, existing] = await Promise.all([
          fetchTeamPlayers(selectedSession.team_id),
          fetchAttendanceForSession(selectedSession.id),
        ])
        if (cancelled) return
        setPlayers(roster)
        const next: Record<string, AttendanceStatus> = {}
        const by: Record<string, { at: string }> = {}
        existing.forEach((r) => {
          next[r.player_id] = r.status
          by[r.player_id] = { at: r.marked_at }
        })
        setMarks(next)
        setMarkedBy(by)
      } catch (e) {
        if (!cancelled) setError(await supabaseErrorMessage(e))
      } finally {
        if (!cancelled) setMarkLoading(false)
      }
    }
    void loadSession()
    return () => {
      cancelled = true
    }
  }, [selectedSession])

  function switchTab(next: Tab) {
    setTab(next)
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        p.set('tab', next)
        if (sessionId) p.set('session', sessionId)
        return p
      },
      { replace: true },
    )
    if (next === 'history') void loadHistory()
  }

  async function loadHistory() {
    if (!profile || !supabase) return
    setHistoryLoading(true)
    try {
      const visibleTeams = teams.length > 0 ? teams : await fetchVisibleTeams(profile, coach)
      const teamIds = visibleTeams.map((t) => t.id)
      let sessionQuery = supabase
        .from('training_sessions')
        .select('*, team:teams(*)')
        .in('team_id', teamIds)
        .order('session_date', { ascending: false })
      if (historyTeam !== 'all') sessionQuery = sessionQuery.eq('team_id', historyTeam)
      if (fromDate) sessionQuery = sessionQuery.gte('session_date', fromDate)
      if (toDate) sessionQuery = sessionQuery.lte('session_date', toDate)
      const { data: sessData, error: sessErr } = await sessionQuery
      if (sessErr) throw new Error(sessErr.message)
      const sessList = (sessData ?? []) as TrainingSession[]
      setHistorySessions(sessList)
      let recs = await fetchAttendanceForSessions(sessList.map((s) => s.id))
      if (historyPlayer !== 'all') {
        recs = recs.filter((r) => r.player_id === historyPlayer)
      }
      setHistoryRecords(recs)
    } catch (e) {
      toast(await supabaseErrorMessage(e), 'error')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Load history once when the page opens on the history tab.
  useEffect(() => {
    if (tab === 'history' && teams.length > 0) void loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, teams.length])

  const markStats = useMemo(() => {
    const list = players.map((p) => marks[p.id]).filter(Boolean) as AttendanceStatus[]
    return attendancePct(list.map((status) => ({ status })))
  }, [players, marks])

  async function handleSave() {
    if (!supabase || !selectedSession || !profile) return
    const unmarked = players.filter((p) => !marks[p.id])
    if (unmarked.length > 0) {
      toast(
        `${unmarked.length} player${unmarked.length === 1 ? '' : 's'} still unmarked — mark everyone before saving.`,
        'error',
      )
      return
    }
    setSaving(true)
    try {
      const rows = players.map((p) => ({
        training_session_id: selectedSession.id,
        player_id: p.id,
        status: marks[p.id],
        marked_by: profile.id,
      }))
      const { error: upErr } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'training_session_id,player_id' })
      if (upErr) throw new Error(upErr.message)
      toast('Attendance saved.')
      const existing = await fetchAttendanceForSession(selectedSession.id)
      const by: Record<string, { at: string }> = {}
      existing.forEach((r) => {
        by[r.player_id] = { at: r.marked_at }
      })
      setMarkedBy(by)
    } catch (e) {
      toast(await supabaseErrorMessage(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  function markAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {}
    players.forEach((p) => {
      next[p.id] = status
    })
    setMarks(next)
  }

  // Per-player summary for the history tab.
  const playerSummary = useMemo(() => {
    const byPlayer = new Map<string, { player: Player; records: AttendanceRecord[] }>()
    historyRecords.forEach((r) => {
      const p = r.player
      if (!p) return
      const entry = byPlayer.get(p.id) ?? { player: p, records: [] }
      entry.records.push(r)
      byPlayer.set(p.id, entry)
    })
    return [...byPlayer.values()]
      .map(({ player, records }) => ({ player, stats: attendancePct(records) }))
      .sort((a, b) => a.stats.pct - b.stats.pct)
  }, [historyRecords])

  const historyPlayers = useMemo(() => {
    // Players of the selected history team (or all visible teams).
    const map = new Map<string, Player>()
    historyRecords.forEach((r) => {
      if (r.player) map.set(r.player.id, r.player)
    })
    return [...map.values()].sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [historyRecords])

  if (loading) return <Spinner label="Loading attendance…" />
  if (error) return <ErrorBanner message={error} />

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
        Attendance
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Mark attendance per session, and review each player's record over time.
      </p>

      <div className="mt-6 flex gap-2 stadium-card p-1.5">
        <button
          type="button"
          onClick={() => switchTab('mark')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'mark' ? 'bg-brand-500 text-white' : 'text-zinc-300 hover:bg-charcoal-800'
          }`}
        >
          Mark attendance
        </button>
        <button
          type="button"
          onClick={() => switchTab('history')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'history' ? 'bg-brand-500 text-white' : 'text-zinc-300 hover:bg-charcoal-800'
          }`}
        >
          History &amp; reports
        </button>
      </div>

      {tab === 'mark' && (
        <div className="mt-6">
          <label className="block">
            <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
              Training session
            </span>
            <select
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value)
                setSearchParams(
                  (prev) => {
                    const p = new URLSearchParams(prev)
                    p.set('session', e.target.value)
                    return p
                  },
                  { replace: true },
                )
              }}
              className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
            >
              {sessions.length === 0 && <option value="">No sessions yet</option>}
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.team?.name} · {s.title ?? `${s.category} session`} ·{' '}
                  {formatDateTime(s.session_date, s.start_time)}
                  {s.status !== 'scheduled' ? ` (${s.status})` : ''}
                </option>
              ))}
            </select>
          </label>

          {!selectedSession ? (
            <div className="mt-6">
              <EmptyState
                title="No session selected"
                body="Create a training session first, then come back here to mark attendance."
              />
            </div>
          ) : markLoading ? (
            <Spinner label="Loading players…" />
          ) : players.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No players in this team"
                body="Add players to the team from Manage Players / Manage Teams before marking attendance."
              />
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-zinc-300">
                  <strong className="text-white">{players.length}</strong> players ·{' '}
                  <strong className="text-white">{markStats.total}</strong> marked ·{' '}
                  <strong className="text-white">{markStats.pct}%</strong> attendance
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => markAll('present')}
                    className="rounded-xl border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-300"
                  >
                    All present
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarks({})}
                    className="rounded-xl border border-charcoal-600 bg-charcoal-800 px-3 py-1.5 text-xs font-semibold text-zinc-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {players.map((p) => {
                  const current = marks[p.id]
                  return (
                    <li
                      key={p.id}
                      className="stadium-card p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="flex items-center gap-2 font-medium text-white">
                          {p.full_name}
                          {p.is_demo && <DemoBadge />}
                        </span>
                        {markedBy[p.id] && (
                          <span className="text-xs text-zinc-500">
                            Last marked{' '}
                            {new Date(markedBy[p.id].at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {(
                          Object.keys(ATTENDANCE_LABELS) as AttendanceStatus[]
                        ).map((status) => {
                          const active = current === status
                          const activeStyles: Record<AttendanceStatus, string> = {
                            present: 'bg-green-500 text-white border-green-500',
                            absent: 'bg-brand-500 text-white border-brand-500',
                            late: 'bg-amber-500 text-white border-amber-500',
                            excused: 'bg-sky-500 text-white border-sky-500',
                          }
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() =>
                                setMarks((m) => ({ ...m, [p.id]: status }))
                              }
                              aria-pressed={active}
                              className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
                                active
                                  ? activeStyles[status]
                                  : 'border-charcoal-600 bg-charcoal-900 text-zinc-300 hover:border-charcoal-500'
                              }`}
                            >
                              {active && <Check className="h-3.5 w-3.5" />}
                              {ATTENDANCE_LABELS[status]}
                            </button>
                          )
                        })}
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="sticky bottom-4 mt-6">
                <PrimaryButton
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full !py-3.5 shadow-2xl"
                >
                  <ShieldCheck className="h-5 w-5" />
                  {saving
                    ? 'Saving…'
                    : `Save attendance — ${markStats.total}/${players.length} marked`}
                </PrimaryButton>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            <select
              value={historyTeam}
              onChange={(e) => setHistoryTeam(e.target.value)}
              aria-label="Filter by team"
              className="rounded-xl border border-charcoal-600 bg-charcoal-900 px-3 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={historyPlayer}
              onChange={(e) => setHistoryPlayer(e.target.value)}
              aria-label="Filter by player"
              className="rounded-xl border border-charcoal-600 bg-charcoal-900 px-3 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All players</option>
              {historyPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              From
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl border border-charcoal-600 bg-charcoal-900 px-3 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              To
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl border border-charcoal-600 bg-charcoal-900 px-3 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
            <PrimaryButton onClick={() => void loadHistory()} disabled={historyLoading}>
              {historyLoading ? 'Loading…' : 'Apply filters'}
            </PrimaryButton>
          </div>

          {historyLoading ? (
            <Spinner label="Loading history…" />
          ) : historyRecords.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No attendance records yet"
                body="Mark attendance for a session and it will show up here, with per-player percentages over the selected period."
              />
            </div>
          ) : (
            <>
              <h2 className="font-display mt-8 text-xl font-semibold tracking-wide text-white uppercase">
                Per-player summary
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Players under {LOW_ATTENDANCE_THRESHOLD}% over the selected
                period are flagged — they may need a check-in from the coach.
              </p>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-charcoal-700">
                <table className="w-full min-w-96 text-left text-sm">
                  <thead>
                    <tr className="border-b border-charcoal-700 bg-charcoal-900 text-xs tracking-widest text-zinc-400 uppercase">
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Sessions</th>
                      <th className="px-4 py-3">Present</th>
                      <th className="px-4 py-3">Absent</th>
                      <th className="px-4 py-3">Late</th>
                      <th className="px-4 py-3">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-700 bg-charcoal-850">
                    {playerSummary.map(({ player, stats }) => {
                      const low =
                        stats.total >= 3 && stats.pct < LOW_ATTENDANCE_THRESHOLD
                      return (
                        <tr key={player.id}>
                          <td className="px-4 py-3 font-medium text-white">
                            {player.full_name}
                            {low && (
                              <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                                LOW ATTENDANCE
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-zinc-300">{stats.total}</td>
                          <td className="px-4 py-3 text-zinc-300">{stats.present}</td>
                          <td className="px-4 py-3 text-zinc-300">{stats.absent}</td>
                          <td className="px-4 py-3 text-zinc-300">{stats.late}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`font-semibold ${low ? 'text-amber-400' : 'text-white'}`}
                            >
                              {stats.pct}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <h2 className="font-display mt-8 text-xl font-semibold tracking-wide text-white uppercase">
                Record by session
              </h2>
              <ul className="mt-4 space-y-3">
                {historySessions.slice(0, 20).map((s) => {
                  const recs = historyRecords.filter(
                    (r) => r.training_session_id === s.id,
                  )
                  if (recs.length === 0) return null
                  const stats = attendancePct(recs)
                  return (
                    <li
                      key={s.id}
                      className="stadium-card p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">
                          {s.team?.name} · {s.title ?? `${s.category} session`} ·{' '}
                          {formatDate(s.session_date)}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {stats.pct}% · {stats.present} present, {stats.absent}{' '}
                          absent, {stats.late} late
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {recs.map((r) => (
                          <span
                            key={r.id}
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-300"
                          >
                            {r.player?.full_name}
                            <StatusPill status={r.status} />
                          </span>
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
