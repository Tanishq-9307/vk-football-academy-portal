import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
            className="pointer-events-auto flex items-start gap-2.5 rounded-2xl border border-charcoal-600 bg-charcoal-800/95 px-4 py-3 text-sm text-zinc-100 shadow-2xl backdrop-blur"
            style={{
              borderLeftWidth: 3,
              borderLeftColor:
                t.kind === 'success'
                  ? '#22c55e'
                  : t.kind === 'error'
                    ? '#e30613'
                    : '#38bdf8',
            }}
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
              className="rounded-md text-zinc-400 hover:text-white"
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
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-charcoal-600 border-t-brand-500 border-r-gold-400" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/* -------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-5" aria-hidden="true">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="mt-2 h-3 w-full" />
      ))}
    </div>
  )
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string
  body?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      {icon && (
        <span className="mb-4 inline-flex rounded-2xl border border-gold-600/40 bg-gold-500/10 p-3.5 text-gold-400">
          {icon}
        </span>
      )}
      <p className="font-display text-lg font-semibold tracking-wide text-zinc-100 uppercase">
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
    <div className="flex items-start gap-2.5 rounded-2xl border border-brand-800 bg-brand-900/30 px-4 py-3 text-sm text-brand-200">
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

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400'

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`${BTN_BASE} bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 ${props.className ?? ''}`}
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
      className={`${BTN_BASE} border border-charcoal-600 bg-charcoal-800 text-zinc-100 hover:border-charcoal-500 hover:bg-charcoal-700 ${props.className ?? ''}`}
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
      className={`${BTN_BASE} bg-brand-600 text-white hover:bg-brand-700 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

/** Gold accent button — premium CTAs only. */
export function AccentButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`${BTN_BASE} bg-gold-400 text-black shadow-lg shadow-gold-500/20 hover:bg-gold-300 ${props.className ?? ''}`}
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
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-sm p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-brand-500 to-gold-400" />
        <h3 className="font-display mt-4 text-lg font-semibold tracking-wide text-white uppercase">
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

const STAT_ACCENTS = {
  red: 'from-brand-500 to-brand-700',
  gold: 'from-gold-400 to-gold-600',
  green: 'from-green-400 to-green-600',
  sky: 'from-sky-400 to-sky-600',
} as const

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'red',
}: {
  label: string
  value: string
  sub?: string
  icon?: ReactNode
  accent?: keyof typeof STAT_ACCENTS
}) {
  return (
    <div className="card card-hover relative overflow-hidden p-5">
      <span
        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${STAT_ACCENTS[accent]}`}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          {label}
        </p>
        {icon && (
          <span className="inline-flex rounded-xl border border-charcoal-600 bg-charcoal-800 p-2 text-gold-400">
            {icon}
          </span>
        )}
      </div>
      <p className="font-display mt-2 text-3xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-1 truncate text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

/* ----------------------------- Attendance ring ---------------------------- */

export function AttendanceRing({
  pct,
  size = 120,
  label = 'Attendance',
}: {
  pct: number
  size?: number
  label?: string
}) {
  const r = (size - 12) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label}: ${clamped}%`}
        className="shrink-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2b2b33"
          strokeWidth="9"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e30613" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
        </defs>
      </svg>
      <div className="min-w-0">
        <p className="font-display text-3xl font-semibold text-white">{clamped}%</p>
        <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          {label}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------ Page header ------------------------------- */

export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string
  title: string
  sub?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="font-display mt-2 text-3xl leading-none font-semibold tracking-wide text-white uppercase sm:text-4xl">
          {title}
        </h1>
        {sub && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------------------------------- Card ---------------------------------- */

export function Card({
  children,
  className = '',
  gold = false,
  hover = false,
}: {
  children: ReactNode
  className?: string
  gold?: boolean
  hover?: boolean
}) {
  return (
    <div className={`${gold ? 'card-gold' : 'card'} ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  )
}

/* --------------------------- Scroll reveal -------------------------------- */

export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* --------------------------- 3D tilt on hover ------------------------------ */

export function TiltCard({
  children,
  className = '',
  max = 7,
}: {
  children: ReactNode
  className?: string
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-4px)`
  }

  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.transform = ''
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`will-change-transform ${className}`}
      style={{ transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)' }}
    >
      {children}
    </div>
  )
}
