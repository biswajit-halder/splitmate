import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { activityApi } from '../lib/api/activity'
import { formatMoney } from '../lib/money'
import { relativeTime } from '../lib/dates'
import { Skeleton, EmptyState } from '../components/ui'
import type { ActivityEvent } from '../lib/types'

const TYPE_META: Record<string, { icon: string; tint: string; label: string }> = {
  expense_added: { icon: 'receipt_long', tint: 'tint-coral', label: 'added an expense' },
  expense_edited: { icon: 'edit', tint: 'tint-saffron', label: 'edited an expense' },
  settlement_made: { icon: 'payments', tint: 'tint-mint', label: 'made a settlement' },
  settlement_received: { icon: 'payments', tint: 'tint-mint', label: 'received a settlement' },
  group_created: { icon: 'group', tint: 'tint-lilac', label: 'created a group' },
  group_joined: { icon: 'group_add', tint: 'tint-lilac', label: 'joined a group' },
  friend_added: { icon: 'person_add', tint: 'tint-saffron', label: 'added a friend' },
  friend_request: { icon: 'person_add', tint: 'tint-saffron', label: 'sent a friend request' },
}

type Filter = 'all' | 'expenses' | 'settlements' | 'groups' | 'friends'
const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Everything' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'settlements', label: 'Settlements' },
  { key: 'groups', label: 'Groups' },
  { key: 'friends', label: 'Friends' },
]
const ALLOWED: Record<Filter, string[]> = {
  all: [],
  expenses: ['expense_added', 'expense_edited'],
  settlements: ['settlement_made', 'settlement_received'],
  groups: ['group_created', 'group_joined'],
  friends: ['friend_added', 'friend_request'],
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'This week'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
}

export function ActivityPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const { data, loading } = useApi(() => activityApi.list({ limit: 60 }))
  const events = data?.events ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return events.filter(ev =>
      (filter === 'all' || ALLOWED[filter].includes(ev.type)) &&
      (!q || ev.actorName.toLowerCase().includes(q) || ev.type.replace(/_/g, ' ').includes(q))
    )
  }, [events, search, filter])

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>()
    for (const ev of filtered) {
      const key = dayLabel(ev.createdAt)
      map.set(key, [...(map.get(key) ?? []), ev])
    }
    return map
  }, [filtered])

  return (
    <div className="flex flex-col">
      <p className="micro-label mb-2">Your shared story</p>
      <h1 className="font-headline-lg text-on-surface">Activity</h1>
      <p className="mt-xs font-body-md text-on-surface-variant">Everything that happened across your circles.</p>

      <div className="mt-xl flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-sm">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1.5 font-label-sm transition-all ${
                filter === f.key ? 'tint-coral shadow-[0_0_18px_rgba(255,107,94,0.15)]' : 'glass-card text-on-surface-variant'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-56">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search activity…"
            className="h-10 w-full rounded-xl border border-line bg-surface-container-low/70 pl-10 pr-md font-body-sm outline-none backdrop-blur placeholder:text-on-surface-variant/60 focus:border-primary"
          />
        </div>
      </div>

      {loading && <div className="mt-xl flex flex-col gap-md"><Skeleton height={60} /><Skeleton height={60} /><Skeleton height={60} /></div>}

      <div className="timeline mt-xxl">
        {[...grouped.entries()].map(([day, items]) => (
          <div key={day}>
            <p className="eyebrow mb-md">{day}</p>
            {items.map(ev => {
              const meta = TYPE_META[ev.type] ?? { icon: 'bolt', tint: 'tint-lilac', label: 'did something' }
              const amount = ev.payload && typeof ev.payload === 'object' && 'amountPaise' in ev.payload
                ? Number((ev.payload as Record<string, unknown>).amountPaise)
                : null
              return (
                <button
                  key={ev.id}
                  onClick={() => ev.groupId && navigate(`/groups/${ev.groupId}`)}
                  className="timeline-dot relative mb-lg flex w-full items-center gap-md text-left"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.tint}`}>
                    <span className="material-symbols-outlined text-[19px]">{meta.icon}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-label-md text-on-surface">
                      <span className="font-semibold">{ev.actorName}</span>{' '}
                      <span className="font-normal text-on-surface-variant">{meta.label}</span>
                    </span>
                    <span className="block font-body-sm text-on-surface-variant">
                      {relativeTime(ev.createdAt)}
                    </span>
                  </span>
                  {amount !== null && !Number.isNaN(amount) && (
                    <span className="num font-label-md text-on-surface">{formatMoney(amount)}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <EmptyState icon="history" title="Nothing here yet" description="Try another filter — your activity will show up here." />
        )}
      </div>
    </div>
  )
}
