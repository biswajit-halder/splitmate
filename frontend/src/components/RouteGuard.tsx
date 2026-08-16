import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RouteGuard() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-md text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span className="font-body-md text-body-md">Loading…</span>
        </div>
      </div>
    )
  }

  if (status === 'anon') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
