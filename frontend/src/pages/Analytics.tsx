import { useApi } from '../hooks/useApi'
import { analyticsApi } from '../lib/api/analytics'
import { formatMoney } from '../lib/money'
import { Skeleton, Card } from '../components/ui'

function lastMonths(count: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

const monthShort = (ym: string) => new Date(`${ym}-01`).toLocaleString('en-US', { month: 'short' })

export function AnalyticsPage() {
  const months = lastMonths(6)
  const trend = useApi(() => Promise.all(months.map(m => analyticsApi.monthly(m))))
  const breakdown = useApi(() => analyticsApi.breakdown())

  const spend = (trend.data ?? []).map(m => m.totalPaise)
  const maxSpend = Math.max(1, ...spend)
  const thisMonth = trend.data?.[trend.data.length - 1]
  const cats = breakdown.data?.byCategory ?? []
  const catMax = Math.max(1, ...cats.map(c => c.totalPaise))
  const groups = breakdown.data?.byGroup ?? []
  const largest = breakdown.data?.largestExpenses ?? []

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <div>
        <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Analytics</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Insights into your spending.</p>
      </div>

      <div className="grid grid-cols-1 gap-lg sm:grid-cols-3">
        <Card>
          <p className="font-label-sm text-label-sm text-on-surface-variant">This Month</p>
          <p className="font-headline-sm text-headline-sm text-on-surface">{trend.loading ? '…' : formatMoney(thisMonth?.totalPaise ?? 0)}</p>
        </Card>
        <Card>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Settled</p>
          <p className="font-headline-sm text-headline-sm text-primary">{trend.loading ? '…' : formatMoney(thisMonth?.settledPaise ?? 0)}</p>
        </Card>
        <Card>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Unsettled</p>
          <p className="font-headline-sm text-headline-sm text-error">
            {trend.loading ? '…' : formatMoney((thisMonth?.totalPaise ?? 0) - (thisMonth?.settledPaise ?? 0))}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">6-Month Trend</h3>
        {trend.loading ? <Skeleton height={160} /> : (
          <div className="flex gap-md h-44">
            <div className="flex-1 flex items-end justify-between gap-xs border-b border-line/40 pb-xs">
              {months.map((m, i) => (
                <div
                  key={m}
                  className="flex-1 bg-primary/20 rounded-t hover:bg-primary/40 transition-colors"
                  style={{ height: `${((spend[i] ?? 0) / maxSpend) * 100}%` }}
                  title={`${monthShort(m)}: ${formatMoney(spend[i] ?? 0)}`}
                />
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-between mt-xs">
          {months.map(m => (
            <span key={m} className="font-label-sm text-label-sm text-on-surface-variant">{monthShort(m)}</span>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <Card>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">By Category</h3>
          <div className="flex flex-col gap-md">
            {cats.map(c => (
              <div key={c.category}>
                <div className="flex justify-between mb-xs">
                  <span className="font-label-md text-label-md text-on-surface">{c.category}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">{formatMoney(c.totalPaise)}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(c.totalPaise / catMax) * 100}%` }} />
                </div>
              </div>
            ))}
            {cats.length === 0 && <p className="font-body-sm text-body-sm text-on-surface-variant">No data yet.</p>}
          </div>
        </Card>

        <Card>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">By Group</h3>
          <div className="flex flex-col gap-sm">
            {groups.map(g => (
              <div key={g.groupId} className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
                <span className="font-label-md text-label-md text-on-surface">{g.groupName}</span>
                <span className="font-label-md text-label-md text-on-surface">{formatMoney(g.totalPaise)}</span>
              </div>
            ))}
            {groups.length === 0 && <p className="font-body-sm text-body-sm text-on-surface-variant">No data yet.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Largest Expenses</h3>
        <div className="flex flex-col gap-sm">
          {largest.map(e => (
            <div key={e.id} className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
              <div>
                <p className="font-label-md text-label-md text-on-surface">{e.description}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">paid by {e.paidByName}</p>
              </div>
              <span className="font-label-md text-label-md text-on-surface">{formatMoney(e.amountPaise)}</span>
            </div>
          ))}
          {largest.length === 0 && <p className="font-body-sm text-body-sm text-on-surface-variant">No expenses yet.</p>}
        </div>
      </Card>
    </div>
  )
}
