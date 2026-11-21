import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { STORAGE_BUCKET, supabase } from '../../lib/supabase'
import { fetchVisibleSessions, fetchVisibleTeams } from '../../lib/data'
import type { PlanContent, SessionPlan, TrainingSession } from '../../lib/types'
import { PLAN_FIELDS } from '../../lib/types'
import { formatDateTime } from '../../lib/utils'
import {
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  useToast,
} from '../../components/ui'

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'image/webp',
]
const MAX_FILE_BYTES = 10 * 1024 * 1024

export default function PlanForm({ existing }: { existing?: SessionPlan | null }) {
  const { profile, coach } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedSession = searchParams.get('session') ?? undefined

  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [sessionId, setSessionId] = useState(existing?.training_session_id ?? preselectedSession ?? '')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [content, setContent] = useState<PlanContent>(existing?.content ?? {})
  const [file, setFile] = useState<File | null>(null)
  const [removeFile, setRemoveFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!profile) return
      try {
        const teams = await fetchVisibleTeams(profile, coach)
        const list = await fetchVisibleSessions(
          profile,
          coach,
          teams.map((t) => t.id),
        )
        if (cancelled) return
        // Sessions that don't already have a plan (unless editing this plan's session).
        const withPlans = new Set<string>()
        if (supabase) {
          const { data } = await supabase
            .from('session_plans')
            .select('training_session_id')
          ;(data ?? []).forEach((row) => {
            if (row.training_session_id !== existing?.training_session_id) {
              withPlans.add(row.training_session_id as string)
            }
          })
        }
        setSessions(
          list.filter(
            (s) =>
              s.status !== 'cancelled' &&
              (!withPlans.has(s.id) || s.id === existing?.training_session_id),
          ),
        )
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load sessions.')
        }
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

  function setField(key: keyof PlanContent, value: string) {
    setContent((c) => ({ ...c, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !profile) return
    setError(null)
    if (!sessionId) return setError('Choose the training session this plan is for.')
    if (!title.trim()) return setError('Give the plan a title.')
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) return setError('The selected session could not be found.')

    setSaving(true)
    try {
      let filePath: string | null = existing?.file_path ?? null
      let fileName: string | null = existing?.file_name ?? null
      let fileType: string | null = existing?.file_type ?? null

      if (file) {
        const path = `${session.team_id}/${session.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { upsert: false })
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`)
        // Remove the old file only after the new one is safely stored.
        if (existing?.file_path) {
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([existing.file_path])
        }
        filePath = path
        fileName = file.name
        fileType = file.type
      } else if (removeFile && existing?.file_path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([existing.file_path])
        filePath = null
        fileName = null
        fileType = null
      }

      // Store only the sections the coach actually filled in.
      const filledContent: PlanContent = {}
      for (const f of PLAN_FIELDS) {
        const v = (content[f.key] ?? '').trim()
        if (v) filledContent[f.key] = v
      }

      const payload = {
        training_session_id: session.id,
        coach_id: coach?.id ?? null,
        team_id: session.team_id,
        title: title.trim(),
        description: description.trim() || null,
        content: filledContent,
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
      }
      const { error: saveError } = existing
        ? await supabase.from('session_plans').update(payload).eq('id', existing.id)
        : await supabase.from('session_plans').insert(payload)
      if (saveError) throw new Error(saveError.message)
      toast(existing ? 'Session plan updated.' : 'Session plan saved.')
      navigate(`/portal/sessions/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the plan.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading…" />

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
        {existing ? 'Edit session plan' : 'New session plan'}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Fill in only the sections that apply to this session. The plan is
        linked to one training session, and its history is kept.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 stadium-card p-6"
      >
        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
              Training session *
            </span>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              disabled={!!existing}
              className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none disabled:opacity-60"
            >
              <option value="">Select a session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.team?.name} · {s.title ?? `${s.category} session`} ·{' '}
                  {formatDateTime(s.session_date, s.start_time)}
                </option>
              ))}
            </select>
            {existing && (
              <span className="mt-1 block text-xs text-zinc-500">
                A plan stays linked to its original session.
              </span>
            )}
          </label>
          <label className="block">
            <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
              Plan title *
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. U14 — Passing under pressure"
              className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Description
          </span>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One-line summary of what this session is about."
            className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none"
          />
        </label>

        <h2 className="font-display mt-8 text-lg font-semibold tracking-wide text-white uppercase">
          Structured plan
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PLAN_FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                {f.label}
              </span>
              <textarea
                rows={3}
                value={content[f.key] ?? ''}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.hint}
                className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none"
              />
            </label>
          ))}
        </div>

        <h2 className="font-display mt-8 text-lg font-semibold tracking-wide text-white uppercase">
          Attached document
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Optional — upload a PDF, Word document or image of the plan. Files
          are stored privately and only coaches and admins can open them.
        </p>
        {existing?.file_name && !removeFile && !file && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-charcoal-600 bg-charcoal-900 px-4 py-3 text-sm">
            <span className="text-zinc-200">{existing.file_name}</span>
            <button
              type="button"
              onClick={() => setRemoveFile(true)}
              className="font-semibold text-brand-400 hover:text-brand-300"
            >
              Remove file
            </button>
          </div>
        )}
        {removeFile && !file && (
          <p className="mt-3 text-sm text-amber-300">
            The current file will be removed when you save. Choose a new file
            below to replace it instead.
          </p>
        )}
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-charcoal-600 bg-charcoal-900 px-4 py-6 text-sm text-zinc-300 transition hover:border-brand-500 hover:text-white">
          <Upload className="h-5 w-5 text-brand-400" />
          {file ? file.name : 'Choose a file — PDF, DOCX or image (max 10 MB)'}
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              if (!ACCEPTED_TYPES.includes(f.type)) {
                setError('Only PDF, Word documents and images can be uploaded.')
                return
              }
              if (f.size > MAX_FILE_BYTES) {
                setError('That file is over the 10 MB limit.')
                return
              }
              setError(null)
              setFile(f)
              setRemoveFile(false)
            }}
          />
        </label>

        <div className="mt-8 flex justify-end gap-3">
          <SecondaryButton type="button" onClick={() => navigate(-1)}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Save session plan'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}
