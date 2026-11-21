import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Pencil, Plus, Search, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchVisibleSessions,
  fetchVisibleTeams,
  supabaseErrorMessage,
} from '../../lib/data'
import type {
  SessionCategory,
  SessionStatus,
  Team,
  TrainingSession,
} from '../../lib/types'
import { SESSION_CATEGORIES } from '../../lib/types'
import { formatDateTime, todayIso } from '../../lib/utils'
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

interface FormState {
  team_id: string
  title: string
  session_date: string
  start_time: string
  duration_minutes: string
  pitch: string
  category: SessionCategory
  objectives: string
  description: string
}

const EMPTY_FORM: FormState = {
  team_id: '',
  title: '',
  session_date: todayIso(),
  start_time: '18:00',
  duration_minutes: '90',
  pitch: 'Urban Turf',
  category: 'Technical',
  objectives: '',
  description: '',
}

export default function Sessions() {
  const { profile, coach } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [teamFilter, setTeamFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | SessionStatus>('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TrainingSession | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<TrainingSession | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const load = async () => {
    if (!profile || !supabase) return
    setLoading(true)
    setError(null)
    try {
      const visibleTeams = await fetchVisibleTeams(profile, coach)
      setTeams(visibleTeams)
      const list = await fetchVisibleSessions(
        profile,
        coach,
        visibleTeams.map((t) => t.id),
      )
      setSessions(list)
    } catch (e) {
      setError(await supabaseErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, coach])

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (teamFilter !== 'all' && s.team_id !== teamFilter) return false
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = `${s.title ?? ''} ${s.team?.name ?? ''} ${s.category} ${s.pitch ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [sessions, teamFilter, statusFilter, search])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, team_id: teams[0]?.id ?? '' })
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(s: TrainingSession) {
    setEditing(s)
    setForm({
      team_id: s.team_id,
      title: s.title ?? '',
      session_date: s.session_date,
      start_time: s.start_time.slice(0, 5),
      duration_minutes: String(s.duration_minutes),
      pitch: s.pitch ?? '',
      category: s.category,
      objectives: s.objectives ?? '',
      description: s.description ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !profile) return
    setFormError(null)
    const duration = Number(form.duration_minutes)
    if (!form.team_id) return setFormError('Choose a team.')
    if (!form.session_date) return setFormError('Choose a date.')
    if (!form.start_time) return setFormError('Choose a start time.')
    if (!Number.isFinite(duration) || duration < 15 || duration > 300) {
      return setFormError('Duration must be between 15 and 300 minutes.')
    }
    setSaving(true)
    const payload = {
      team_id: form.team_id,
      title: form.title.trim() || null,
      session_date: form.session_date,
      start_time: form.start_time,
      duration_minutes: duration,
      pitch: form.pitch.trim() || null,
      category: form.category,
      objectives: form.objectives.trim() || null,
      description: form.description.trim() || null,
      created_by: profile.id,
    }
    const { error: saveError } = editing
      ? await supabase.from('training_sessions').update(payload).eq('id', editing.id)
      : await supabase.from('training_sessions').insert(payload)
    setSaving(false)
    if (saveError) {
      setFormError(saveError.message)
      return
    }
    toast(editing ? 'Session updated.' : 'Session created.')
    setFormOpen(false)
    setEditing(null)
    void load()
  }

  async function handleCancel() {
    if (!supabase || !cancelTarget) return
    setCancelling(true)
    const { error: cancelError } = await supabase
      .from('training_sessions')
      .update({ status: 'cancelled' })
      .eq('id', cancelTarget.id)
    setCancelling(false)
    if (cancelError) {
      toast(cancelError.message, 'error')
      return
    }
    toast('Session cancelled.')
    setCancelTarget(null)
    void load()
  }

  if (loading) return <Spinner label="Loading sessions…" />
  if (error) return <ErrorBanner message={error} />

  const statusBadge = (status: SessionStatus) => {
    const styles: Record<SessionStatus, string> = {
      scheduled: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
      completed: 'bg-green-500/15 text-green-300 border-green-500/40',
      cancelled: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/40',
    }
    return (
      <span
        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
      >
        {status}
      </span>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
            Training Sessions
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Schedule, edit and cancel sessions. Every session is a unique record
            — plans and attendance attach to it.
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New session
        </PrimaryButton>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions, teams, pitches…"
            className="field pl-9"
          />
        </div>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
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
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'all' | SessionStatus)
          }
          aria-label="Filter by status"
          className="rounded-xl border border-charcoal-600 bg-charcoal-900 px-3 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Create / edit form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 card p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
              {editing ? 'Edit session' : 'New training session'}
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
                <option value="">Select a team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.age_group}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Title
              </span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Passing under pressure"
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Date *
              </span>
              <input
                type="date"
                value={form.session_date}
                onChange={(e) => setForm({ ...form, session_date: e.target.value })}
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
                Duration (minutes) *
              </span>
              <input
                type="number"
                min={15}
                max={300}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Pitch
              </span>
              <input
                type="text"
                value={form.pitch}
                onChange={(e) => setForm({ ...form, pitch: e.target.value })}
                placeholder="Urban Turf"
                className="field"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Category
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {SESSION_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, category: c })}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      form.category === c
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-charcoal-600 bg-charcoal-900 text-zinc-300 hover:border-charcoal-500'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Objectives
              </span>
              <textarea
                rows={2}
                value={form.objectives}
                onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                placeholder="What should players be able to do by the end of this session?"
                className="field"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Description
              </span>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Anything else coaches should know about this session."
                className="field"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create session'}
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No sessions found"
            body="Try a different filter, or create a new training session."
            action={
              <PrimaryButton onClick={openCreate}>
                <CalendarDays className="h-4 w-4" />
                New session
              </PrimaryButton>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((s) => (
            <li
              key={s.id}
              className="card px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link to={`/portal/sessions/${s.id}`} className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white hover:text-brand-300">
                    {s.title ?? `${s.category} session`}
                    {s.is_demo && <DemoBadge />}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {s.team?.name} · {formatDateTime(s.session_date, s.start_time)} ·{' '}
                    {s.duration_minutes} min
                    {s.pitch ? ` · ${s.pitch}` : ''} · {s.category}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {statusBadge(s.status)}
                  {s.status === 'scheduled' && (
                    <>
                      <SecondaryButton
                        onClick={() => openEdit(s)}
                        className="!px-3 !py-1.5 !text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </SecondaryButton>
                      <button
                        type="button"
                        onClick={() => setCancelTarget(s)}
                        className="rounded-xl border border-brand-800 bg-brand-900/30 px-3 py-1.5 text-xs font-semibold text-brand-300 transition hover:bg-brand-900/60"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel this session?"
        body="The session will be marked as cancelled. Its session plan and any attendance already marked will be kept for the record."
        confirmLabel="Cancel session"
        busy={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
