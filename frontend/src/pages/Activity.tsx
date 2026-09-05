import { useState, useMemo, useEffect, useRef } from 'react'
import { useApi } from '../hooks/useApi'
import { activityApi } from '../lib/api/activity'
import { formatMoney } from '../lib/money'
import { Skeleton, EmptyState, BlobAvatar } from '../components/ui'
import type { ActivityEvent } from '../lib/types'

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  expense_added: { icon: 'receipt_long', color: 'bg-primary/10 text-primary', label: 'added an expense' },
  expense_edited: { icon: 'edit', color: 'bg-primary/10 text-primary', label: 'edited an expense' },
  settlement_made: { icon: 'payments', color: 'bg-success/10 text-success', label: 'made a settlement' },
  settlement_received: { icon: 'payments', color: 'bg-success/10 text-success', label: 'received a settlement' },
  group_created: { icon: 'group', color: 'bg-tertiary/10 text-tertiary', label: 'created a group' },
  group_joined: { icon: 'group_add', color: 'bg-tertiary/10 text-tertiary', label: 'joined a group' },
  friend_added: { icon: 'person_add', color: 'bg-secondary/10 text-secondary', label: 'added a friend' },
  friend_request: { icon: 'person_add', color: 'bg-secondary/10 text-secondary', label: 'sent a friend request' },
}

type FilterCategory = 'all' | 'expenses' | 'settlements' | 'groups' | 'friends'

const CATEGORY_MAP: Record<FilterCategory, string[]> = {
  all: [],
  expenses: ['expense_added', 'expense_edited'],
  settlements: ['settlement_made', 'settlement_received'],
  groups: ['group_created', 'group_joined'],
  friends: ['friend_added', 'friend_request'],
}

const FILTER_OPTIONS: { key: FilterCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All Activity', icon: 'apps' },
  { key: 'expenses', label: 'Expenses', icon: 'receipt_long' },
  { key: 'settlements', label: 'Settlements', icon: 'payments' },
  { key: 'groups', label: 'Groups', icon: 'group' },
  { key: 'friends', label: 'Friends', icon: 'person_add' },
]

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function getDateGroup(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'TODAY'
  if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()
}

function groupEvents(events: ActivityEvent[]): Map<string, ActivityEvent[]> {
  const groups = new Map<string, ActivityEvent[]>()
  for (const ev of events) {
    const key = getDateGroup(ev.createdAt)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(ev)
  }
  return groups
}

export function ActivityPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<FilterCategory>('all')
  const [showFilter, setShowFilter] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const { data, loading } = useApi(() => activityApi.list({ limit: 50 }))
  const events = data?.events ?? []

  const filtered = useMemo(() => {
    let result = events
    if (filterType !== 'all') {
      const allowed = new Set(CATEGORY_MAP[filterType])
      result = result.filter(ev => allowed.has(ev.type))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(ev =>
        ev.actorName.toLowerCase().includes(q) ||
        ev.type.replace(/_/g, ' ').includes(q)
      )
    }
    return result
  }, [events, search, filterType])

  useEffect(() => {
    if (!showFilter) return
    const handleMouseDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [showFilter])

  const grouped = useMemo(() => groupEvents(filtered), [filtered])

  return (
    <div className="flex flex-col gap-xl max-w-content">
      {/* Header */}
      <div>
        <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Activity History</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">A chronological log of all actions across your groups.</p>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-md">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-md rounded-lg border border-line/40 bg-surface font-body-md text-body-md placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilter(prev => !prev)}
            className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-colors ${
              filterType !== 'all'
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-line/40 hover:bg-surface-container-low text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
          {showFilter && (
            <div className="absolute right-0 top-full mt-xs w-48 bg-surface rounded-lg border border-line/40 shadow-lg z-50 py-xs animate-in fade-in slide-in-from-top-1 duration-150">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setFilterType(opt.key)
                    setShowFilter(false)
                  }}
                  className={`w-full flex items-center gap-sm px-md py-sm text-left font-body-md text-body-md transition-colors ${
                    filterType === opt.key
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && <Skeleton height={200} />}

      {/* Grouped Activity */}
      {!loading && filtered.length === 0 && (
        <EmptyState icon="search_off" title="No activity found" description="Try adjusting your search or check back later." />
      )}

      {[...grouped.entries()].map(([label, items]) => (
        <div key={label} className="flex flex-col gap-md">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</p>
          <div className="flex flex-col gap-sm">
            {items.map(ev => {
              const meta = TYPE_META[ev.type] ?? { icon: 'info', color: 'bg-surface-container text-on-surface-variant', label: ev.type }
              const payload = ev.payload as Record<string, unknown> | null
              const amountPaise = payload?.amountPaise as number | undefined
              const description = payload?.description as string | undefined
              return (
                <div key={ev.id} className="bg-surface rounded-xl border border-line/40 p-lg flex items-start gap-md hover:bg-surface-container-low/50 transition-colors">
                  <BlobAvatar userId={ev.id} name={ev.actorName} size={40} />
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-md">
                    <div className="min-w-0">
                      <p className="font-label-md text-label-md text-on-surface">
                        <span className="font-semibold">{ev.actorName}</span>{' '}
                        <span className="text-on-surface-variant">{meta.label}</span>
                      </p>
                      {description && (
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">{description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-xs">
                      {amountPaise != null && amountPaise !== 0 && (
                        <span className={`font-label-md tabular-nums ${amountPaise > 0 ? 'text-primary' : 'text-error'}`}>
                          {amountPaise > 0 ? '+' : ''}{formatMoney(amountPaise)}
                        </span>
                      )}
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{formatTime(ev.createdAt)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Load More */}
      {!loading && filtered.length > 0 && (
        <div className="flex justify-center">
          <button className="px-lg py-md rounded-lg border border-line/40 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-xs">
            Load More
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>
        </div>
      )}
    </div>
  )
}
