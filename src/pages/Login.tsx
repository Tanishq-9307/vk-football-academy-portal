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
    <div className="relative mx-auto flex min-h-[78vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(60% 45% at 50% 0%, rgba(227,6,19,0.22) 0%, transparent 65%), radial-gradient(40% 35% at 50% 100%, rgba(212,175,55,0.10) 0%, transparent 60%)',
        }}
      />
      <div className="flex justify-center">
        <div className="animate-float-slow">
          <Logo size={72} />
        </div>
      </div>
      <p className="eyebrow mt-7 justify-center text-center">VKFA Portal</p>
      <h1 className="font-display mt-3 text-center text-4xl font-semibold tracking-wide text-white uppercase">
        Coach &amp; Admin Login
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-400">
        Sign in with the account the academy created for you.
      </p>

      <form
        onSubmit={handleSubmit}
        className="card-gold relative mt-8 overflow-hidden p-6 sm:p-7"
      >
        <span
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 to-gold-400"
          aria-hidden="true"
        />
        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}
        <label className="block">
          <span className="field-label">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="field"
          />
        </label>
        <label className="mt-5 block">
          <span className="field-label">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="field"
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
