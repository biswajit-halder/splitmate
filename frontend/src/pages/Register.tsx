import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { useToast } from '../components/ui'

const AVATAR_BG_OPTIONS = [
  'bg-primary-container',
  'bg-secondary-container',
  'bg-tertiary-container',
  'bg-error-container',
]

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

export function RegisterPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const { addToast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarBg, setAvatarBg] = useState(AVATAR_BG_OPTIONS[0])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const res = await authApi.register({ name, email, password, avatar_bg: avatarBg })
      setSession(res.token, res.user)
      addToast('Account created', 'success')
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details)
      } else {
        addToast(err instanceof Error ? err.message : 'Registration failed', 'error')
      }
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container overflow-hidden items-center justify-center px-xxl">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative z-10 w-full h-full max-h-[800px] rounded-card overflow-hidden shadow-level-2 bg-gradient-to-br from-primary-container via-primary to-surface-tint">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          <div className="absolute bottom-xl left-xl right-xl text-on-primary">
            <h2 className="font-headline-lg text-headline-lg mb-sm text-white">Split Smart, Stay Friends.</h2>
            <p className="font-body-lg text-body-lg text-white/80 max-w-md">
              Create your account and start tracking shared expenses in seconds.
            </p>
          </div>
          <div className="absolute top-xl left-xl flex items-center gap-md text-white">
            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-white">donut_small</span>
            </div>
            <span className="font-headline-md text-headline-md font-bold">SplitMate</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-md py-xl sm:px-xl relative bg-background">
        <div className="w-full max-w-[440px] flex flex-col z-10">
          <div className="mb-xl text-center flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-on-primary mb-md shadow-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>donut_small</span>
            </div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-background mb-xs tracking-tight">Create Account</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Start managing shared expenses.</p>
          </div>

          <div className="bg-surface-container-lowest rounded-card border border-outline-variant/30 p-xl shadow-ambient">
            <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
              <div className="flex flex-col gap-sm">
                <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="name">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-input border border-outline-variant/50 bg-transparent text-on-background placeholder:text-outline/60 font-body-md text-body-md focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all duration-200 outline-none"
                  />
                </div>
                {errors.name && <p className="font-label-sm text-label-sm text-error">{errors.name}</p>}
              </div>

              <div className="flex flex-col gap-sm">
                <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="email">Email</label>
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
                    className="w-full h-12 pl-11 pr-4 rounded-input border border-outline-variant/50 bg-transparent text-on-background placeholder:text-outline/60 font-body-md text-body-md focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all duration-200 outline-none"
                  />
                </div>
                {errors.email && <p className="font-label-sm text-label-sm text-error">{errors.email}</p>}
              </div>

              <div className="flex flex-col gap-sm">
                <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="password">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>lock</span>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-input border border-outline-variant/50 bg-transparent text-on-background placeholder:text-outline/60 font-body-md text-body-md focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all duration-200 outline-none"
                  />
                </div>
                {errors.password && <p className="font-label-sm text-label-sm text-error">{errors.password}</p>}
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Avatar Color</label>
                <div className="flex gap-sm">
                  {AVATAR_BG_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAvatarBg(opt)}
                      className={`w-9 h-9 rounded-full ${opt} ${avatarBg === opt ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                      aria-label={opt}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-sm">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-button shadow-sm hover:bg-surface-tint active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-sm disabled:opacity-70"
                >
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </div>
            </form>

            <div className="mt-lg mb-lg flex items-center text-center">
              <div className="flex-grow border-t border-outline-variant/30" />
              <span className="mx-md font-label-sm text-label-sm text-outline tracking-wide uppercase">Or</span>
              <div className="flex-grow border-t border-outline-variant/30" />
            </div>

            <button
              type="button"
              className="w-full h-12 bg-transparent border border-outline-variant/40 text-on-background font-label-md text-label-md font-medium rounded-button hover:bg-surface-container-low active:bg-surface-container transition-colors duration-200 flex items-center justify-center gap-md"
            >
              <GoogleIcon />
              Google Sign Up
            </button>
          </div>

          <div className="mt-lg text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="font-label-md text-label-md text-primary-container hover:text-on-primary-fixed-variant transition-colors font-semibold ml-1">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
