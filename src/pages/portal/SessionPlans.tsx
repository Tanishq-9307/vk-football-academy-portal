import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClipboardList, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchVisibleTeams,
  getPlanFileUrl,
  supabaseErrorMessage,
} from '../../lib/data'
import type { SessionPlan, Team } from '../../lib/types'
import { PLAN_FIELDS } from '../../lib/types'
import { formatDate } from '../../lib/utils'
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
import PlanForm from './PlanForm'

/* ------------------------------- Plan list ------------------------------- */

export function SessionPlansList() {
  const { profile, coach } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [plans, setPlans] = useState<SessionPlan[]>([])
  const [teamFilter, setTeamFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<SessionPlan | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    if (!profile || !supabase) return
    setLoading(true)
    setError(null)
    try {
      const visibleTeams = await fetchVisibleTeams(profile, coach)
      setTeams(visibleTeams)
      let query = supabase
        .from('session_plans')
        .select('*, session:training_sessions(*), team:teams(*), coach:coaches(*)')
        .order('updated_at', { ascending: false })
      if (profile.role === 'coach') {
        const ids = visibleTeams.map((t) => t.id)
        if (ids.length === 0) {
          setPlans([])
          setLoading(false)
          return
        }
        query = query.in('team_id', ids)
      }
      const { data, error: qErr } = await query
      if (qErr) throw new Error(qErr.message)
      setPlans((data ?? []) as SessionPlan[])
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

  const filtered = useMemo(
    () =>
      plans.filter((p) => {
        if (teamFilter !== 'all' && p.team_id !== teamFilter) return false
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const hay = `${p.title} ${p.description ?? ''} ${p.team?.name ?? ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      }),
    [plans, teamFilter, search],
  )

  async function handleDelete() {
    if (!supabase || !deleteTarget) return
    setDeleting(true)
    if (deleteTarget.file_path) {
      await supabase.storage
        .from('session-plans')
        .remove([deleteTarget.file_path])
    }
    const { error: delError } = await supabase
      .from('session_plans')
      .delete()
      .eq('id', deleteTarget.id)
    setDeleting(false)
    if (delError) {
      toast(delError.message, 'error')
      return
    }
    toast('Session plan deleted.')
    setDeleteTarget(null)
    void load()
  }

  if (loading) return <Spinner label="Loading session plans…" />
  if (error) return <ErrorBanner message={error} />

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
            Session Plans
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Every plan is linked to a training session. Newest first.
          </p>
        </div>
        <Link to="/portal/plans/new">
          <PrimaryButton>
            <Plus className="h-4 w-4" />
            New plan
          </PrimaryButton>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plans…"
          className="min-w-56 flex-1 field"
        />
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
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No session plans yet"
            body="Create a plan for a training session — structured sections, an uploaded document, or both."
            action={
              <Link to="/portal/plans/new">
                <PrimaryButton>
                  <ClipboardList className="h-4 w-4" />
                  New plan
                </PrimaryButton>
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="card px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link to={`/portal/plans/${p.id}`} className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white hover:text-brand-300">
                    {p.title}
                    {p.is_demo && <DemoBadge />}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {p.team?.name}
                    {p.session
                      ? ` · ${p.session.title ?? `${p.session.category} session`} · ${formatDate(p.session.session_date)}`
                      : ''}
                    {p.coach ? ` · ${p.coach.full_name}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Last updated{' '}
                    {new Date(p.updated_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {p.file_name ? ` · 📎 ${p.file_name}` : ''}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <Link to={`/portal/plans/${p.id}/edit`}>
                    <SecondaryButton className="!px-3 !py-1.5 !text-xs">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </SecondaryButton>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(p)}
                    aria-label={`Delete ${p.title}`}
                    className="rounded-xl border border-brand-800 bg-brand-900/30 p-2 text-brand-300 transition hover:bg-brand-900/60"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this session plan?"
        body={`"${deleteTarget?.title ?? ''}" and its attached file will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete plan"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

/* ------------------------------- Plan view ------------------------------- */

export function PlanView() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<SessionPlan | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!id || !supabase) return
      setLoading(true)
      const { data, error: qErr } = await supabase
        .from('session_plans')
        .select('*, session:training_sessions(*), team:teams(*), coach:coaches(*)')
        .eq('id', id)
        .single()
      if (!cancelled) {
        if (qErr || !data) {
          setError(qErr?.message ?? 'Session plan not found.')
        } else {
          setPlan(data as SessionPlan)
        }
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

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

  if (loading) return <Spinner label="Loading session plan…" />
  if (error) return <ErrorBanner message={error} />
  if (!plan) return <EmptyState title="Session plan not found" />

  const filledSections = PLAN_FIELDS.filter((f) => (plan.content[f.key] ?? '').trim())

  return (
    <div>
      <Link
        to="/portal/plans"
        className="text-sm font-semibold text-brand-400 hover:text-brand-300"
      >
        ← All session plans
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display flex flex-wrap items-center gap-2 text-3xl font-semibold tracking-wide text-white uppercase">
            {plan.title}
            {plan.is_demo && <DemoBadge />}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {plan.team?.name}
            {plan.session
              ? ` · ${plan.session.title ?? `${plan.session.category} session`} · ${formatDate(plan.session.session_date)}`
              : ''}
            {plan.coach ? ` · Coach: ${plan.coach.full_name}` : ''}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Created{' '}
            {new Date(plan.created_at).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            {' · '}Last updated{' '}
            {new Date(plan.updated_at).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
        <Link to={`/portal/plans/${plan.id}/edit`}>
          <SecondaryButton>
            <Pencil className="h-4 w-4" />
            Edit plan
          </SecondaryButton>
        </Link>
      </div>

      {plan.description && (
        <p className="mt-5 leading-relaxed text-zinc-300">{plan.description}</p>
      )}

      {plan.file_name && (
        <div className="mt-5">
          <SecondaryButton onClick={handleDownload} disabled={downloading}>
            <Download className="h-4 w-4" />
            {downloading ? 'Opening…' : `Download ${plan.file_name}`}
          </SecondaryButton>
        </div>
      )}

      {filledSections.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No structured sections filled in"
            body="This plan has no written sections — it may only have an attached document. Edit the plan to add the session structure."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filledSections.map((f) => (
            <section
              key={f.key}
              className="card p-5"
            >
              <h2 className="text-xs font-semibold tracking-widest text-brand-400 uppercase">
                {f.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-zinc-200">
                {plan.content[f.key]}
              </p>
            </section>
          ))}
        </div>
      )}

      {plan.session && (
        <p className="mt-8 text-sm">
          <Link
            to={`/portal/sessions/${plan.session.id}`}
            className="font-semibold text-brand-400 hover:text-brand-300"
          >
            View the training session →
          </Link>
        </p>
      )}
    </div>
  )
}

/* ------------------------------- Plan edit ------------------------------- */

export function PlanEdit() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<SessionPlan | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!id || !supabase) return
      const { data, error: qErr } = await supabase
        .from('session_plans')
        .select('*')
        .eq('id', id)
        .single()
      if (!cancelled) {
        if (qErr || !data) {
          setError(qErr?.message ?? 'Session plan not found.')
        } else {
          setPlan(data as SessionPlan)
        }
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <Spinner label="Loading session plan…" />
  if (error) return <ErrorBanner message={error} />
  if (!plan) return <EmptyState title="Session plan not found" />
  return <PlanForm existing={plan} />
}
