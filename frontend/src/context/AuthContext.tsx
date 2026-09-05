import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { onUnauthorized } from '../lib/api/client'
import { authApi } from '../lib/api/auth'
import { usersApi } from '../lib/api/users'
import type { User } from '../lib/types'

type AuthStatus = 'loading' | 'authed' | 'anon'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  setSession: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)

  const logout = useCallback(() => {
    // Clear the backend session cookie (fire-and-forget).
    authApi.logout().catch(() => {})
    setUser(null)
    setStatus('anon')
  }, [])

  // Bootstrap: probe the session via /api/users/me (cookie is sent automatically).
  useEffect(() => {
    let active = true
    usersApi
      .me()
      .then((u) => {
        if (!active) return
        setUser(u)
        setStatus('authed')
      })
      .catch(() => {
        if (!active) return
        setStatus('anon')
      })
    return () => {
      active = false
    }
  }, [])

  // Global 401 handler -> drop session and bounce to login.
  useEffect(() => {
    onUnauthorized(() => {
      logout()
      navigate('/login', { replace: true })
    })
  }, [logout, navigate])

  const setSession = useCallback((u: User) => {
    setUser(u)
    setStatus('authed')
  }, [])

  return (
    <AuthContext.Provider value={{ status, user, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
