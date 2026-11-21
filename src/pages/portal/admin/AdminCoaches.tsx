import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Coach, Profile } from '../../../lib/types'
import { supabaseErrorMessage } from '../../../lib/data'
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

interface CoachForm {
  full_name: string
  email: string
  phone: string
  licence: string
  bio: string
  is_active: boolean
  user_id: string
}

const EMPTY_FORM: CoachForm = {
  full_name: '',
  email: '',
  phone: '',
  licence: '',
  bio: '',
  is_active: true,
  user_id: '',
}

export default function AdminCoaches() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Coach | null>(null)
  const [form, setForm] = useState<CoachForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Coach | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const [{ data: cData, error: cErr }, { data: pData }] = await Promise.all([
        supabase.from('coaches').select('*').order('full_name'),
        supabase.from('profiles').select('*').eq('role', 'coach').order('email'),
      ])
      if (cErr) throw new Error(cErr.message)
      setCoaches((cData ?? []) as Coach[])
      setProfiles((pData ?? []) as Profile[])
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
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(c: Coach) {
    setEditing(c)
    setForm({
      full_name: c.full_name,
      email: c.email ?? '',
      phone: c.phone ?? '',
      licence: c.licence ?? '',
      bio: c.bio ?? '',
      is_active: c.is_active,
      user_id: c.user_id ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setFormError(null)
    if (!form.full_name.trim()) return setFormError('Enter the coach’s name.')
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return setFormError('That email address does not look valid.')
    }
    setSaving(true)
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      licence: form.licence.trim() || null,
      bio: form.bio.trim() || null,
      is_active: form.is_active,
      user_id: form.user_id || null,
    }
    const { error: saveError } = editing
      ? await supabase.from('coaches').update(payload).eq('id', editing.id)
      : await supabase.from('coaches').insert(payload)
    setSaving(false)
    if (saveError) {
      setFormError(saveError.message)
      return
    }
    toast(editing ? 'Coach updated.' : 'Coach added.')
    setFormOpen(false)
    setEditing(null)
    void load()
  }

  async function handleDelete() {
    if (!supabase || !deleteTarget) return
    setDeleting(true)
    const { error: delError } = await supabase
      .from('coaches')
      .delete()
      .eq('id', deleteTarget.id)
    setDeleting(false)
    if (delError) {
      toast(
        delError.message.includes('violates foreign key')
          ? 'This coach is still assigned to a team or has session plans. Reassign those first.'
          : delError.message,
        'error',
      )
      return
    }
    toast('Coach removed.')
    setDeleteTarget(null)
    void load()
  }

  if (loading) return <Spinner label="Loading coaches…" />
  if (error) return <ErrorBanner message={error} />

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
            Manage Coaches
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Add coaches, and link each coach record to their login account so
            they can sign in and see only their own teams.
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add coach
        </PrimaryButton>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 card p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
              {editing ? 'Edit coach' : 'Add coach'}
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
                Full name *
              </span>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Phone
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Licence (e.g. AIFF D Licence)
              </span>
              <input
                type="text"
                value={form.licence}
                onChange={(e) => setForm({ ...form, licence: e.target.value })}
                className="field"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Link login account
              </span>
              <select
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="field"
              >
                <option value="">Not linked — no portal access yet</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.email}
                    {p.full_name ? ` (${p.full_name})` : ''}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-zinc-500">
                Create the login first in Supabase → Authentication → Add user,
                then pick it here. The coach signs in with that email and
                password.
              </span>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Bio
              </span>
              <textarea
                rows={2}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="field"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 accent-red-600"
              />
              Active coach
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add coach'}
            </PrimaryButton>
          </div>
        </form>
      )}

      {coaches.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No coaches yet"
            body="Add the academy's coaches here. Each coach needs a record before they can be assigned to a team."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {coaches.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-start justify-between gap-3 card px-5 py-4"
            >
              <div>
                <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                  {c.full_name}
                  {c.is_demo && <DemoBadge />}
                  {!c.is_active && (
                    <span className="rounded-full border border-zinc-500/40 bg-zinc-500/15 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
                      Inactive
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-zinc-400">
                  {[c.licence, c.email, c.phone].filter(Boolean).join(' · ') || 'No details yet'}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {c.user_id
                    ? `Login linked: ${profiles.find((p) => p.id === c.user_id)?.email ?? 'linked'}`
                    : 'No login linked — this coach cannot sign in yet'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <SecondaryButton
                  onClick={() => openEdit(c)}
                  className="!px-3 !py-1.5 !text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </SecondaryButton>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  aria-label={`Remove ${c.full_name}`}
                  className="rounded-xl border border-brand-800 bg-brand-900/30 p-2 text-brand-300 transition hover:bg-brand-900/60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove this coach?"
        body={`"${deleteTarget?.full_name ?? ''}" will be removed. If they are assigned to a team or have session plans, remove those links first.`}
        confirmLabel="Remove coach"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
