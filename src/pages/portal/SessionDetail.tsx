import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClipboardList, Download, MapPin, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchAttendanceForSession,
  fetchTeamPlayers,
  getPlanFileUrl,
  supabaseErrorMessage,
} from '../../lib/data'
import type {
  AttendanceRecord,
  Player,
  SessionObservation,
  SessionPlan,
  TrainingSession,
} from '../../lib/types'
import { attendancePct, formatDateTime } from '../../lib/utils'
import {
  DemoBadge,
  EmptyState,
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  StatusPill,
  useToast,
} from '../../components/ui'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const { profile, coach } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<TrainingSession | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [plan, setPlan] = useState<SessionPlan | null>(null)
  const [observations, setObservations] = useState<SessionObservation[]>([])
  const [obsText, setObsText] = useState('')
  const [obsError, setObsError] = useState<string | null>(null)
  const [obsSaving, setObsSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const load = async () => {
    if (!id || !supabase) return
    setLoading(true)
    setError(null)
    try {
      const { data: s, error: sErr } = await supabase
        .from('training_sessions')
        .select('*, team:teams(*)')
        .eq('id', id)
        .single()
      if (sErr || !s) throw new Error(sErr?.message ?? 'Session not found.')
      const sess = s as TrainingSession
      setSession(sess)
      const [teamPlayers, att, plans, obs] = await Promise.all([
        fetchTeamPlayers(sess.team_id),
        fetchAttendanceForSession(sess.id),
        supabase
          .from('session_plans')
          .select('*, team:teams(*), coach:coaches(*)')
          .eq('training_session_id', sess.id)
          .order('updated_at', { ascending: false })
          .limit(1),
        supabase
          .from('session_observations')
          .select('*, coach:coaches(*)')
          .eq('training_session_id', sess.id)
          .order('created_at', { ascending: false }),
      ])
      setPlayers(teamPlayers)
      setRecords(att)
      setPlan((plans.data?.[0] as SessionPlan | undefined) ?? null)
      setObservations((obs.data ?? []) as SessionObservation[])
    } catch (e) {
      setError(await supabaseErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleAddObservation(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !session || !profile) return
    setObsError(null)
    if (!obsText.trim()) {
      setObsError('Write the observation first.')
      return
    }
    setObsSaving(true)
    const { error: insError } = await supabase
      .from('session_observations')
      .insert({
        training_session_id: session.id,
        coach_id: coach?.id ?? null,
        observation: obsText.trim(),
      })
    setObsSaving(false)
    if (insError) {
      setObsError(insError.message)
      return
    }
    toast('Observation saved.')
    setObsText('')
    void load()
  }

  async function handleDownload() {
    if (!plan?.file_path) return
    setDownloading(true)
    const url = await getPlanFileUrl(plan.file_path)
    setDownloading(false)
    if (!url) {
      toast('Could not open the file. Try again.', 'error')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) return <Spinner label="Loading session…" />
  if (error) return <ErrorBanner message={error} />
  if (!session) return <EmptyState title="Session not found" />

  const stats = attendancePct(records)
  const canEdit =
    profile?.role === 'admin' ||
    (coach && session.team?.coach_id === coach.id)

  return (
    <div>
      <Link
        to="/portal/sessions"
        className="text-sm font-semibold text-brand-400 hover:text-brand-300"
      >
        ← All sessions
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display flex flex-wrap items-center gap-2 text-3xl font-medium tracking-normal text-white">
            {session.title ?? `${session.category} session`}
            {session.is_demo && <DemoBadge />}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {session.team?.name} · {formatDateTime(session.session_date, session.start_time)} ·{' '}
            {session.duration_minutes} min · {session.category}
          </p>
          {session.pitch && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
              <MapPin className="h-4 w-4 text-brand-400" />
              {session.pitch}
            </p>
          )}
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
            session.status === 'scheduled'
              ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
              : session.status === 'completed'
                ? 'border-green-500/40 bg-green-500/15 text-green-300'
                : 'border-zinc-500/40 bg-zinc-500/15 text-zinc-300'
          }`}
        >
          {session.status}
        </span>
      </div>

      {session.objectives && (
        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl p-5">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Objectives
          </h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-zinc-200">
            {session.objectives}
          </p>
        </div>
      )}
      {session.description && (
        <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-zinc-400">
          {session.description}
        </p>
      )}

      {/* Session plan */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display flex items-center gap-2 text-xl font-medium tracking-normal text-white">
            <ClipboardList className="h-5 w-5 text-brand-500" />
            Session plan
          </h2>
          {canEdit && (
            <Link
              to={plan ? `/portal/plans/${plan.id}/edit` : `/portal/plans/new?session=${session.id}`}
              className="text-sm font-semibold text-brand-400 hover:text-brand-300"
            >
              {plan ? 'Edit plan →' : 'Create plan →'}
            </Link>
          )}
        </div>
        {!plan ? (
          <div className="mt-4">
            <EmptyState
              title="No session plan yet"
              body="Create a plan for this session — structured sections or an uploaded document, or both."
              action={
                canEdit ? (
                  <Link to={`/portal/plans/new?session=${session.id}`}>
                    <PrimaryButton>Create session plan</PrimaryButton>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl p-5">
            <p className="font-semibold text-white">{plan.title}</p>
            {plan.description && (
              <p className="mt-1 text-sm text-zinc-400">{plan.description}</p>
            )}
            <p className="mt-2 text-xs text-zinc-500">
              Last updated{' '}
              {new Date(plan.updated_at).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
              {plan.coach ? ` · by ${plan.coach.full_name}` : ''}
            </p>
            {plan.file_name && (
              <div className="mt-3">
                <SecondaryButton onClick={handleDownload} disabled={downloading}>
                  <Download className="h-4 w-4" />
                  {downloading ? 'Opening…' : `Download ${plan.file_name}`}
                </SecondaryButton>
              </div>
            )}
            <Link
              to={`/portal/plans/${plan.id}`}
              className="mt-3 inline-block text-sm font-semibold text-brand-400 hover:text-brand-300"
            >
              View full plan →
            </Link>
          </div>
        )}
      </section>

      {/* Attendance */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display flex items-center gap-2 text-xl font-medium tracking-normal text-white">
            <ShieldCheck className="h-5 w-5 text-brand-500" />
            Attendance
          </h2>
          {canEdit && session.status !== 'cancelled' && (
            <Link
              to={`/portal/attendance?session=${session.id}`}
              className="text-sm font-semibold text-brand-400 hover:text-brand-300"
            >
              Mark attendance →
            </Link>
          )}
        </div>
        {records.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Attendance not marked yet"
              body="Mark who turned up for this session — the list is pulled automatically from the team's registered players."
            />
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl p-5">
            <div className="flex flex-wrap gap-6 text-sm">
              <span>
                <strong className="font-display text-2xl text-white">{stats.pct}%</strong>
                <span className="ml-1 text-zinc-400">attendance</span>
              </span>
              <span className="text-zinc-300">
                <strong className="text-white">{stats.present}</strong> present
              </span>
              <span className="text-zinc-300">
                <strong className="text-white">{stats.absent}</strong> absent
              </span>
              <span className="text-zinc-300">
                <strong className="text-white">{stats.late}</strong> late
              </span>
              <span className="text-zinc-300">
                <strong className="text-white">{stats.excused}</strong> excused
              </span>
            </div>
            <ul className="mt-4 divide-y divide-white/10">
              {players.map((p) => {
                const rec = records.find((r) => r.player_id === p.id)
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="text-sm text-zinc-200">{p.full_name}</span>
                    {rec ? (
                      <StatusPill status={rec.status} />
                    ) : (
                      <span className="text-xs text-zinc-500">Not marked</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Observations */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-medium tracking-normal text-white">
          Post-session observations
        </h2>
        {observations.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No observations recorded for this session yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {observations.map((o) => (
              <li
                key={o.id}
                className="rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl p-4"
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-200">
                  {o.observation}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {o.coach?.full_name ?? 'Coach'} ·{' '}
                  {new Date(o.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
        {canEdit && (
          <form onSubmit={handleAddObservation} className="mt-4">
            {obsError && (
              <div className="mb-3">
                <ErrorBanner message={obsError} />
              </div>
            )}
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Add an observation
              </span>
              <textarea
                rows={3}
                value={obsText}
                onChange={(e) => setObsText(e.target.value)}
                placeholder="What happened in the session? What did players do well, and what needs work next time?"
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-gold-500/60 focus:outline-none"
              />
            </label>
            <div className="mt-3 flex justify-end">
              <PrimaryButton type="submit" disabled={obsSaving}>
                {obsSaving ? 'Saving…' : 'Save observation'}
              </PrimaryButton>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
