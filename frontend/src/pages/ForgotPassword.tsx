import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { Button, BrandMark } from '../components/ui'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.forgotPassword(email.trim())
      setSent(true)
      if (res.devToken) {
        setDevLink(`/reset-password?token=${encodeURIComponent(res.devToken)}`)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not request a reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mesh-bg flex min-h-screen items-center justify-center px-md py-xl">
      <div className="w-full max-w-md">
        <div className="mb-lg flex items-center justify-center gap-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[var(--accent-2)] glow-shadow">
            <BrandMark size={26} className="text-[#241016]" />
          </span>
          <span className="font-headline-md text-on-surface">SplitMate</span>
        </div>
        <div className="glass-card p-xl">
          <h1 className="font-headline-sm text-on-surface">Reset your password</h1>
          <p className="mt-xs font-body-sm text-on-surface-variant">
            Enter your email and we'll send you a link that's valid for 30 minutes.
          </p>

          {sent ? (
            <div className="mt-lg flex flex-col gap-lg">
              <p className="tint-mint rounded-xl px-md py-sm font-body-sm">
                If an account exists for that email, a reset link is on its way.
              </p>
              {devLink && (
                <Link to={devLink} className="font-label-md text-primary">
                  Dev mode: open the reset link →
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="mt-lg flex flex-col gap-lg">
              {error && <p className="tint-coral rounded-xl px-md py-sm font-body-sm">{error}</p>}
              <div className="flex flex-col gap-xs">
                <label className="micro-label" htmlFor="reset-email">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-line bg-surface-container-low/80 px-md font-body-md outline-none focus:border-primary"
                />
              </div>
              <Button type="submit" disabled={loading || !email.trim()}>
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          )}
          <Link to="/login" className="mt-lg block text-center font-body-sm text-on-surface-variant hover:text-primary">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
