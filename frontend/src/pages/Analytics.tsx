import { useMemo, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { analyticsApi } from '../lib/api/analytics'
import { formatMoney } from '../lib/money'
import { formatMonth } from '../lib/dates'
import { Button, Skeleton } from '../components/ui'

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function AnalyticsPage() {
  const defaults = useMemo(() => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    return { from: monthKey(from), to: monthKey(now) }
  }, [])
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)

  const trend = useApi(() => analyticsApi.trend(24, from, to), [from, to])
  const balance = useApi(() => analyticsApi.balanceHistory(24), [])
  const breakdown = useApi(() => analyticsApi.breakdown(), [])

  const months = trend.data?.months ?? []
  const spend = months.map(m => m.totalPaise)
  const settled = months.map(m => m.settledPaise)
  const maxSpend = Math.max(1, ...spend)
  const current = months[months.length - 1]
  const cats = breakdown.data?.byCategory ?? []
  const catMax = Math.max(1, ...cats.map(c => c.totalPaise))
  const groups = breakdown.data?.byGroup ?? []
  const largest = breakdown.data?.largestExpenses ?? []

  const balancePoints = balance.data?.months ?? []
  const balanceMax = Math.max(1, ...balancePoints.map(m => Math.abs(m.netPaise)))
  const balanceLine = balancePoints
    .map((m, i) => {
      const x = balancePoints.length === 1 ? 50 : (i / (balancePoints.length - 1)) * 100
      const y = 60 - ((m.netPaise + balanceMax) / (2 * balanceMax)) * 50
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const setPreset = (count: number) => {
    const now = new Date()
    setFrom(monthKey(new Date(now.getFullYear(), now.getMonth() - (count - 1), 1)))
    setTo(monthKey(now))
  }

  return (
    <div className="flex flex-col">
      <p className="micro-label mb-2">Insights</p>
      <h1 className="font-headline-lg text-on-surface">Where it went</h1>
      <p className="mt-xs font-body-md text-on-surface-variant">Shared spending and your position over time.</p>

      {/* Range controls */}
      <div className="mt-lg flex flex-wrap items-end gap-md">
        <div className="flex flex-col gap-xs">
          <label className="micro-label" htmlFor="from-month">From</label>
          <input id="from-month" type="month" value={from} onChange={e => setFrom(e.target.value)}
            className="h-10 rounded-xl border border-line bg-surface px-md font-body-sm text-on-surface outline-none focus:border-primary" />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="micro-label" htmlFor="to-month">To</label>
          <input id="to-month" type="month" value={to} onChange={e => setTo(e.target.value)}
            className="h-10 rounded-xl border border-line bg-surface px-md font-body-sm text-on-surface outline-none focus:border-primary" />
        </div>
        <div className="flex gap-sm">
          {[3, 6, 12].map(n => (
            <Button key={n} variant="secondary" onClick={() => setPreset(n)} className="h-10 px-md">{n}m</Button>
          ))}
        </div>
      </div>

      {/* Centrepiece chart */}
      <div className="glass-card relative mt-xl overflow-hidden p-xl md:p-xxl">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-mesh" />
        <div className="relative flex flex-wrap items-end justify-between gap-lg">
          <div>
            <p className="micro-label">{current ? formatMonth(current.month) : 'This month'}</p>
            <p className="num mt-2 font-display-lg text-display-lg glow-coral">
              {trend.loading ? '…' : formatMoney(current?.totalPaise ?? 0)}
            </p>
            <p className="mt-sm font-body-sm text-on-surface-variant">
              <span className="text-secondary">{formatMoney(current?.settledPaise ?? 0)}</span> settled ·
              <span className="text-primary"> {formatMoney((current?.totalPaise ?? 0) - (current?.settledPaise ?? 0))}</span> open
            </p>
          </div>
          <div className="flex gap-lg">
            <span className="flex items-center gap-xs font-label-sm text-on-surface-variant"><i className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" /> Spent</span>
            <span className="flex items-center gap-xs font-label-sm text-on-surface-variant"><i className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_10px_var(--color-secondary)]" /> Settled</span>
          </div>
        </div>

        {trend.loading ? <Skeleton height={200} /> : (
          <div className="relative mt-xl flex h-56 items-end gap-sm md:gap-md">
            <div className="absolute inset-x-0 top-0 h-px bg-line" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-line/50" />
            {months.map(m => (
              <div key={m.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-sm">
                <div className="relative flex w-full flex-1 items-end justify-center gap-1">
                  <div
                    className="w-1/2 max-w-12 rounded-t-lg bg-gradient-to-t from-primary/30 to-primary shadow-[0_0_22px_rgba(255,107,94,0.25)] transition-all duration-500 group-hover:from-primary/50"
                    style={{ height: `${Math.max(4, ((spend[months.indexOf(m)] ?? 0) / maxSpend) * 100)}%` }}
                  />
                  <div
                    className="w-1/2 max-w-12 rounded-t-lg bg-gradient-to-t from-secondary/25 to-secondary shadow-[0_0_18px_rgba(95,224,192,0.2)] transition-all duration-500"
                    style={{ height: `${Math.max(2, ((settled[months.indexOf(m)] ?? 0) / maxSpend) * 100)}%` }}
                  />
                </div>
                <span className="font-label-sm text-on-surface-variant">{new Date(`${m.month}-01`).toLocaleString('en-IN', { month: 'short' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Balance over time */}
      <div className="glass-card mt-xl p-xl md:p-xxl">
        <div className="flex flex-wrap items-end justify-between gap-md">
          <div>
            <h2 className="font-headline-sm text-on-surface">Your position over time</h2>
            <p className="mt-xs font-body-sm text-on-surface-variant">Net balance at the end of each month</p>
          </div>
          <p className={`num font-headline-md ${(balancePoints[balancePoints.length - 1]?.netPaise ?? 0) >= 0 ? 'text-secondary glow-mint' : 'text-primary glow-coral'}`}>
            {formatMoney(balancePoints[balancePoints.length - 1]?.netPaise ?? 0)}
          </p>
        </div>
        {balance.loading ? <Skeleton height={160} /> : balanceLine ? (
          <svg viewBox="0 0 100 70" preserveAspectRatio="none" className="mt-lg h-44 w-full">
            <defs>
              <linearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="35" x2="100" y2="35" stroke="var(--color-line)" strokeWidth="0.3" />
            <polygon points={`0,70 ${balanceLine} 100,70`} fill="url(#balance-fill)" />
            <polyline points={balanceLine} fill="none" stroke="var(--color-primary)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
          </svg>
        ) : (
          <p className="mt-lg font-body-md text-on-surface-variant">No history yet.</p>
        )}
      </div>

      <div className="mt-xl grid grid-cols-1 gap-xl lg:grid-cols-2">
        <div>
          <h2 className="font-headline-sm text-on-surface">By category</h2>
          <div className="mt-lg flex flex-col gap-lg">
            {cats.map((c, i) => (
              <div key={c.category}>
                <div className="flex items-baseline justify-between">
                  <span className="font-label-md capitalize text-on-surface">{c.category}</span>
                  <span className="num font-label-md text-on-surface-variant">{formatMoney(c.totalPaise)}</span>
                </div>
                <div className="mt-sm h-2 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className={`h-full rounded-full ${i % 3 === 0 ? 'bg-gradient-to-r from-primary/50 to-primary shadow-[0_0_16px_rgba(255,107,94,0.35)]' : i % 3 === 1 ? 'bg-gradient-to-r from-secondary/50 to-secondary' : 'bg-gradient-to-r from-tertiary/50 to-tertiary'}`}
                    style={{ width: `${(c.totalPaise / catMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {cats.length === 0 && <p className="font-body-md text-on-surface-variant">No data yet.</p>}
          </div>
        </div>

        <div>
          <h2 className="font-headline-sm text-on-surface">By circle</h2>
          <div className="mt-lg flex flex-col">
            {groups.map(g => (
              <div key={g.groupId} className="flex items-center justify-between border-b border-line/70 py-md">
                <span className="font-label-md text-on-surface">{g.groupName}</span>
                <span className="num font-label-md text-secondary">{formatMoney(g.totalPaise)}</span>
              </div>
            ))}
            {groups.length === 0 && <p className="font-body-md text-on-surface-variant">No data yet.</p>}
          </div>
        </div>
      </div>

      {largest.length > 0 && (
        <div className="mt-xxl">
          <h2 className="font-headline-sm text-on-surface">Biggest entries</h2>
          <div className="mt-lg flex flex-col">
            {largest.map(e => (
              <div key={e.id} className="flex items-center justify-between border-b border-line/70 py-md">
                <div className="min-w-0">
                  <p className="truncate font-label-md text-on-surface">{e.description}</p>
                  <p className="font-body-sm text-on-surface-variant">paid by {e.paidByName}</p>
                </div>
                <span className="num font-label-md text-primary">{formatMoney(e.amountPaise)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
