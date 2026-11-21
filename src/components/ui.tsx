import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import type { AttendanceStatus, FeeStatus } from '../lib/types'
import { ATTENDANCE_LABELS, FEE_STATUS_LABELS } from '../lib/types'

/* ---------------------------------- Toast --------------------------------- */

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}
const ToastCtx = createContext<(message: string, kind?: ToastKind) => void>(
  () => {},
)

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const push = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, kind, message }])
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 4500)
  }, [])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="glass pointer-events-auto flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm text-zinc-100"
            role="status"
          >
            {t.kind === 'success' && (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            )}
            {t.kind === 'error' && (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
            )}
            {t.kind === 'info' && (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* --------------------------------- Spinner -------------------------------- */

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-zinc-400">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-brand-500" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold tracking-wide text-zinc-200">
        {title}
      </p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

/* ------------------------------ Error banner ------------------------------ */

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

/* -------------------------------- Demo badge ------------------------------ */

export function DemoBadge() {
  return (
    <span
      title="Demo data — clearly marked sample data, not real academy records"
      className="inline-flex items-center rounded-full border border-gold-600/60 bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-gold-400 uppercase"
    >
      Demo data
    </span>
  )
}

/* ---------------------------- Attendance status --------------------------- */

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-green-500/15 text-green-300 border-green-500/40',
  absent: 'bg-brand-500/15 text-brand-300 border-brand-500/40',
  late: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  excused: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
}

export function StatusPill({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {ATTENDANCE_LABELS[status]}
    </span>
  )
}

/* ------------------------------- Fee status ------------------------------- */

const FEE_STATUS_STYLES: Record<FeeStatus, string> = {
  paid: 'bg-green-500/15 text-green-300 border-green-500/40',
  partial: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  overdue: 'bg-brand-500/15 text-brand-300 border-brand-500/40',
  pending: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/40',
}

export function FeeStatusPill({ status }: { status: FeeStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${FEE_STATUS_STYLES[status]}`}
    >
      {FEE_STATUS_LABELS[status]}
    </span>
  )
}

/* --------------------------------- Buttons -------------------------------- */

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/10 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`glass inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function DangerButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

/* ------------------------------ Confirm dialog ---------------------------- */

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  busy = false,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="glass w-full max-w-sm rounded-3xl p-6">
        <h3 className="font-display text-lg font-semibold tracking-wide text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <SecondaryButton onClick={onCancel} disabled={busy}>
            Cancel
          </SecondaryButton>
          <DangerButton onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </DangerButton>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------- Stat card ------------------------------ */

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
        {label}
      </p>
      <p className="font-display mt-2 text-3xl font-medium text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}
