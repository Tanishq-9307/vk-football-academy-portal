import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Megaphone, Pencil, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Announcement, AnnouncementAudience } from '../../../lib/types'
import { AUDIENCE_LABELS, AUDIENCES } from '../../../lib/types'
import {
  fetchAnnouncementsForRole,
  supabaseErrorMessage,
} from '../../../lib/data'
import { formatDate } from '../../../lib/utils'
import {
  ConfirmDialog,
  DemoBadge,
  EmptyState,
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  useToast,
} from '../../../components/ui'

export default function AdminAnnouncements() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<AnnouncementAudience>('all')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setAnnouncements(await fetchAnnouncementsForRole('admin'))
    } catch (e) {
      setError(await supabaseErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setEditing(null)
    setTitle('')
    setBody('')
    setAudience('all')
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(a: Announcement) {
    setEditing(a)
    setTitle(a.title)
    setBody(a.body)
    setAudience(a.audience)
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setFormError(null)
    if (!title.trim()) return setFormError('Enter a title.')
    if (!body.trim()) return setFormError('Enter the announcement text.')
    setSaving(true)
    const payload = { title: title.trim(), body: body.trim(), audience }
    const { error: saveError } = editing
      ? await supabase.from('announcements').update(payload).eq('id', editing.id)
      : await supabase.from('announcements').insert(payload)
    setSaving(false)
    if (saveError) {
      setFormError(saveError.message)
      return
    }
    toast(editing ? 'Announcement updated.' : 'Announcement published.')
    setFormOpen(false)
    setEditing(null)
    void load()
  }

  async function handleDelete() {
    if (!supabase || !deleteTarget) return
    setDeleting(true)
    const { error: delError } = await supabase
      .from('announcements')
      .delete()
      .eq('id', deleteTarget.id)
    setDeleting(false)
    if (delError) {
      toast(delError.message, 'error')
      return
    }
    toast('Announcement removed.')
    setDeleteTarget(null)
    void load()
  }

  if (loading) return <Spinner label="Loading announcements…" />
  if (error) return <ErrorBanner message={error} />

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
            Manage Announcements
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Publish news for the academy. Choose who sees it — everyone,
            coaches only, or parents only.
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New announcement
        </PrimaryButton>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 card p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
              {editing ? 'Edit announcement' : 'New announcement'}
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
                Title *
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Trial dates for U12"
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Audience *
              </span>
              <select
                value={audience}
                onChange={(e) =>
                  setAudience(e.target.value as AnnouncementAudience)
                }
                className="field"
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {AUDIENCE_LABELS[a]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Message *
              </span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Write the announcement…"
                className="mt-2 w-full resize-y field"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish'}
            </PrimaryButton>
          </div>
        </form>
      )}

      {announcements.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No announcements yet"
            body="Publish the first one — it will appear in the coach and parent portals according to the audience you pick."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {announcements.map((a) => (
            <li
              key={a.id}
              className="card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                    <Megaphone className="h-4 w-4 text-brand-400" />
                    {a.title}
                    {a.is_demo && <DemoBadge />}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {AUDIENCE_LABELS[a.audience]} · {formatDate(a.created_at.slice(0, 10))}
                  </p>
                </div>
                <div className="flex gap-2">
                  <SecondaryButton
                    onClick={() => openEdit(a)}
                    className="!px-3 !py-1.5 !text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </SecondaryButton>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(a)}
                    aria-label={`Remove ${a.title}`}
                    className="rounded-xl border border-brand-800 bg-brand-900/30 p-2 text-brand-300 transition hover:bg-brand-900/60"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
                {a.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove this announcement?"
        body={`"${deleteTarget?.title ?? ''}" will be removed for everyone.`}
        confirmLabel="Remove announcement"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
