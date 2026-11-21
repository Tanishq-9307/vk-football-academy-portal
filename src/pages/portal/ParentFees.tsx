import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchFeeRecordsForPlayers,
  supabaseErrorMessage,
} from '../../lib/data'
import type { FeeRecord } from '../../lib/types'
import { PAYMENT_METHOD_LABELS } from '../../lib/types'
import {
  feeOutstanding,
  feeStatus,
  formatDate,
  formatINR,
} from '../../lib/utils'
import {
  DemoBadge,
  EmptyState,
  ErrorBanner,
  FeeStatusPill,
  Spinner,
  StatCard,
} from '../../components/ui'

export default function ParentFees() {
  const { children } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [records, setRecords] = useState<FeeRecord[]>([])
  const [childFilter, setChildFilter] = useState<string>('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchFeeRecordsForPlayers(children.map((c) => c.id))
        if (!cancelled) setRecords(data)
      } catch (e) {
        if (!cancelled) setError(await supabaseErrorMessage(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [children])

  if (loading) return <Spinner label="Loading fees…" />
  if (error) return <ErrorBanner message={error} />

  const filtered =
    childFilter === 'all'
      ? records
      : records.filter((r) => r.player_id === childFilter)

  const totalDue = filtered.reduce((s, r) => s + r.amount_due, 0)
  const totalPaid = filtered.reduce((s, r) => s + r.amount_paid, 0)
  const totalOutstanding = filtered.reduce(
    (s, r) => s + feeOutstanding(r.amount_due, r.amount_paid),
    0,
  )

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
        Fees
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Outstanding fees and payment history for your children. Fees are
        settled with the academy directly — this portal does not take online
        payments.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard label="Total due" value={formatINR(totalDue)} />
        <StatCard label="Paid" value={formatINR(totalPaid)} />
        <StatCard label="Outstanding" value={formatINR(totalOutstanding)} />
      </div>

      {children.length > 1 && (
        <div className="mt-6">
          <label className="block">
            <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
              Child
            </span>
            <select
              value={childFilter}
              onChange={(e) => setChildFilter(e.target.value)}
              className="mt-2 w-full max-w-xs field"
            >
              <option value="all">All children</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No fee records"
            body="No fees have been recorded for your children yet."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((r) => {
            const status = feeStatus(
              r.amount_due,
              r.amount_paid,
              r.structure?.due_date ?? null,
            )
            return (
              <div
                key={r.id}
                className="card px-5 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                      {r.structure?.name ?? 'Fee'}
                      {r.is_demo && <DemoBadge />}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      {r.player?.full_name}
                      {r.structure?.due_date
                        ? ` · Due ${formatDate(r.structure.due_date)}`
                        : ''}
                      {r.receipt_no ? ` · Receipt ${r.receipt_no}` : ''}
                    </p>
                  </div>
                  <FeeStatusPill status={status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs tracking-widest text-zinc-500 uppercase">Due</p>
                    <p className="mt-0.5 font-semibold text-white">{formatINR(r.amount_due)}</p>
                  </div>
                  <div>
                    <p className="text-xs tracking-widest text-zinc-500 uppercase">Paid</p>
                    <p className="mt-0.5 font-semibold text-white">{formatINR(r.amount_paid)}</p>
                  </div>
                  <div>
                    <p className="text-xs tracking-widest text-zinc-500 uppercase">Outstanding</p>
                    <p className="mt-0.5 font-semibold text-white">
                      {formatINR(feeOutstanding(r.amount_due, r.amount_paid))}
                    </p>
                  </div>
                </div>
                {(r.payment_date || r.payment_method) && (
                  <p className="mt-2 text-sm text-zinc-500">
                    Last payment:{' '}
                    {r.payment_date ? formatDate(r.payment_date) : 'date not recorded'}
                    {r.payment_method ? ` · ${PAYMENT_METHOD_LABELS[r.payment_method]}` : ''}
                  </p>
                )}
                {r.notes && (
                  <p className="mt-1 text-sm text-zinc-500">{r.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-6 text-sm text-zinc-500">
        To settle an outstanding fee, speak to the academy admin — they record
        the payment here once received.{' '}
        <Link to="/portal/children" className="font-semibold text-brand-400 hover:text-brand-300">
          View your children →
        </Link>
      </p>
    </div>
  )
}
