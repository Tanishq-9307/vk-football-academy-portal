import { Link } from 'react-router-dom'
import { DatabaseZap } from 'lucide-react'
import Logo from '../components/Logo'

/**
 * Shown whenever VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing.
 * The public website still works — only the portal (which needs the
 * database) is blocked, and it says so plainly instead of failing silently.
 */
export default function NotConfigured() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <Logo size={64} />
      <span className="mt-8 inline-flex rounded-2xl bg-brand-500/15 p-4 text-brand-400">
        <DatabaseZap className="h-8 w-8" />
      </span>
      <h1 className="font-display mt-5 text-3xl font-semibold tracking-wide text-white uppercase">
        Supabase not configured yet
      </h1>
      <p className="mt-4 leading-relaxed text-zinc-300">
        The academy portal — attendance, session plans and team management —
        needs a Supabase project to store its data. The database connection
        has not been set up yet.
      </p>
      <div className="mt-6 w-full stadium-card p-5 text-left text-sm leading-relaxed text-zinc-400">
        <p className="font-semibold text-zinc-200">For the person setting this up:</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>Create a Supabase project and run <code className="rounded bg-charcoal-800 px-1.5 py-0.5 text-zinc-200">supabase/schema.sql</code> in its SQL editor.</li>
          <li>Copy the project URL and anon key into <code className="rounded bg-charcoal-800 px-1.5 py-0.5 text-zinc-200">.env</code> as <code className="rounded bg-charcoal-800 px-1.5 py-0.5 text-zinc-200">VITE_SUPABASE_URL</code> and <code className="rounded bg-charcoal-800 px-1.5 py-0.5 text-zinc-200">VITE_SUPABASE_ANON_KEY</code>.</li>
          <li>Restart the app. See <code className="rounded bg-charcoal-800 px-1.5 py-0.5 text-zinc-200">README.md</code> for the full setup steps.</li>
        </ol>
      </div>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
      >
        ← Back to the website
      </Link>
    </div>
  )
}
