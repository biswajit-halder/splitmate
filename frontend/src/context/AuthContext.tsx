import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearToken, getToken, onUnauthorized, setToken } from '../lib/api/client'
import { usersApi } from '../lib/api/users'
import type { User } from '../lib/types'

type AuthStatus = 'loading' | 'authed' | 'anon'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  setSession: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setStatus('anon')
  }, [])

  // Bootstrap: if we have a token, validate it via /api/users/me.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setStatus('anon')
      return
    }
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
        clearToken()
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

  const setSession = useCallback((token: string, u: User) => {
    setToken(token)
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
