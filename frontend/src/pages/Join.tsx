import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { groupsApi } from '../lib/api/groups'
import { useAuth } from '../context/AuthContext'
import { BrandMark, Button, Skeleton } from '../components/ui'

export function JoinPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { status } = useAuth()
  const token = params.get('token')
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    if (!token || status !== 'authed' || joined) return
    let cancelled = false
    groupsApi.joinByLink(token)
      .then(res => {
        if (!cancelled) {
          setJoined(true)
          navigate(`/groups/${res.groupId}`, { replace: true })
        }
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not join this group')
      })
    return () => { cancelled = true }
  }, [token, status, joined, navigate])

  return (
    <div className="mesh-bg flex min-h-screen items-center justify-center px-md py-xl">
      <div className="glass-card w-full max-w-md p-xl text-center">
        <div className="mx-auto mb-lg flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[var(--accent-2)] glow-shadow">
          <BrandMark size={28} className="text-[#241016]" />
        </div>
        <h1 className="font-headline-sm text-on-surface">Join a group</h1>
        {!token ? (
          <p className="mt-md font-body-md text-on-surface-variant">This invite link is missing its token.</p>
        ) : status === 'loading' || (status === 'authed' && !error) ? (
          <div className="mt-lg flex justify-center"><Skeleton width={160} height={32} /></div>
        ) : error ? (
          <p className="tint-coral mt-md rounded-xl px-md py-sm font-body-md">{error}</p>
        ) : (
          <div className="mt-lg flex flex-col gap-lg">
            <p className="font-body-md text-on-surface-variant">Sign in to join this group.</p>
            <Link to={`/login?next=${encodeURIComponent(`/join?token=${token}`)}`}>
              <Button className="w-full">Sign in to continue</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
