import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import Logo from '../components/Logo'
import { ErrorBanner, PrimaryButton } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import NotConfigured from './NotConfigured'

export default function Login() {
  const { configured, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!configured) return <NotConfigured />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setBusy(true)
    const { error: signInError } = await signIn(email.trim(), password)
    setBusy(false)
    if (signInError) {
      setError(signInError)
      return
    }
    navigate('/portal', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="flex justify-center">
        <Logo size={64} />
      </div>
      <h1 className="font-display mt-6 text-center text-3xl font-semibold tracking-wide text-white uppercase">
        Coach &amp; Admin Login
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-400">
        Sign in with the account the academy created for you.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 stadium-card p-6"
      >
        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}
        <label className="block">
          <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-2 w-full rounded-xl border border-charcoal-600 bg-charcoal-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none"
          />
        </label>
        <PrimaryButton
          type="submit"
          disabled={busy || loading}
          className="mt-6 w-full"
        >
          <LogIn className="h-4 w-4" />
          {busy ? 'Signing in…' : 'Sign in'}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm leading-relaxed text-zinc-500">
        No account yet? Accounts are created by the academy admin — ask them to
        set one up and link it to your coach record.
      </p>
      <p className="mt-3 text-center text-sm">
        <Link to="/" className="font-semibold text-brand-400 hover:text-brand-300">
          ← Back to the website
        </Link>
      </p>
    </div>
  )
}
