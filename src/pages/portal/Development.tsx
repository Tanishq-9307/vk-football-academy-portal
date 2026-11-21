import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchReportsForPlayer,
  fetchTeamPlayers,
  fetchVisibleSessions,
  fetchVisibleTeams,
  supabaseErrorMessage,
} from '../../lib/data'
import type {
  Player,
  PlayerReport,
  ReportRatings,
  Team,
  TrainingSession,
} from '../../lib/types'
import { REPORT_AREAS } from '../../lib/types'
import { formatDate, todayIso } from '../../lib/utils'
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

interface ReportForm {
  assessment_date: string
  training_session_id: string
  ratings: Record<string, string>
  strengths: string
  weaknesses: string
  objectives: string
  recommendations: string
  areas_of_improvement: string
  areas_requiring_attention: string
}

const EMPTY_FORM: ReportForm = {
  assessment_date: todayIso(),
  training_session_id: '',
  ratings: {},
  strengths: '',
  weaknesses: '',
  objectives: '',
  recommendations: '',
  areas_of_improvement: '',
  areas_requiring_attention: '',
}

export default function Development() {
  const toast = useToast()
  const { profile, coach } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [playerId, setPlayerId] = useState('')
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [reports, setReports] = useState<PlayerReport[]>([])
  const [selected, setSelected] = useState<PlayerReport | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PlayerReport | null>(null)
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PlayerReport | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = profile?.role === 'admin'

  // Load visible teams + their players once.
  useEffect(() => {
    let cancelled = false
    async function loadTeams() {
      if (!profile || !supabase) return
      setLoading(true)
      setError(null)
      try {
        const visibleTeams = await fetchVisibleTeams(profile, coach)
        if (cancelled) return
        setTeams(visibleTeams)
        const rosters = await Promise.all(
          visibleTeams.map((t) => fetchTeamPlayers(t.id)),
        )
        if (cancelled) return
        const seen = new Map<string, Player>()
        rosters.flat().forEach((p) => seen.set(p.id, p))
        const list = [...seen.values()].sort((a, b) =>
          a.full_name.localeCompare(b.full_name),
        )
        setPlayers(list)
        if (list.length > 0) setPlayerId(list[0].id)
      } catch (e) {
        if (!cancelled) setError(await supabaseErrorMessage(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadTeams()
    return () => {
      cancelled = true
    }
  }, [profile, coach])

  // Load reports + sessions for the selected player.
  useEffect(() => {
    let cancelled = false
    async function loadReports() {
      if (!playerId || !profile) return
      try {
        const [reps, allSessions] = await Promise.all([
          fetchReportsForPlayer(playerId),
          fetchVisibleSessions(profile, coach, teams.map((t) => t.id)),
        ])
        if (cancelled) return
        setReports(reps)
        setSelected(null)
        setSessions(
          allSessions
            .filter((s) => s.status !== 'cancelled')
            .sort((a, b) =>
              `${b.session_date}T${b.start_time}`.localeCompare(
                `${a.session_date}T${a.start_time}`,
              ),
            )
            .slice(0, 20),
        )
      } catch (e) {
        if (!cancelled) setError(await supabaseErrorMessage(e))
      }
    }
    void loadReports()
    return () => {
      cancelled = true
    }
  }, [playerId, profile, coach, teams])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(rep: PlayerReport) {
    setEditing(rep)
    const ratings: Record<string, string> = {}
    for (const area of REPORT_AREAS) {
      const v = rep.ratings[area.key]
      if (v !== undefined) ratings[area.key] = String(v)
    }
    setForm({
      assessment_date: rep.assessment_date,
      training_session_id: rep.training_session_id ?? '',
      ratings,
      strengths: rep.strengths ?? '',
      weaknesses: rep.weaknesses ?? '',
      objectives: rep.objectives ?? '',
      recommendations: rep.recommendations ?? '',
      areas_of_improvement: rep.areas_of_improvement ?? '',
      areas_requiring_attention: rep.areas_requiring_attention ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !profile || !playerId) return
    setFormError(null)
    if (!form.assessment_date) return setFormError('Pick an assessment date.')
    const ratings: ReportRatings = {}
    for (const area of REPORT_AREAS) {
      const raw = (form.ratings[area.key] ?? '').trim()
      if (raw === '') continue
      const n = Number(raw)
      if (!Number.isInteger(n) || n < 1 || n > 10) {
        return setFormError(`${area.label} must be a whole number from 1 to 10.`)
      }
      ratings[area.key] = n
    }
    if (Object.keys(ratings).length === 0) {
      return setFormError('Rate at least one development area (1–10).')
    }
    setSaving(true)
    const payload = {
      player_id: playerId,
      coach_id: coach?.id ?? null,
      assessment_date: form.assessment_date,
      training_session_id: form.training_session_id || null,
      ratings,
      strengths: form.strengths.trim() || null,
      weaknesses: form.weaknesses.trim() || null,
      objectives: form.objectives.trim() || null,
      recommendations: form.recommendations.trim() || null,
      areas_of_improvement: form.areas_of_improvement.trim() || null,
      areas_requiring_attention: form.areas_requiring_attention.trim() || null,
    }
    const { error: saveError } = editing
      ? await supabase.from('player_reports').update(payload).eq('id', editing.id)
      : await supabase.from('player_reports').insert(payload)
    setSaving(false)
    if (saveError) {
      setFormError(saveError.message)
      return
    }
    toast(editing ? 'Assessment updated.' : 'Assessment saved.')
    setFormOpen(false)
    setEditing(null)
    const reps = await fetchReportsForPlayer(playerId)
    setReports(reps)
  }

  async function handleDelete() {
    if (!supabase || !deleteTarget) return
    setDeleting(true)
    const { error: delError } = await supabase
      .from('player_reports')
      .delete()
      .eq('id', deleteTarget.id)
    setDeleting(false)
    if (delError) {
      toast(delError.message, 'error')
      return
    }
    toast('Assessment removed.')
    setDeleteTarget(null)
    setSelected(null)
    const reps = await fetchReportsForPlayer(playerId)
    setReports(reps)
  }

  if (loading) return <Spinner label="Loading player development…" />
  if (error) return <ErrorBanner message={error} />

  const selectedPlayer = players.find((p) => p.id === playerId) ?? null
  const previousOfSelected = selected
    ? (reports[reports.findIndex((r) => r.id === selected.id) + 1] ?? null)
    : null

  function ratingInput(areaKey: string, label: string) {
    return (
      <label key={areaKey} className="block">
        <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          {label} (1–10)
        </span>
        <input
          type="number"
          min={1}
          max={10}
          step={1}
          value={form.ratings[areaKey] ?? ''}
          onChange={(e) =>
            setForm({
              ...form,
              ratings: { ...form.ratings, [areaKey]: e.target.value },
            })
          }
          placeholder="—"
          className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-gold-500/60 focus:outline-none"
        />
      </label>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-normal text-white">
            Player Development
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Assess players on six areas, track ratings over time, and write
            reports parents can read. Ratings are 1–10.
          </p>
        </div>
        {selectedPlayer && (
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New assessment
          </PrimaryButton>
        )}
      </div>

      <div className="mt-6">
        <label className="block">
          <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Player
          </span>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="mt-2 w-full max-w-md rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-gold-500/60 focus:outline-none"
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
                {p.age_group ? ` (${p.age_group})` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium tracking-normal text-white">
              {editing ? 'Edit assessment' : 'New assessment'} —{' '}
              {selectedPlayer?.full_name}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              aria-label="Close form"
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
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
                Assessment date *
              </span>
              <input
                type="date"
                value={form.assessment_date}
                onChange={(e) => setForm({ ...form, assessment_date: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-gold-500/60 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Linked training session (optional)
              </span>
              <select
                value={form.training_session_id}
                onChange={(e) => setForm({ ...form, training_session_id: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-gold-500/60 focus:outline-none"
              >
                <option value="">No session linked</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatDate(s.session_date)} — {s.title ?? `${s.category} session`} (
                    {s.team?.name})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <h3 className="mt-6 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Ratings (1–10, fill in the areas you assessed)
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {REPORT_AREAS.map((a) => ratingInput(a.key, a.label))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(
              [
                ['strengths', 'Strengths'],
                ['weaknesses', 'Weaknesses'],
                ['objectives', 'Development objectives'],
                ['recommendations', 'Coach recommendations'],
                ['areas_of_improvement', 'Areas of improvement'],
                ['areas_requiring_attention', 'Areas requiring attention'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  {label}
                </span>
                <textarea
                  rows={2}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-gold-500/60 focus:outline-none"
                />
              </label>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Save assessment'}
            </PrimaryButton>
          </div>
        </form>
      )}

      {players.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No players yet"
            body="Add players to your teams first — then you can assess them here."
          />
        </div>
      ) : reports.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No assessments yet"
            body={`No development assessments for ${selectedPlayer?.full_name ?? 'this player'} yet. Create the first one with the button above.`}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <ul className="space-y-3 lg:col-span-2">
            {reports.map((rep) => (
              <li key={rep.id}>
                <button
                  type="button"
                  onClick={() => setSelected(rep)}
                  className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                    selected?.id === rep.id
                      ? 'border-brand-500/70 bg-white/[0.04]'
                      : 'border-white/10 bg-white/[0.045] backdrop-blur-xl hover:border-gold-500/40'
                  }`}
                >
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                    {formatDate(rep.assessment_date)}
                    {rep.is_demo && <DemoBadge />}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    by {rep.coach?.full_name ?? 'Coach'}
                    {rep.session ? ` · after ${rep.session.title ?? 'a session'}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    Overall:{' '}
                    <span className="font-semibold text-white">
                      {rep.ratings.overall ?? '—'} / 10
                    </span>
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <div className="lg:col-span-3">
            {selected ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-medium tracking-normal text-white">
                      Assessment — {formatDate(selected.assessment_date)}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      {selectedPlayer?.full_name} · by{' '}
                      {selected.coach?.full_name ?? 'Coach'}
                      {selected.session
                        ? ` · after ${selected.session.title ?? 'a session'} (${formatDate(selected.session.session_date)})`
                        : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(isAdmin || selected.coach_id === coach?.id) && (
                      <SecondaryButton
                        onClick={() => openEdit(selected)}
                        className="!px-3 !py-1.5 !text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </SecondaryButton>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(selected)}
                        aria-label="Remove assessment"
                        className="rounded-xl border border-brand-800 bg-brand-900/30 p-2 text-brand-300 transition hover:bg-brand-900/60"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {REPORT_AREAS.map((area) => {
                    const value = selected.ratings[area.key]
                    const prev = previousOfSelected?.ratings[area.key]
                    return (
                      <div
                        key={area.key}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
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
                              {value > prev
                                ? `▲ +${value - prev}`
                                : value < prev
                                  ? `▼ ${value - prev}`
                                  : '— same'}
                            </span>
                          )}
                        </p>
                        {prev !== undefined && value === undefined && (
                          <p className="text-xs text-zinc-500">was {prev} last time</p>
                        )}
                      </div>
                    )
                  })}
                </div>

                <dl className="mt-5 space-y-2 text-sm">
                  {(
                    [
                      ['Strengths', selected.strengths],
                      ['Areas to improve', selected.areas_of_improvement],
                      ['Areas needing attention', selected.areas_requiring_attention],
                      ['Weaknesses', selected.weaknesses],
                      ['Development objectives', selected.objectives],
                      ['Coach recommendations', selected.recommendations],
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
                {previousOfSelected && (
                  <p className="mt-4 text-xs text-zinc-500">
                    Compared with the previous assessment on{' '}
                    {formatDate(previousOfSelected.assessment_date)}.
                  </p>
                )}
              </div>
            ) : (
              <EmptyState
                title="Pick an assessment"
                body="Select one of the assessments on the left to see the full report, including the change since the previous one."
              />
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove this assessment?"
        body={`The assessment from ${deleteTarget ? formatDate(deleteTarget.assessment_date) : ''} will be removed permanently.`}
        confirmLabel="Remove assessment"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
