import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchAnnouncementsForRole,
  supabaseErrorMessage,
} from '../../lib/data'
import type { Announcement } from '../../lib/types'
import { AUDIENCE_LABELS } from '../../lib/types'
import { formatDate } from '../../lib/utils'
import { DemoBadge, EmptyState, ErrorBanner, Spinner } from '../../components/ui'

export default function Announcements() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!profile) return
      setLoading(true)
      setError(null)
      try {
        const data = await fetchAnnouncementsForRole(profile.role)
        if (!cancelled) setAnnouncements(data)
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
  }, [profile])

  if (loading) return <Spinner label="Loading announcements…" />
  if (error) return <ErrorBanner message={error} />

  const isAdmin = profile?.role === 'admin'

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-wide text-white uppercase">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            News from the academy — trials, schedule changes, events.
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/portal/admin/announcements"
            className="text-sm font-semibold text-brand-400 hover:text-brand-300"
          >
            Manage announcements →
          </Link>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No announcements yet"
            body={
              isAdmin
                ? 'Publish the first announcement from Manage Announcements.'
                : 'When the academy publishes news, it will appear here.'
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {announcements.map((a) => (
            <li
              key={a.id}
              className="card p-5"
            >
              <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
                <Megaphone className="h-4 w-4 text-brand-400" />
                {a.title}
                {a.is_demo && <DemoBadge />}
                {isAdmin && (
                  <span className="rounded-full bg-charcoal-800 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300">
                    {AUDIENCE_LABELS[a.audience]}
                  </span>
                )}
              </p>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
                {a.body}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {formatDate(a.created_at.slice(0, 10))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
