import type { AttendanceStatus } from './types'

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + (isoDate.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(time: string): string {
  // "HH:MM:SS" or "HH:MM" -> "6:00 pm"
  const [h, m] = time.split(':').map(Number)
  const hour12 = h % 12 === 0 ? 12 : h % 12
  const ampm = h < 12 ? 'am' : 'pm'
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
}

export function formatDateTime(date: string, time: string): string {
  return `${formatDate(date)} · ${formatTime(time)}`
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function attendancePct(
  records: { status: AttendanceStatus }[],
): { present: number; absent: number; late: number; excused: number; total: number; pct: number } {
  const total = records.length
  const present = records.filter((r) => r.status === 'present').length
  const absent = records.filter((r) => r.status === 'absent').length
  const late = records.filter((r) => r.status === 'late').length
  const excused = records.filter((r) => r.status === 'excused').length
  // Attendance % counts present + late as attended.
  const pct = total === 0 ? 0 : Math.round(((present + late) / total) * 100)
  return { present, absent, late, excused, total, pct }
}

/** Players below this attendance % over a period are flagged as low attendance. */
export const LOW_ATTENDANCE_THRESHOLD = 70

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

/**
 * Fee state, computed from the amounts and the structure's due date —
 * never stored, so it can never go stale.
 * paid: fully paid. partial: something paid, balance remains.
 * overdue: unpaid balance past the due date. pending: unpaid, not yet due.
 */
export function feeStatus(
  amountDue: number,
  amountPaid: number,
  dueDate: string | null,
): import('./types').FeeStatus {
  const outstanding = amountDue - amountPaid
  if (outstanding <= 0) return 'paid'
  if (amountPaid > 0) return 'partial'
  if (dueDate && dueDate < todayIso()) return 'overdue'
  return 'pending'
}

export function feeOutstanding(amountDue: number, amountPaid: number): number {
  return Math.max(0, amountDue - amountPaid)
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function ageFromDob(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}
