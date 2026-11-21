import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Baby, Link2, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { ParentLink, Player, Profile } from '../../../lib/types'
import { fetchParentLinks, supabaseErrorMessage } from '../../../lib/data'
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

export default function AdminParents() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parents, setParents] = useState<Profile[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [links, setLinks] = useState<ParentLink[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [parentId, setParentId] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [relationship, setRelationship] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ParentLink | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const [
        { data: pData, error: pErr },
        { data: plData, error: plErr },
        linkData,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'parent').order('email'),
        supabase.from('players').select('*').order('full_name'),
        fetchParentLinks(),
      ])
      if (pErr) throw new Error(pErr.message)
      if (plErr) throw new Error(plErr.message)
      setParents((pData ?? []) as Profile[])
      setPlayers((plData ?? []) as Player[])
      setLinks(linkData)
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
    setParentId(parents[0]?.id ?? '')
    setPlayerId(players[0]?.id ?? '')
    setRelationship('')
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setFormError(null)
    if (!parentId) return setFormError('Pick a parent login.')
    if (!playerId) return setFormError('Pick a player.')
    setSaving(true)
    const { error: saveError } = await supabase.from('parents').insert({
      parent_id: parentId,
      player_id: playerId,
      relationship: relationship.trim() || null,
    })
    setSaving(false)
    if (saveError) {
      setFormError(
        saveError.message.includes('duplicate key')
          ? 'This parent is already linked to this player.'
          : saveError.message,
      )
      return
    }
    toast('Parent linked to player.')
    setFormOpen(false)
    void load()
  }

  async function handleDelete() {
    if (!supabase || !deleteTarget) return
    setDeleting(true)
    const { error: delError } = await supabase
      .from('parents')
      .delete()
      .eq('id', deleteTarget.id)
    setDeleting(false)
    if (delError) {
      toast(delError.message, 'error')
      return
    }
    toast('Link removed — that parent can no longer see this child.')
    setDeleteTarget(null)
    void load()
  }

  if (loading) return <Spinner label="Loading parents…" />
  if (error) return <ErrorBanner message={error} />

  const unlinkedParents = parents.filter(
    (p) => !links.some((l) => l.parent_id === p.id),
  )

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
            Manage Parents
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Link parent logins to their children. A parent sees only the
            children linked here — nothing else.
          </p>
        </div>
        <PrimaryButton onClick={openCreate} disabled={parents.length === 0 || players.length === 0}>
          <Plus className="h-4 w-4" />
          Link parent to player
        </PrimaryButton>
      </div>

      <p className="mt-4 rounded-xl border border-charcoal-700 bg-charcoal-850 px-4 py-3 text-sm text-zinc-400">
        Parent logins are created in Supabase → Authentication → Add user,
        with user metadata{' '}
        <code className="text-zinc-200">{'{"role": "parent", "full_name": "Parent Name"}'}</code>
        . Once the login exists, link it to a player here. A parent can have
        several children; a child can have several linked parents.
      </p>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 stadium-card p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
              Link parent to player
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
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Parent login *
              </span>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              >
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.email}
                    {p.full_name ? ` (${p.full_name})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Player *
              </span>
              <select
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                    {p.age_group ? ` (${p.age_group})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Relationship
              </span>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Father, Mother, Guardian"
                className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'Linking…' : 'Link parent'}
            </PrimaryButton>
          </div>
        </form>
      )}

      {unlinkedParents.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            Parent logins with no children linked
          </h2>
          <ul className="mt-4 space-y-2">
            {unlinkedParents.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-2xl border border-amber-600/40 bg-amber-500/5 px-5 py-3 text-sm text-zinc-300"
              >
                <Baby className="h-4 w-4 shrink-0 text-amber-400" />
                {p.email}
                {p.full_name ? ` — ${p.full_name}` : ''}
                <span className="text-zinc-500">
                  (cannot see anything until linked to a player)
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {links.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No parent links yet"
            body={
              parents.length === 0
                ? 'No parent logins exist yet. Create one in Supabase Authentication first, then link it here.'
                : 'Link a parent login to a player with the button above.'
            }
          />
        </div>
      ) : (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            Linked parents
          </h2>
          <ul className="mt-4 space-y-3">
            {links.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 stadium-card px-5 py-4"
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                    <Link2 className="h-4 w-4 text-brand-400" />
                    {l.parent?.email ?? l.parent_id}
                    {l.is_demo && <DemoBadge />}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {l.parent?.full_name ? `${l.parent.full_name} · ` : ''}
                    {l.relationship ? `${l.relationship} of ` : ''}
                    {l.player?.full_name ?? l.player_id}
                    {l.player?.age_group ? ` (${l.player.age_group})` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(l)}
                  aria-label={`Unlink ${l.player?.full_name ?? 'player'}`}
                  className="rounded-xl border border-brand-800 bg-brand-900/30 p-2 text-brand-300 transition hover:bg-brand-900/60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove this link?"
        body={`"${deleteTarget?.parent?.email ?? ''}" will no longer see "${deleteTarget?.player?.full_name ?? ''}". The login itself stays — only the link is removed.`}
        confirmLabel="Remove link"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
