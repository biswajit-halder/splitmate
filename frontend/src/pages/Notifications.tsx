import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { notificationsApi } from '../lib/api/notifications'
import { relativeTime } from '../lib/dates'
import { Skeleton, Button, Badge } from '../components/ui'
import { useToast } from '../components/ui'

export function NotificationsPage() {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useApi(() => notificationsApi.list())
  const { addToast } = useToast()
  const markAll = useMutation(() => notificationsApi.markAllRead())
  const markOne = useMutation((id: string) => notificationsApi.markRead(id))

  useEffect(() => {
    if (error) {
      addToast('Failed to load notifications', 'error')
    }
  }, [error, addToast])

  const handleAll = async () => {
    try {
      await markAll.mutate()
      addToast('All marked as read', 'success')
      refetch()
    } catch {
      addToast('Failed to mark all as read', 'error')
    }
  }

  const handleOne = async (id: string) => {
    try {
      await markOne.mutate(id)
      refetch()
    } catch {
      addToast('Failed to mark as read', 'error')
    }
  }

  const handleNotificationClick = (n: { id: string; type: string | null; refId: string | null }) => {
    if (n.type === 'expense' && n.refId) {
      navigate(`/expenses/${n.refId}`)
    } else if (n.type === 'group' && n.refId) {
      navigate(`/groups/${n.refId}`)
    } else if (n.type === 'settlement') {
      navigate('/settlements')
    }
  }

  const list = data?.notifications ?? []

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Notifications</h1>
          <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
            {data?.unread ?? 0} unread
          </p>
        </div>
        <Button variant="secondary" onClick={handleAll} disabled={!data?.unread}>Mark all read</Button>
      </div>

      {loading && <Skeleton height={200} />}

      <div className="flex flex-col gap-sm">
        {list.map(n => (
          <button
            key={n.id}
            onClick={() => handleNotificationClick(n)}
            className={`surface-card flex cursor-pointer items-start gap-md p-lg text-left transition-colors hover:bg-surface-container-low ${n.isRead ? '' : 'border-primary/30'}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
              <span className="material-symbols-outlined text-primary text-[18px]">notifications</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-sm">
                <p className="font-label-md text-label-md text-on-surface">{n.title}</p>
                {!n.isRead && <Badge variant="primary">new</Badge>}
              </div>
              {n.body && <p className="font-body-sm text-body-sm text-on-surface-variant">{n.body}</p>}
              <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">{relativeTime(n.createdAt)}</p>
            </div>
            {!n.isRead && (
              <Button variant="ghost" onClick={(e) => { e.stopPropagation(); handleOne(n.id) }}>Mark read</Button>
            )}
          </button>
        ))}
        {!loading && list.length === 0 && (
          <div className="bg-surface rounded-xl border border-line/40 p-xl text-center">
            <p className="font-headline-sm text-headline-sm text-on-surface">No notifications</p>
          </div>
        )}
      </div>
    </div>
  )
}
