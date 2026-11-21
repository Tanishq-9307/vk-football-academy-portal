import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Trash2, Users, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { AgeGroup, Coach, Player, Team } from '../../../lib/types'
import { AGE_GROUPS } from '../../../lib/types'
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

export default function AdminTeams() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('U14')
  const [coachId, setCoachId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Player assignment panel
  const [assignTeam, setAssignTeam] = useState<Team | null>(null)
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set())
  const [assignSearch, setAssignSearch] = useState('')
  const [assignSaving, setAssignSaving] = useState(false)

  const load = async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const [
        { data: tData, error: tErr },
        { data: cData },
        { data: pData },
        { data: tpData },
      ] = await Promise.all([
        supabase.from('teams').select('*, coach:coaches(*)').order('age_group').order('name'),
        supabase.from('coaches').select('*').eq('is_active', true).order('full_name'),
        supabase.from('players').select('*').order('full_name'),
        supabase.from('team_players').select('team_id, player_id'),
      ])
      if (tErr) throw new Error(tErr.message)
      setTeams((tData ?? []) as Team[])
      setCoaches((cData ?? []) as Coach[])
      setAllPlayers((pData ?? []) as Player[])
      const counts: Record<string, number> = {}
      ;(tpData ?? []).forEach((row) => {
        counts[row.team_id as string] = (counts[row.team_id as string] ?? 0) + 1
      })
      setMemberCounts(counts)
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
    setName('')
    setAgeGroup('U14')
    setCoachId('')
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(t: Team) {
    setEditing(t)
    setName(t.name)
    setAgeGroup(t.age_group)
    setCoachId(t.coach_id ?? '')
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setFormError(null)
    if (!name.trim()) return setFormError('Enter a team name.')
    setSaving(true)
    const payload = {
      name: name.trim(),
      age_group: ageGroup,
      coach_id: coachId || null,
    }
    const { error: saveError } = editing
      ? await supabase.from('teams').update(payload).eq('id', editing.id)
      : await supabase.from('teams').insert(payload)
    setSaving(false)
    if (saveError) {
      setFormError(saveError.message)
      return
    }
    toast(editing ? 'Team updated.' : 'Team created.')
    setFormOpen(false)
    setEditing(null)
    void load()
  }

  async function handleDelete() {
    if (!supabase || !deleteTarget) return
    setDeleting(true)
    const { error: delError } = await supabase
      .from('teams')
      .delete()
      .eq('id', deleteTarget.id)
    setDeleting(false)
    if (delError) {
      toast(
        delError.message.includes('violates foreign key')
          ? 'This team still has sessions, plans or players. Remove those first.'
          : delError.message,
        'error',
      )
      return
    }
    toast('Team deleted.')
    setDeleteTarget(null)
    void load()
  }

  async function openAssign(t: Team) {
    if (!supabase) return
    setAssignTeam(t)
    setAssignSearch('')
    const { data } = await supabase
      .from('team_players')
      .select('player_id')
      .eq('team_id', t.id)
    setAssignedIds(new Set((data ?? []).map((r) => r.player_id as string)))
  }

  const filteredAssignPlayers = useMemo(() => {
    const q = assignSearch.trim().toLowerCase()
    return allPlayers.filter(
      (p) => !q || p.full_name.toLowerCase().includes(q),
    )
  }, [allPlayers, assignSearch])

  async function handleSaveAssignment() {
    if (!supabase || !assignTeam) return
    setAssignSaving(true)
    try {
      const { data: current } = await supabase
        .from('team_players')
        .select('player_id')
        .eq('team_id', assignTeam.id)
      const currentIds = new Set((current ?? []).map((r) => r.player_id as string))
      const toAdd = [...assignedIds].filter((id) => !currentIds.has(id))
      const toRemove = [...currentIds].filter((id) => !assignedIds.has(id))
      if (toAdd.length > 0) {
        const { error } = await supabase
          .from('team_players')
          .insert(toAdd.map((player_id) => ({ team_id: assignTeam.id, player_id })))
        if (error) throw new Error(error.message)
      }
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('team_players')
          .delete()
          .eq('team_id', assignTeam.id)
          .in('player_id', toRemove)
        if (error) throw new Error(error.message)
      }
      toast('Team roster updated.')
      setAssignTeam(null)
      void load()
    } catch (e) {
      toast(await supabaseErrorMessage(e), 'error')
    } finally {
      setAssignSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading teams…" />
  if (error) return <ErrorBanner message={error} />

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
            Manage Teams
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create teams, assign a coach, and choose which players belong to
            each team.
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New team
        </PrimaryButton>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 stadium-card p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
              {editing ? 'Edit team' : 'New team'}
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
                Team name *
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. U14 Reds"
                className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Age group
              </span>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              >
                {AGE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Coach
              </span>
              <select
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="">No coach assigned</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create team'}
            </PrimaryButton>
          </div>
        </form>
      )}

      {teams.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No teams yet"
            body="Create your first team — for example the U14s — then assign a coach and players."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {teams.map((t) => (
            <li
              key={t.id}
              className="stadium-card px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                    {t.name}
                    {t.is_demo && <DemoBadge />}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {t.age_group}
                    {t.coach ? ` · Coach: ${t.coach.full_name}` : ' · No coach assigned'}
                    {` · ${memberCounts[t.id] ?? 0} player${(memberCounts[t.id] ?? 0) === 1 ? '' : 's'}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <SecondaryButton
                    onClick={() => void openAssign(t)}
                    className="!px-3 !py-1.5 !text-xs"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Players
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={() => openEdit(t)}
                    className="!px-3 !py-1.5 !text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </SecondaryButton>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(t)}
                    aria-label={`Delete ${t.name}`}
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

      {/* Player assignment panel */}
      {assignTeam && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Assign players to ${assignTeam.name}`}
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-charcoal-600 bg-charcoal-850 p-6 shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
                Players — {assignTeam.name}
              </h2>
              <button
                type="button"
                onClick={() => setAssignTeam(null)}
                aria-label="Close"
                className="rounded-lg p-2 text-zinc-400 hover:bg-charcoal-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="search"
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              placeholder="Search players…"
              className="mt-4 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none"
            />
            <p className="mt-3 text-sm text-zinc-400">
              {assignedIds.size} selected
            </p>
            {allPlayers.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                No players exist yet — add them from Manage Players first.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-charcoal-700">
                {filteredAssignPlayers.map((p) => {
                  const checked = assignedIds.has(p.id)
                  return (
                    <li key={p.id}>
                      <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm text-zinc-200">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setAssignedIds((prev) => {
                              const next = new Set(prev)
                              if (checked) next.delete(p.id)
                              else next.add(p.id)
                              return next
                            })
                          }
                          className="h-4 w-4 accent-red-600"
                        />
                        {p.full_name}
                        {p.age_group && (
                          <span className="text-xs text-zinc-500">{p.age_group}</span>
                        )}
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton type="button" onClick={() => setAssignTeam(null)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={() => void handleSaveAssignment()} disabled={assignSaving}>
                {assignSaving ? 'Saving…' : 'Save roster'}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this team?"
        body={`"${deleteTarget?.name ?? ''}" will be deleted. If it has sessions, plans or players, remove those first.`}
        confirmLabel="Delete team"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
