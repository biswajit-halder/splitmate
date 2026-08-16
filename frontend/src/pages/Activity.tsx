import { useApi } from '../hooks/useApi'
import { activityApi } from '../lib/api/activity'
import { Skeleton } from '../components/ui'
import type { ActivityType } from '../lib/types'

const TYPE_META: Record<ActivityType, { icon: string; color: string; label: string }> = {
  expense_added: { icon: 'receipt_long', color: 'bg-primary/10 text-primary', label: 'added an expense' },
  expense_edited: { icon: 'edit', color: 'bg-primary/10 text-primary', label: 'edited an expense' },
  settlement_made: { icon: 'payments', color: 'bg-success/10 text-success', label: 'made a settlement' },
  settlement_received: { icon: 'payments', color: 'bg-success/10 text-success', label: 'received a settlement' },
  group_created: { icon: 'group', color: 'bg-tertiary-container/40 text-on-tertiary-container', label: 'created a group' },
  group_joined: { icon: 'group_add', color: 'bg-tertiary-container/40 text-on-tertiary-container', label: 'joined a group' },
  friend_added: { icon: 'person_add', color: 'bg-secondary-container/40 text-on-secondary-container', label: 'added a friend' },
  friend_request: { icon: 'person_add', color: 'bg-secondary-container/40 text-on-secondary-container', label: 'sent a friend request' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function ActivityPage() {
  const { data, loading } = useApi(() => activityApi.list({ limit: 50 }))
  const events = data?.events ?? []

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <div>
        <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Activity</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Everything happening across your groups.</p>
      </div>

      {loading && <Skeleton height={200} />}

      <div className="flex flex-col gap-sm">
        {events.map(ev => {
          const meta = TYPE_META[ev.type]
          return (
            <div key={ev.id} className="flex items-center gap-md p-md rounded-lg bg-surface border border-outline-variant/20">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
                <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-label-md text-label-md text-on-surface">
                  <span className="font-semibold">{ev.actorName}</span> {meta.label}
                </p>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant shrink-0">{timeAgo(ev.createdAt)}</span>
            </div>
          )
        })}
        {!loading && events.length === 0 && (
          <div className="bg-surface rounded-xl border border-outline-variant/20 p-xl text-center">
            <p className="font-headline-sm text-headline-sm text-on-surface">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
