import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Trash2, Trophy, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchAllMatches,
  fetchMatchesForTeams,
  fetchTeamsForPlayers,
  fetchVisibleTeams,
  supabaseErrorMessage,
} from '../../lib/data'
import type { Match, MatchStatus, Team } from '../../lib/types'
import { MATCH_STATUS_LABELS } from '../../lib/types'
import { formatDate, formatDateTime, formatTime, todayIso } from '../../lib/utils'
import {
  ConfirmDialog,
  DemoBadge,
  EmptyState,
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  useToast,
} from '../../components/ui'

interface MatchForm {
  team_id: string
  opponent: string
  match_date: string
  start_time: string
  venue: string
  status: MatchStatus
  home_score: string
  away_score: string
  goals: string
  observations: string
}

const EMPTY_FORM: MatchForm = {
  team_id: '',
  opponent: '',
  match_date: '',
  start_time: '17:00',
  venue: 'Urban Turf',
  status: 'scheduled',
  home_score: '',
  away_score: '',
  goals: '',
  observations: '',
}

export default function Matches() {
  const toast = useToast()
  const { profile, coach, children } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Match | null>(null)
  const [form, setForm] = useState<MatchForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Match | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const canManage = isAdmin || profile?.role === 'coach'
  const isParent = profile?.role === 'parent'

  const load = async () => {
    if (!profile || !supabase) return
    setLoading(true)
    setError(null)
    try {
      if (isAdmin) {
        const [allMatches, allTeams] = await Promise.all([
          fetchAllMatches(),
          fetchVisibleTeams(profile, null),
        ])
        setMatches(allMatches)
        setTeams(allTeams)
      } else if (profile.role === 'coach') {
        const visibleTeams = await fetchVisibleTeams(profile, coach)
        setTeams(visibleTeams)
        setMatches(await fetchMatchesForTeams(visibleTeams.map((t) => t.id)))
      } else {
        const childTeams = await fetchTeamsForPlayers(children.map((c) => c.id))
        setTeams(childTeams)
        setMatches(await fetchMatchesForTeams(childTeams.map((t) => t.id)))
      }
    } catch (e) {
      setError(await supabaseErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, coach, children])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, team_id: teams[0]?.id ?? '' })
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(m: Match) {
    setEditing(m)
    setForm({
      team_id: m.team_id,
      opponent: m.opponent,
      match_date: m.match_date,
      start_time: m.start_time.slice(0, 5),
      venue: m.venue ?? '',
      status: m.status,
      home_score: m.home_score === null ? '' : String(m.home_score),
      away_score: m.away_score === null ? '' : String(m.away_score),
      goals: m.goals ?? '',
      observations: m.observations ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  function openResult(m: Match) {
    openEdit(m)
    setForm((f) => ({ ...f, status: 'completed' }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !profile) return
    setFormError(null)
    if (!form.team_id) return setFormError('Pick a team.')
    if (!form.opponent.trim()) return setFormError('Enter the opponent.')
    if (!form.match_date) return setFormError('Pick a match date.')
    if (!form.start_time) return setFormError('Pick a start time.')
    const home = form.home_score.trim() === '' ? null : Number(form.home_score)
    const away = form.away_score.trim() === '' ? null : Number(form.away_score)
    if (home !== null && (!Number.isInteger(home) || home < 0)) {
      return setFormError('Home score must be a whole number, 0 or more.')
    }
    if (away !== null && (!Number.isInteger(away) || away < 0)) {
      return setFormError('Away score must be a whole number, 0 or more.')
    }
    if (form.status === 'completed' && (home === null || away === null)) {
      return setFormError('A completed match needs both scores.')
    }
    setSaving(true)
    const payload = {
      team_id: form.team_id,
      opponent: form.opponent.trim(),
      match_date: form.match_date,
      start_time: form.start_time.length === 5 ? `${form.start_time}:00` : form.start_time,
      venue: form.venue.trim() || null,
      status: form.status,
      home_score: home,
      away_score: away,
      goals: form.goals.trim() || null,
      observations: form.observations.trim() || null,
      created_by: profile.id,
    }
    const { error: saveError } = editing
      ? await supabase.from('matches').update(payload).eq('id', editing.id)
      : await supabase.from('matches').insert(payload)
    setSaving(false)
    if (saveError) {
      setFormError(saveError.message)
      return
    }
    toast(editing ? 'Match updated.' : 'Fixture created.')
    setFormOpen(false)
    setEditing(null)
    void load()
  }

  async function handleDelete() {
    if (!supabase || !deleteTarget) return
    setDeleting(true)
    const { error: delError } = await supabase
      .from('matches')
      .delete()
      .eq('id', deleteTarget.id)
    setDeleting(false)
    if (delError) {
      toast(delError.message, 'error')
      return
    }
    toast('Match removed.')
    setDeleteTarget(null)
    void load()
  }

  if (loading) return <Spinner label="Loading matches…" />
  if (error) return <ErrorBanner message={error} />

  const filtered = matches.filter((m) => {
    if (teamFilter !== 'all' && m.team_id !== teamFilter) return false
    if (statusFilter !== 'all' && m.status !== statusFilter) return false
    if (
      search.trim() &&
      !`${m.opponent} ${m.team?.name ?? ''} ${m.venue ?? ''}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    ) {
      return false
    }
    return true
  })

  const upcoming = filtered.filter(
    (m) => m.status === 'scheduled' && m.match_date >= todayIso(),
  )
  const played = filtered.filter((m) => m.status !== 'scheduled')

  function renderMatch(m: Match) {
    const isResult = m.status === 'completed' && m.home_score !== null && m.away_score !== null
    return (
      <li
        key={m.id}
        className="card px-5 py-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
              <Trophy className="h-4 w-4 text-brand-400" />
              {m.team?.name} vs {m.opponent}
              {m.is_demo && <DemoBadge />}
            </p>
            <p className="mt-0.5 text-sm text-zinc-400">
              {formatDateTime(m.match_date, m.start_time)}
              {m.venue ? ` · ${m.venue}` : ''}
            </p>
            {m.goals && (
              <p className="mt-1 text-sm text-zinc-400">Goals: {m.goals}</p>
            )}
            {m.observations && (
              <p className="mt-1 text-sm text-zinc-500">{m.observations}</p>
            )}
          </div>
          <div className="text-right">
            {isResult ? (
              <p className="font-display text-2xl font-semibold text-white">
                {m.home_score} – {m.away_score}
              </p>
            ) : (
              <span className="rounded-full bg-charcoal-800 px-3 py-1 text-xs font-semibold text-zinc-300">
                {MATCH_STATUS_LABELS[m.status]}
              </span>
            )}
            {canManage && (
              <div className="mt-2 flex gap-2">
                {m.status === 'scheduled' && (
                  <button
                    type="button"
                    onClick={() => openResult(m)}
                    className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
                  >
                    Record result
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(m)}
                  aria-label={`Edit ${m.opponent}`}
                  className="rounded-lg border border-charcoal-600 bg-charcoal-800 p-1.5 text-zinc-300 hover:bg-charcoal-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(m)}
                    aria-label={`Remove match vs ${m.opponent}`}
                    className="rounded-lg border border-brand-800 bg-brand-900/30 p-1.5 text-brand-300 hover:bg-brand-900/60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </li>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
            Matches
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {isParent
              ? 'Fixtures and results for your children’s teams.'
              : 'Fixtures, results and match notes — chronological, per team.'}
          </p>
        </div>
        {canManage && (
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New fixture
          </PrimaryButton>
        )}
      </div>

      {formOpen && canManage && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 card p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
              {editing
                ? editing.status === 'scheduled' && form.status === 'completed'
                  ? 'Record result'
                  : 'Edit match'
                : 'New fixture'}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              aria-label="Close form"
              className="rounded-lg p-2 text-zinc-400 hover:bg-charcoal-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {formError && (
            <div className="mt-4">
              <ErrorBanner message={formError} />
            </div>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Team *
              </span>
              <select
                value={form.team_id}
                onChange={(e) => setForm({ ...form, team_id: e.target.value })}
                className="field"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.age_group})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Opponent *
              </span>
              <input
                type="text"
                value={form.opponent}
                onChange={(e) => setForm({ ...form, opponent: e.target.value })}
                placeholder="e.g. Reliance Young Champs"
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Date *
              </span>
              <input
                type="date"
                value={form.match_date}
                onChange={(e) => setForm({ ...form, match_date: e.target.value })}
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Start time *
              </span>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Venue
              </span>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="Urban Turf"
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Status
              </span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as MatchStatus })
                }
                className="field"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Our score
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={form.home_score}
                onChange={(e) => setForm({ ...form, home_score: e.target.value })}
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Opponent score
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={form.away_score}
                onChange={(e) => setForm({ ...form, away_score: e.target.value })}
                className="field"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Goals
              </span>
              <input
                type="text"
                value={form.goals}
                onChange={(e) => setForm({ ...form, goals: e.target.value })}
                placeholder="e.g. Aarav 2, Kabir 1"
                className="field"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Observations
              </span>
              <textarea
                rows={2}
                value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
                className="field"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create fixture'}
            </PrimaryButton>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          aria-label="Filter by team"
          className="field"
        >
          <option value="all">All teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="field"
        >
          <option value="all">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search opponent, team or venue…"
          className="min-w-48 flex-1 field"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No matches found"
            body={
              canManage
                ? 'No fixtures match these filters. Create one with the button above.'
                : 'No fixtures match these filters yet.'
            }
          />
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
                Upcoming fixtures
              </h2>
              <ul className="mt-4 space-y-3">{upcoming.map(renderMatch)}</ul>
            </section>
          )}
          {played.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
                Results &amp; history
              </h2>
              <ul className="mt-4 space-y-3">{played.map(renderMatch)}</ul>
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove this match?"
        body={`The fixture "${deleteTarget?.team?.name ?? ''} vs ${deleteTarget?.opponent ?? ''}" on ${deleteTarget ? formatDate(deleteTarget.match_date) : ''} ${deleteTarget ? formatTime(deleteTarget.start_time) : ''} will be removed permanently.`}
        confirmLabel="Remove match"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
