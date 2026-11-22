import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { useToast, PasswordInput, AuthDivider, BrandMark } from '../components/ui'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fieldErrors: Record<string, string> = {}
    if (!email.trim()) fieldErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) fieldErrors.email = 'Enter a valid email'
    if (!password) fieldErrors.password = 'Password is required'
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email: email.trim(), password, remember: rememberMe })
      setSession(res.user)
      addToast(`Welcome back, ${res.user.name}`, 'success')
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setError(err.details.email ?? err.details.password ?? err.message)
      } else {
        setError(err instanceof Error ? err.message : 'Login failed')
      }
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* Left: brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-[#3A1830] via-primary/80 to-[#B69CFF] lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <div className="absolute left-xl top-xl flex items-center gap-md text-on-primary">
          <BrandMark size={34} />
          <span className="font-headline-md">SplitMate</span>
        </div>
        <div className="absolute bottom-xxxl left-xl right-xl text-on-primary">
          <p className="eyebrow mb-md !text-on-primary/70">Shared expenses, simplified</p>
          <h2 className="font-display-lg text-on-primary">Split the bill.<br />Keep the peace.</h2>
          <p className="mt-lg max-w-md font-body-lg text-on-primary/80">
            Track what you share, settle up in a tap, and keep every trip, home and night out
            delightfully hassle-free.
          </p>
        </div>
      </div>

      {/* Right: Form */}
        <div className="relative flex w-full flex-col items-center justify-center bg-background px-md py-xl sm:px-xl panel-pb lg:w-1/2">
        <div className="z-10 flex w-full max-w-[440px] flex-col">
          {/* Header */}
          <div className="mb-xl flex flex-col items-center text-center">
            <div className="mb-md flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#B69CFF] shadow-[0_0_26px_rgba(255,107,94,0.35)]">
              <BrandMark size={28} />
            </div>
            <h1 className="font-headline-lg text-on-surface">Welcome back</h1>
            <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
              Sign in to pick up where you left off.
            </p>
          </div>

          {/* Login Form Card */}
          <div className="surface-card p-xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
              {error && (
                <div className="rounded-md bg-error-container p-md font-body-md text-body-md text-on-error-container">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-sm">
                <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>mail</span>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-11 w-full rounded-lg border border-line bg-surface pl-11 pr-md font-body-md text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                {errors.email && <p className="font-label-sm text-label-sm text-error">{errors.email}</p>}
              </div>

              {/* Password */}
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={setPassword}
                error={errors.password}
              />

              {/* Options Row */}
              <div className="flex items-center justify-between pt-sm">
                <label className="flex items-center gap-sm cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="peer appearance-none w-4 h-4 rounded-[4px] border border-outline-variant/80 checked:bg-primary-container checked:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all cursor-pointer"
                    />
                    <span
                      className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-all duration-200"
                      style={{ fontSize: 14, left: 1, top: 1, fontVariationSettings: "'FILL' 1" }}
                    >
                      check
                    </span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-background transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="font-label-md text-primary transition-opacity hover:opacity-70"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <div className="pt-sm">
                <button
                  type="submit"
                  disabled={loading}
                  className="pressable flex h-11 w-full items-center justify-center gap-sm rounded-xl bg-gradient-to-br from-primary to-[#FF8E63] font-label-md text-on-primary shadow-[0_8px_28px_rgba(255,107,94,0.35)] transition-all disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>

            {/* Divider */}
            <AuthDivider text="Or continue with" />

            {/* Google Login */}
            <button
              type="button"
              disabled
              title="Coming soon"
              className="w-full h-12 bg-transparent border border-outline-variant/40 text-on-background font-label-md text-label-md font-medium rounded-lg flex items-center justify-center gap-md opacity-50 cursor-not-allowed"
            >
              <GoogleIcon />
              Google Login
            </button>
          </div>

          {/* Footer Link */}
          <div className="mt-lg text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-label-md text-label-md text-primary hover:text-primary/80 transition-colors font-semibold ml-1"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="footer-pin w-full flex justify-center gap-lg">
          <Link
            to="/terms"
            className="font-label-sm text-label-sm text-outline hover:text-on-surface-variant transition-colors"
          >
            Terms
          </Link>
          <span className="text-outline/40">•</span>
          <Link
            to="/privacy"
            className="font-label-sm text-label-sm text-outline hover:text-on-surface-variant transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
