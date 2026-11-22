import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { balancesApi } from '../lib/api/balances'
import { groupsApi } from '../lib/api/groups'
import { activityApi } from '../lib/api/activity'
import { analyticsApi } from '../lib/api/analytics'
import { formatMoney } from '../lib/money'
import { relativeTime } from '../lib/dates'
import { Skeleton, EmptyState, Sparkline } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import type { ActivityEvent, Group } from '../lib/types'

function activityLabel(type: ActivityEvent['type']): string {
  switch (type) {
    case 'expense_added': return 'added an expense'
    case 'expense_edited': return 'edited an expense'
    case 'settlement_made': return 'made a settlement'
    case 'settlement_received': return 'received a settlement'
    case 'group_created': return 'created a group'
    case 'group_joined': return 'joined a group'
    case 'friend_added': return 'added a friend'
    case 'friend_request': return 'sent a friend request'
    default: return 'performed an action'
  }
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const days = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'This week'
  return 'Earlier'
}

function coverStyle(group: Group): { className: string; icon: string; label: string } {
  switch (group.type) {
    case 'trip': return { className: 'cover-coral', icon: 'flight', label: 'trip' }
    case 'home': return { className: 'cover-lilac', icon: 'home', label: 'home' }
    case 'food': return { className: 'cover-mint', icon: 'restaurant', label: 'food' }
    case 'social': return { className: 'cover-lilac', icon: 'group', label: 'social' }
    case 'office': return { className: 'cover-mint', icon: 'business', label: 'office' }
    default: return { className: 'cover-lilac', icon: 'group', label: 'group' }
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const balances = useApi(() => balancesApi.all())
  const groups = useApi(() => groupsApi.list())
  const activity = useApi(() => activityApi.list({ limit: 8 }))
  const sixMonths = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
  }, [])
  const trend = useApi(() => Promise.all(sixMonths.map(m => analyticsApi.monthly(m))), [sixMonths])
  const firstName = user?.name.split(/\s+/)[0] ?? 'there'
  const openGroups = (balances.data?.groups ?? []).filter(g => g.netPaise !== 0).length

  if (balances.loading && activity.loading) {
    return <div className="flex flex-col gap-lg"><Skeleton height={60} /><Skeleton height={160} /><Skeleton height={200} /></div>
  }

  const events = activity.data?.events ?? []
  const grouped = events.reduce<Record<string, ActivityEvent[]>>((acc, ev) => {
    const label = dayLabel(ev.createdAt)
    ;(acc[label] ??= []).push(ev)
    return acc
  }, {})
  const dayOrder = ['Today', 'Yesterday', 'This week', 'Earlier']
  const counterparties = (balances.data?.counterparties ?? []).slice(0, 3)
  const settledPaise = balances.data?.settledPaise ?? 0
  const outstandingPaise = (balances.data?.owedPaise ?? 0) + (balances.data?.owePaise ?? 0)
  const settleProgress = settledPaise + outstandingPaise > 0
    ? Math.round((settledPaise / (settledPaise + outstandingPaise)) * 100)
    : 0
  const gaugeOffset = 251.2 - (251.2 * settleProgress) / 100

  return (
    <div className="flex flex-col">
      {/* Statement header */}
      <div className="pt-sm">
        <p className="micro-label mb-2">{greeting()}</p>
        <h1 className="font-headline-lg text-on-surface">
          Hey {firstName}, <span className="italic text-primary">{openGroups || 'no'} {openGroups === 1 ? 'circle' : 'circles'}</span> need you.
        </h1>
      </div>

      {/* Pulse strip — no card, with 6-month sparklines */}
      <div className="mt-lg flex flex-wrap items-end gap-lg md:gap-xl">
        <div>
          <p className="num font-display-lg text-display-lg accent-text glow-coral">{formatMoney(balances.data?.netPaise ?? 0)}</p>
          <p className="eyebrow mt-2">Net position</p>
          <Sparkline data={trend.data?.map(m => m.totalPaise) ?? []} className="mt-sm h-6 w-28" />
        </div>
        <div className="hidden h-14 w-px bg-line sm:block" />
        <div>
          <p className="num font-headline-md text-secondary glow-mint">{formatMoney(balances.data?.owedPaise ?? 0)}</p>
          <p className="eyebrow mt-1">Coming to you</p>
          <Sparkline data={trend.data?.map(m => m.settledPaise) ?? []} color="#5FE0C0" className="mt-sm h-6 w-28" />
        </div>
        <div className="hidden h-14 w-px bg-line sm:block" />
        <div>
          <p className="num font-headline-md text-primary glow-coral">{formatMoney(balances.data?.owePaise ?? 0)}</p>
          <p className="eyebrow mt-1">Going out</p>
          <Sparkline data={trend.data?.map(m => m.totalPaise - m.settledPaise) ?? []} className="mt-sm h-6 w-28" />
        </div>
      </div>

      {/* Circle covers */}
      <div className="mt-xxl flex items-baseline justify-between">
        <h2 className="font-headline-sm text-on-surface">Your circles</h2>
        <button onClick={() => navigate('/groups')} className="font-label-md text-primary hover:opacity-70 transition-opacity">
          View all →
        </button>
      </div>
      {groups.loading && <Skeleton height={180} />}
      <div className="mt-md grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
        {(groups.data ?? []).slice(0, 3).map((group, index) => {
          const style = coverStyle(group)
          const balance = group.balancePaise ?? 0
          return (
            <button
              key={group.id}
              onClick={() => navigate(`/groups/${group.id}`)}
              className={`pressable relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl p-lg text-left ${style.className} ${index === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{style.icon}</span>
              <div>
                <p className="font-headline-sm truncate">{group.name}</p>
                <div className="mt-sm flex items-end justify-between gap-sm">
                  <div>
                    <p className="text-[11px] opacity-75">{group.memberCount} people · {style.label}</p>
                    <p className="num mt-1 font-headline-md">{formatMoney(balance)}</p>
                  </div>
                  <div className="flex -space-x-2">
                    {(group.members ?? []).slice(0, 4).map((m, i) => (
                      <span
                        key={i}
                        className="h-5 w-5 rounded-full border-2 border-white/70 bg-black/25"
                        title={m.initials}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
        {(groups.data?.length ?? 0) === 0 && !groups.loading && (
          <EmptyState icon="group_add" title="No circles yet" description="Create a group to start sharing expenses."
            action={{ label: 'Create group', onClick: () => navigate('/groups?new=1') }} />
        )}
      </div>

      {/* Lately + settle board */}
      <div className="mt-xxl grid grid-cols-1 gap-xl lg:grid-cols-[1.35fr_1fr]">
        <div>
          <h2 className="font-headline-sm text-on-surface">Lately</h2>
          <p className="micro-label mt-1">Your shared story</p>
          <div className="timeline mt-lg">
            {dayOrder.map(day => (grouped[day] ?? []).length > 0 && (
              <div key={day}>
                <p className="eyebrow mb-sm mt-md">{day}</p>
                {(grouped[day] ?? []).map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => ev.groupId && navigate(`/groups/${ev.groupId}`)}
                    className="timeline-dot relative mb-lg block w-full text-left"
                  >
                    <p className="font-label-md text-on-surface">
                      <span className="font-semibold">{ev.actorName}</span>{' '}
                      <span className="font-normal text-on-surface-variant">{activityLabel(ev.type)}</span>
                    </p>
                    <p className="font-body-sm text-on-surface-variant">
                      {relativeTime(ev.createdAt)}{ev.payload && typeof ev.payload === 'object' && 'description' in ev.payload
                        ? ` · ${String((ev.payload as Record<string, unknown>).description)}`
                        : ''}
                    </p>
                  </button>
                ))}
              </div>
            ))}
            {events.length === 0 && !activity.loading && (
              <p className="font-body-md text-on-surface-variant">Nothing yet — your activity will appear here.</p>
            )}
          </div>
        </div>

        <div className="border-l border-line pl-lg lg:pl-xl">
          <h2 className="font-headline-sm text-on-surface">Settle up</h2>
          <p className="micro-label mt-1">Who owes whom</p>
          <div className="mt-lg flex items-center gap-md">
            <svg viewBox="0 0 100 100" className="h-20 w-20 -rotate-90" aria-hidden="true">
              <circle cx="50" cy="50" r="40" stroke="var(--color-surface-container-highest)" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="40" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
                fill="none" strokeDasharray="251.2" strokeDashoffset={gaugeOffset}
                className="transition-all duration-500"
              />
            </svg>
            <div>
              <p className="num font-headline-md accent-text">{settleProgress}%</p>
              <p className="micro-label">settled this month</p>
            </div>
          </div>
          <div className="mt-lg flex flex-col">
            {counterparties.map(c => {
              const theyOweMe = c.netPaise > 0
              return (
                <button
                  key={c.userId}
                  onClick={() => navigate('/settlements')}
                  className="flex items-center gap-md border-b border-line/70 py-md text-left transition-colors hover:text-primary"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-label-sm ${theyOweMe ? 'tint-mint' : 'tint-coral'}`}>
                    {c.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                  <span className="flex-1 truncate font-body-sm text-on-surface-variant">
                    {theyOweMe ? `${c.name} → You` : `You → ${c.name}`}
                  </span>
                  <span className={`num font-headline-sm ${theyOweMe ? 'text-secondary glow-mint' : 'text-primary glow-coral'}`}>
                    {formatMoney(Math.abs(c.netPaise))}
                  </span>
                </button>
              )
            })}
            {counterparties.length === 0 && (
              <p className="py-lg font-body-md text-on-surface-variant">Everyone's square. Nice work.</p>
            )}
            <button
              onClick={() => navigate('/settlements')}
              className="tint-mint pressable mt-lg w-full rounded-xl py-3 font-label-md"
            >
              ↗ &nbsp; Record a payment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
