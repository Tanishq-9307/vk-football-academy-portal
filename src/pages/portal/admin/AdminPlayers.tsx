import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { AgeGroup, Player } from '../../../lib/types'
import { AGE_GROUPS } from '../../../lib/types'
import { supabaseErrorMessage } from '../../../lib/data'
import { ageFromDob } from '../../../lib/utils'
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

interface PlayerForm {
  full_name: string
  date_of_birth: string
  age_group: string
  position: string
  parent_name: string
  parent_phone: string
}

const EMPTY_FORM: PlayerForm = {
  full_name: '',
  date_of_birth: '',
  age_group: '',
  position: '',
  parent_name: '',
  parent_phone: '',
}

export default function AdminPlayers() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Player | null>(null)
  const [form, setForm] = useState<PlayerForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: qErr } = await supabase
        .from('players')
        .select('*')
        .order('full_name')
      if (qErr) throw new Error(qErr.message)
      setPlayers((data ?? []) as Player[])
    } catch (e) {
      setError(await supabaseErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return players
    return players.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.parent_name ?? '').toLowerCase().includes(q),
    )
  }, [players, search])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(p: Player) {
    setEditing(p)
    setForm({
      full_name: p.full_name,
      date_of_birth: p.date_of_birth ?? '',
      age_group: p.age_group ?? '',
      position: p.position ?? '',
      parent_name: p.parent_name ?? '',
      parent_phone: p.parent_phone ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setFormError(null)
    if (!form.full_name.trim()) return setFormError('Enter the player’s name.')
    if (form.date_of_birth && Number.isNaN(Date.parse(form.date_of_birth))) {
      return setFormError('That date of birth is not valid.')
    }
    setSaving(true)
    const payload = {
      full_name: form.full_name.trim(),
      date_of_birth: form.date_of_birth || null,
      age_group: (form.age_group || null) as AgeGroup | null,
      position: form.position.trim() || null,
      parent_name: form.parent_name.trim() || null,
      parent_phone: form.parent_phone.trim() || null,
    }
    const { error: saveError } = editing
      ? await supabase.from('players').update(payload).eq('id', editing.id)
      : await supabase.from('players').insert(payload)
    setSaving(false)
    if (saveError) {
      setFormError(saveError.message)
      return
    }
    toast(editing ? 'Player updated.' : 'Player added.')
    setFormOpen(false)
    setEditing(null)
    void load()
  }

  async function handleDelete() {
    if (!supabase || !deleteTarget) return
    setDeleting(true)
    const { error: delError } = await supabase
      .from('players')
      .delete()
      .eq('id', deleteTarget.id)
    setDeleting(false)
    if (delError) {
      toast(
        delError.message.includes('violates foreign key')
          ? 'This player has attendance or team records. Remove them from teams first.'
          : delError.message,
        'error',
      )
      return
    }
    toast('Player removed.')
    setDeleteTarget(null)
    void load()
  }

  if (loading) return <Spinner label="Loading players…" />
  if (error) return <ErrorBanner message={error} />

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-normal text-white">
            Manage Players
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Register players, then assign them to teams from Manage Teams.
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add player
        </PrimaryButton>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search players or parents…"
        className="mt-6 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-gold-500/60 focus:outline-none"
      />

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium tracking-normal text-white">
              {editing ? 'Edit player' : 'Add player'}
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
                Full name *
              </span>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-gold-500/60 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Date of birth
              </span>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-gold-500/60 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Age group
              </span>
              <select
                value={form.age_group}
                onChange={(e) => setForm({ ...form, age_group: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-gold-500/60 focus:outline-none"
              >
                <option value="">Not set</option>
                {AGE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Position
              </span>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="e.g. Midfielder"
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-gold-500/60 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Parent / guardian name
              </span>
              <input
                type="text"
                value={form.parent_name}
                onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-gold-500/60 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Parent phone
              </span>
              <input
                type="tel"
                value={form.parent_phone}
                onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-gold-500/60 focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add player'}
            </PrimaryButton>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={players.length === 0 ? 'No players yet' : 'No players match that search'}
            body="Add players here, then assign them to a team from Manage Teams."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((p) => {
            const age = ageFromDob(p.date_of_birth)
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl px-5 py-4"
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                    {p.full_name}
                    {p.is_demo && <DemoBadge />}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {[
                      p.age_group,
                      age !== null ? `${age} yrs` : null,
                      p.position,
                      p.parent_name ? `Parent: ${p.parent_name}` : null,
                      p.parent_phone,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'No details yet'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SecondaryButton
                    onClick={() => openEdit(p)}
                    className="!px-3 !py-1.5 !text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </SecondaryButton>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(p)}
                    aria-label={`Remove ${p.full_name}`}
                    className="rounded-xl border border-brand-800 bg-brand-900/30 p-2 text-brand-300 transition hover:bg-brand-900/60"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove this player?"
        body={`"${deleteTarget?.full_name ?? ''}" will be removed. If they have attendance or team records, remove those first.`}
        confirmLabel="Remove player"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
