import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { Button, BrandMark, PasswordInput } from '../components/ui'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('This reset link is missing its token.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset the password')
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
          <h1 className="font-headline-sm text-on-surface">Choose a new password</h1>
          <p className="mt-xs font-body-sm text-on-surface-variant">Use at least 8 characters.</p>

          {done ? (
            <p className="tint-mint mt-lg rounded-xl px-md py-sm font-body-sm">
              Password updated. Taking you back to sign in…
            </p>
          ) : (
            <form onSubmit={submit} className="mt-lg flex flex-col gap-lg">
              {error && <p className="tint-coral rounded-xl px-md py-sm font-body-sm">{error}</p>}
              <PasswordInput
                id="new-reset-password"
                label="New password"
                value={password}
                onChange={setPassword}
                placeholder="Enter a new password"
                showStrength
              />
              <Button type="submit" disabled={loading || password.length < 8}>
                {loading ? 'Updating…' : 'Update password'}
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
