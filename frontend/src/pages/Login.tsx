import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../components/ui'

const DEMO_USER = {
  email: 'demo@splitmate.app',
  password: 'demo1234',
  name: 'Alex Morgan',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState(DEMO_USER.email)
  const [password, setPassword] = useState(DEMO_USER.password)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    window.setTimeout(() => {
      if (email.trim() === '' || password.trim() === '') {
        setError('Please enter your email and password.')
        setLoading(false)
        return
      }
      setLoading(false)
      navigate('/dashboard')
    }, 400)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-lg">
      <div className="w-full max-w-md">
        <div className="text-center mb-xxl">
          <span className="material-symbols-outlined text-primary-container text-5xl mb-lg">account_balance</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">SplitMate</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">Expense Tracking, Elevated.</p>
          <p className="font-body-md text-body-md text-on-surface-variant">Effortlessly manage shared costs and settle up with precision.</p>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface p-xl shadow-level-1">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-lg">Welcome back</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-xl">Please enter your details.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            {error && (
              <div className="rounded-md bg-error-container p-md font-body-md text-body-md text-on-error-container">{error}</div>
            )}
            <Input label="Email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-sm">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-outline text-primary focus:ring-primary" />
                <span className="font-label-md text-label-md text-on-surface-variant">Remember me</span>
              </label>
              <Link to="/forgot-password" className="font-label-md text-label-md text-primary hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Signing in...' : 'Sign In'}</Button>
            <div className="relative my-md">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant" /></div>
              <div className="relative flex justify-center"><span className="bg-surface px-md font-label-md text-label-md text-on-surface-variant">Or continue with</span></div>
            </div>
            <Button variant="secondary" className="w-full" type="button">
              <span className="material-symbols-outlined mr-md text-xl">g_mobiledata</span>Google Login
            </Button>
          </form>
        </div>
        <p className="mt-lg text-center font-body-md text-body-md text-on-surface-variant">Don't have an account? <Link to="/register" className="font-label-md text-label-md text-primary hover:underline">Create Account</Link></p>
        <div className="mt-xl flex justify-center gap-lg font-label-sm text-label-sm text-outline">
          <Link to="/terms" className="hover:text-on-surface-variant">Terms</Link><span>•</span><Link to="/privacy" className="hover:text-on-surface-variant">Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}
