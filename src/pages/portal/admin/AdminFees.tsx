import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Trash2, Wallet, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type {
  AgeGroup,
  FeeRecord,
  FeeStructure,
  PaymentMethod,
  Player,
} from '../../../lib/types'
import { AGE_GROUPS, PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../../../lib/types'
import {
  fetchFeeRecordsForPlayers,
  fetchFeeStructures,
  supabaseErrorMessage,
} from '../../../lib/data'
import {
  feeOutstanding,
  feeStatus,
  formatDate,
  formatINR,
} from '../../../lib/utils'
import {
  ConfirmDialog,
  DemoBadge,
  EmptyState,
  ErrorBanner,
  FeeStatusPill,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  StatCard,
  useToast,
} from '../../../components/ui'

interface StructureForm {
  name: string
  age_group: string
  amount: string
  due_date: string
  description: string
}

interface RecordForm {
  player_id: string
  fee_structure_id: string
  amount_due: string
  amount_paid: string
  payment_date: string
  payment_method: string
  receipt_no: string
  notes: string
}

const EMPTY_STRUCTURE: StructureForm = {
  name: '',
  age_group: '',
  amount: '',
  due_date: '',
  description: '',
}

const EMPTY_RECORD: RecordForm = {
  player_id: '',
  fee_structure_id: '',
  amount_due: '',
  amount_paid: '0',
  payment_date: '',
  payment_method: '',
  receipt_no: '',
  notes: '',
}

export default function AdminFees() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [records, setRecords] = useState<FeeRecord[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const [sFormOpen, setSFormOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null)
  const [sForm, setSForm] = useState<StructureForm>(EMPTY_STRUCTURE)
  const [sError, setSError] = useState<string | null>(null)
  const [sSaving, setSSaving] = useState(false)
  const [deleteStructure, setDeleteStructure] = useState<FeeStructure | null>(null)
  const [deletingStructure, setDeletingStructure] = useState(false)

  const [rFormOpen, setRFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FeeRecord | null>(null)
  const [rForm, setRForm] = useState<RecordForm>(EMPTY_RECORD)
  const [rError, setRError] = useState<string | null>(null)
  const [rSaving, setRSaving] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<FeeRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState(false)

  const load = async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const [
        { data: plData, error: plErr },
        structureData,
      ] = await Promise.all([
        supabase.from('players').select('*').order('full_name'),
        fetchFeeStructures(),
      ])
      if (plErr) throw new Error(plErr.message)
      const playerList = (plData ?? []) as Player[]
      setPlayers(playerList)
      setStructures(structureData)
      setRecords(
        await fetchFeeRecordsForPlayers(playerList.map((p) => p.id)),
      )
    } catch (e) {
      setError(await supabaseErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  /* --------------------------- Fee structures ---------------------------- */

  function openStructureCreate() {
    setEditingStructure(null)
    setSForm(EMPTY_STRUCTURE)
    setSError(null)
    setSFormOpen(true)
  }

  function openStructureEdit(s: FeeStructure) {
    setEditingStructure(s)
    setSForm({
      name: s.name,
      age_group: s.age_group ?? '',
      amount: String(s.amount),
      due_date: s.due_date ?? '',
      description: s.description ?? '',
    })
    setSError(null)
    setSFormOpen(true)
  }

  async function handleStructureSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSError(null)
    if (!sForm.name.trim()) return setSError('Enter a name for the fee.')
    const amount = Number(sForm.amount)
    if (!Number.isFinite(amount) || amount < 0) {
      return setSError('Amount must be a number, 0 or more.')
    }
    setSSaving(true)
    const payload = {
      name: sForm.name.trim(),
      age_group: (sForm.age_group || null) as AgeGroup | null,
      amount,
      due_date: sForm.due_date || null,
      description: sForm.description.trim() || null,
    }
    const { error: saveError } = editingStructure
      ? await supabase.from('fee_structures').update(payload).eq('id', editingStructure.id)
      : await supabase.from('fee_structures').insert(payload)
    setSSaving(false)
    if (saveError) {
      setSError(saveError.message)
      return
    }
    toast(editingStructure ? 'Fee structure updated.' : 'Fee structure added.')
    setSFormOpen(false)
    setEditingStructure(null)
    void load()
  }

  async function handleStructureDelete() {
    if (!supabase || !deleteStructure) return
    setDeletingStructure(true)
    const { error: delError } = await supabase
      .from('fee_structures')
      .delete()
      .eq('id', deleteStructure.id)
    setDeletingStructure(false)
    if (delError) {
      toast(delError.message, 'error')
      return
    }
    toast('Fee structure removed. Existing records keep their amounts.')
    setDeleteStructure(null)
    void load()
  }

  /* ---------------------------- Fee records ------------------------------ */

  function openRecordCreate() {
    setEditingRecord(null)
    setRForm({ ...EMPTY_RECORD, player_id: players[0]?.id ?? '' })
    setRError(null)
    setRFormOpen(true)
  }

  function openRecordEdit(r: FeeRecord) {
    setEditingRecord(r)
    setRForm({
      player_id: r.player_id,
      fee_structure_id: r.fee_structure_id ?? '',
      amount_due: String(r.amount_due),
      amount_paid: String(r.amount_paid),
      payment_date: r.payment_date ?? '',
      payment_method: r.payment_method ?? '',
      receipt_no: r.receipt_no ?? '',
      notes: r.notes ?? '',
    })
    setRError(null)
    setRFormOpen(true)
  }

  function onStructurePick(structureId: string) {
    const s = structures.find((x) => x.id === structureId)
    setRForm((f) => ({
      ...f,
      fee_structure_id: structureId,
      amount_due: s ? String(s.amount) : f.amount_due,
    }))
  }

  async function handleRecordSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setRError(null)
    if (!rForm.player_id) return setRError('Pick a player.')
    const due = Number(rForm.amount_due)
    const paid = Number(rForm.amount_paid)
    if (!Number.isFinite(due) || due < 0) {
      return setRError('Amount due must be a number, 0 or more.')
    }
    if (!Number.isFinite(paid) || paid < 0) {
      return setRError('Amount paid must be a number, 0 or more.')
    }
    if (paid > due) {
      return setRError('Amount paid cannot be more than the amount due.')
    }
    setRSaving(true)
    const payload = {
      player_id: rForm.player_id,
      fee_structure_id: rForm.fee_structure_id || null,
      amount_due: due,
      amount_paid: paid,
      payment_date: rForm.payment_date || null,
      payment_method: (rForm.payment_method || null) as PaymentMethod | null,
      receipt_no: rForm.receipt_no.trim() || null,
      notes: rForm.notes.trim() || null,
    }
    const { error: saveError } = editingRecord
      ? await supabase.from('fee_records').update(payload).eq('id', editingRecord.id)
      : await supabase.from('fee_records').insert(payload)
    setRSaving(false)
    if (saveError) {
      setRError(saveError.message)
      return
    }
    toast(editingRecord ? 'Payment record updated.' : 'Payment recorded.')
    setRFormOpen(false)
    setEditingRecord(null)
    void load()
  }

  async function handleRecordDelete() {
    if (!supabase || !deleteRecord) return
    setDeletingRecord(true)
    const { error: delError } = await supabase
      .from('fee_records')
      .delete()
      .eq('id', deleteRecord.id)
    setDeletingRecord(false)
    if (delError) {
      toast(delError.message, 'error')
      return
    }
    toast('Payment record removed.')
    setDeleteRecord(null)
    void load()
  }

  if (loading) return <Spinner label="Loading fees…" />
  if (error) return <ErrorBanner message={error} />

  const totalDue = records.reduce((s, r) => s + r.amount_due, 0)
  const totalPaid = records.reduce((s, r) => s + r.amount_paid, 0)
  const totalOutstanding = records.reduce(
    (s, r) => s + feeOutstanding(r.amount_due, r.amount_paid),
    0,
  )
  const overdueCount = records.filter(
    (r) => feeStatus(r.amount_due, r.amount_paid, r.structure?.due_date ?? null) === 'overdue',
  ).length

  const filteredRecords = records.filter((r) => {
    const status = feeStatus(r.amount_due, r.amount_paid, r.structure?.due_date ?? null)
    if (statusFilter !== 'all' && status !== statusFilter) return false
    if (
      search.trim() &&
      !`${r.player?.full_name ?? ''} ${r.structure?.name ?? ''} ${r.receipt_no ?? ''}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    ) {
      return false
    }
    return true
  })

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
        Manage Fees
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Define fee structures, record payments manually, and track what is
        pending or overdue. No online payments — money is collected by the
        academy and recorded here.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total due" value={formatINR(totalDue)} />
        <StatCard label="Collected" value={formatINR(totalPaid)} />
        <StatCard label="Outstanding" value={formatINR(totalOutstanding)} />
        <StatCard
          label="Overdue records"
          value={String(overdueCount)}
          sub="Unpaid past the due date"
        />
      </div>

      {/* Fee structures */}
      <section className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            Fee structures
          </h2>
          <PrimaryButton onClick={openStructureCreate}>
            <Plus className="h-4 w-4" />
            Add fee structure
          </PrimaryButton>
        </div>

        {sFormOpen && (
          <form
            onSubmit={handleStructureSubmit}
            className="mt-4 card p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold tracking-wide text-white uppercase">
                {editingStructure ? 'Edit fee structure' : 'New fee structure'}
              </h3>
              <button
                type="button"
                onClick={() => setSFormOpen(false)}
                aria-label="Close form"
                className="rounded-lg p-2 text-zinc-400 hover:bg-charcoal-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sError && (
              <div className="mt-4">
                <ErrorBanner message={sError} />
              </div>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Name *
                </span>
                <input
                  type="text"
                  value={sForm.name}
                  onChange={(e) => setSForm({ ...sForm, name: e.target.value })}
                  placeholder="e.g. Term Fee — U14"
                  className="field"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Age group
                </span>
                <select
                  value={sForm.age_group}
                  onChange={(e) => setSForm({ ...sForm, age_group: e.target.value })}
                  className="field"
                >
                  <option value="">All age groups</option>
                  {AGE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Amount (₹) *
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={sForm.amount}
                  onChange={(e) => setSForm({ ...sForm, amount: e.target.value })}
                  placeholder="4500"
                  className="field"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Due date
                </span>
                <input
                  type="date"
                  value={sForm.due_date}
                  onChange={(e) => setSForm({ ...sForm, due_date: e.target.value })}
                  className="field"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Description
                </span>
                <input
                  type="text"
                  value={sForm.description}
                  onChange={(e) => setSForm({ ...sForm, description: e.target.value })}
                  className="field"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton type="button" onClick={() => setSFormOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={sSaving}>
                {sSaving ? 'Saving…' : editingStructure ? 'Save changes' : 'Add structure'}
              </PrimaryButton>
            </div>
          </form>
        )}

        {structures.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No fee structures yet"
              body="Define a fee — e.g. a term fee per age group — then record payments against it below."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {structures.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 card px-5 py-4"
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                    <Wallet className="h-4 w-4 text-brand-400" />
                    {s.name}
                    {s.is_demo && <DemoBadge />}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {formatINR(s.amount)}
                    {s.age_group ? ` · ${s.age_group}` : ''}
                    {s.due_date ? ` · Due ${formatDate(s.due_date)}` : ''}
                    {s.description ? ` · ${s.description}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <SecondaryButton
                    onClick={() => openStructureEdit(s)}
                    className="!px-3 !py-1.5 !text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </SecondaryButton>
                  <button
                    type="button"
                    onClick={() => setDeleteStructure(s)}
                    aria-label={`Remove ${s.name}`}
                    className="rounded-xl border border-brand-800 bg-brand-900/30 p-2 text-brand-300 transition hover:bg-brand-900/60"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Payment records */}
      <section className="mt-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white uppercase">
            Payment records
          </h2>
          <PrimaryButton
            onClick={openRecordCreate}
            disabled={players.length === 0}
          >
            <Plus className="h-4 w-4" />
            Record payment
          </PrimaryButton>
        </div>

        {rFormOpen && (
          <form
            onSubmit={handleRecordSubmit}
            className="mt-4 card p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold tracking-wide text-white uppercase">
                {editingRecord ? 'Edit payment record' : 'Record payment'}
              </h3>
              <button
                type="button"
                onClick={() => setRFormOpen(false)}
                aria-label="Close form"
                className="rounded-lg p-2 text-zinc-400 hover:bg-charcoal-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {rError && (
              <div className="mt-4">
                <ErrorBanner message={rError} />
              </div>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Player *
                </span>
                <select
                  value={rForm.player_id}
                  onChange={(e) => setRForm({ ...rForm, player_id: e.target.value })}
                  className="field"
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
                  Fee structure
                </span>
                <select
                  value={rForm.fee_structure_id}
                  onChange={(e) => onStructurePick(e.target.value)}
                  className="field"
                >
                  <option value="">No structure — ad-hoc fee</option>
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatINR(s.amount)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Amount due (₹) *
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={rForm.amount_due}
                  onChange={(e) => setRForm({ ...rForm, amount_due: e.target.value })}
                  className="field"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Amount paid (₹)
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={rForm.amount_paid}
                  onChange={(e) => setRForm({ ...rForm, amount_paid: e.target.value })}
                  className="field"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Payment date
                </span>
                <input
                  type="date"
                  value={rForm.payment_date}
                  onChange={(e) => setRForm({ ...rForm, payment_date: e.target.value })}
                  className="field"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Payment method
                </span>
                <select
                  value={rForm.payment_method}
                  onChange={(e) => setRForm({ ...rForm, payment_method: e.target.value })}
                  className="field"
                >
                  <option value="">Not recorded</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Receipt no.
                </span>
                <input
                  type="text"
                  value={rForm.receipt_no}
                  onChange={(e) => setRForm({ ...rForm, receipt_no: e.target.value })}
                  className="field"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Notes
                </span>
                <input
                  type="text"
                  value={rForm.notes}
                  onChange={(e) => setRForm({ ...rForm, notes: e.target.value })}
                  className="field"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton type="button" onClick={() => setRFormOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={rSaving}>
                {rSaving ? 'Saving…' : editingRecord ? 'Save changes' : 'Record payment'}
              </PrimaryButton>
            </div>
          </form>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="field"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Part paid</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </select>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player, fee or receipt…"
            className="min-w-48 flex-1 field"
          />
        </div>

        {filteredRecords.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No payment records"
              body="Record a payment with the button above — pick a player, a fee structure, and the amount received."
            />
          </div>
        ) : (
          <div className="mt-4 table-shell">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-charcoal-700 bg-charcoal-900 text-xs tracking-widest text-zinc-400 uppercase">
                  <th className="px-4 py-3">Player / Fee</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Outstanding</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-700">
                {filteredRecords.map((r) => {
                  const status = feeStatus(
                    r.amount_due,
                    r.amount_paid,
                    r.structure?.due_date ?? null,
                  )
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-medium text-white">
                        <span className="flex items-center gap-2">
                          {r.player?.full_name ?? '—'}
                          {r.is_demo && <DemoBadge />}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {r.structure?.name ?? 'Ad-hoc fee'}
                          {r.structure?.due_date
                            ? ` · Due ${formatDate(r.structure.due_date)}`
                            : ''}
                          {r.receipt_no ? ` · ${r.receipt_no}` : ''}
                          {r.payment_date
                            ? ` · Paid ${formatDate(r.payment_date)}`
                            : ''}
                          {r.payment_method
                            ? ` · ${PAYMENT_METHOD_LABELS[r.payment_method]}`
                            : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{formatINR(r.amount_due)}</td>
                      <td className="px-4 py-3 text-zinc-300">{formatINR(r.amount_paid)}</td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {formatINR(feeOutstanding(r.amount_due, r.amount_paid))}
                      </td>
                      <td className="px-4 py-3">
                        <FeeStatusPill status={status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <SecondaryButton
                            onClick={() => openRecordEdit(r)}
                            className="!px-3 !py-1.5 !text-xs"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </SecondaryButton>
                          <button
                            type="button"
                            onClick={() => setDeleteRecord(r)}
                            aria-label={`Remove record for ${r.player?.full_name ?? ''}`}
                            className="rounded-xl border border-brand-800 bg-brand-900/30 p-2 text-brand-300 transition hover:bg-brand-900/60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleteStructure !== null}
        title="Remove this fee structure?"
        body={`"${deleteStructure?.name ?? ''}" will be removed. Payment records linked to it keep their amounts but lose the structure link.`}
        confirmLabel="Remove structure"
        busy={deletingStructure}
        onConfirm={handleStructureDelete}
        onCancel={() => setDeleteStructure(null)}
      />
      <ConfirmDialog
        open={deleteRecord !== null}
        title="Remove this payment record?"
        body={`The record for "${deleteRecord?.player?.full_name ?? ''}" (${deleteRecord?.structure?.name ?? 'fee'}) will be removed permanently.`}
        confirmLabel="Remove record"
        busy={deletingRecord}
        onConfirm={handleRecordDelete}
        onCancel={() => setDeleteRecord(null)}
      />
    </div>
  )
}
