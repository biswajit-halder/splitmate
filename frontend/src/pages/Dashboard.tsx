import { useApi } from '../hooks/useApi'
import { balancesApi } from '../lib/api/balances'
import { activityApi } from '../lib/api/activity'
import { analyticsApi } from '../lib/api/analytics'
import { formatMoney, formatSigned } from '../lib/money'
import { Skeleton } from '../components/ui'
import type { ActivityEvent } from '../lib/types'

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

function activityIcon(type: ActivityEvent['type']): string {
  switch (type) {
    case 'expense_added':
    case 'expense_edited':
      return 'receipt_long'
    case 'settlement_made':
    case 'settlement_received':
      return 'payments'
    case 'group_created':
    case 'group_joined':
      return 'group'
    case 'friend_added':
    case 'friend_request':
      return 'person_add'
    default:
      return 'info'
  }
}

export function DashboardPage() {
  const balances = useApi(() => balancesApi.all())
  const activity = useApi(() => activityApi.list({ limit: 6 }))
  const trend = useApi(() =>
    Promise.all(lastMonths(6).map(m => analyticsApi.monthly(m))),
  )

  const months = lastMonths(6)
  const spend = (trend.data ?? []).map(m => m.totalPaise)
  const maxSpend = Math.max(1, ...spend)
  const recent = activity.data?.events ?? []

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <div>
        <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Dashboard</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Your financial overview at a glance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-lg sm:grid-cols-3">
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg flex items-center gap-md">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Total Balance</p>
            {balances.loading ? <Skeleton width={90} height={20} /> : (
              <p className="font-headline-sm text-headline-sm text-on-surface">{formatMoney(balances.data?.netPaise ?? 0)}</p>
            )}
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg flex items-center gap-md">
          <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-error">arrow_upward</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">You Owe</p>
            {balances.loading ? <Skeleton width={90} height={20} /> : (
              <p className="font-headline-sm text-headline-sm text-error">{formatMoney(balances.data?.owePaise ?? 0)}</p>
            )}
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg flex items-center gap-md">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-success">arrow_downward</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">You're Owed</p>
            {balances.loading ? <Skeleton width={90} height={20} /> : (
              <p className="font-headline-sm text-headline-sm text-success">{formatMoney(balances.data?.owedPaise ?? 0)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Spending Trend */}
      <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
        <div className="flex items-center justify-between mb-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Spending Trend</h3>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Last 6 months</span>
        </div>
        <div className="flex gap-md h-48">
          <div className="flex flex-col justify-between text-right">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Max</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">0</span>
          </div>
          <div className="flex-1 flex items-end justify-between gap-xs border-b border-outline-variant/30 pb-xs">
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
        <div className="flex justify-between mt-xs ml-12">
          {months.map(m => (
            <span key={m} className="font-label-sm text-label-sm text-on-surface-variant">{monthShort(m)}</span>
          ))}
        </div>
      </div>

      {/* Groups + Recent Activity */}
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Your Groups</h3>
          <div className="flex flex-col gap-md">
            {balances.loading && <Skeleton height={48} />}
            {(balances.data?.groups ?? []).map(g => (
              <div key={g.groupId} className="flex items-center justify-between p-md rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-md">
                  <div className={`w-10 h-10 rounded-full ${g.iconBg ?? 'bg-surface-container'} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-on-surface-variant">{g.icon ?? 'group'}</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface">{g.groupName}</span>
                </div>
                <span className={`font-label-md text-label-md ${g.netPaise > 0 ? 'text-success' : g.netPaise < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                  {formatSigned(g.netPaise)}
                </span>
              </div>
            ))}
            {(balances.data?.groups.length ?? 0) === 0 && !balances.loading && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">No groups yet.</p>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Recent Activity</h3>
          <div className="flex flex-col gap-sm">
            {activity.loading && <Skeleton height={48} />}
            {recent.map(ev => (
              <div key={ev.id} className="flex items-center gap-md p-md rounded-lg bg-surface-container-low">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[18px]">{activityIcon(ev.type)}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">{ev.actorName}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant capitalize truncate">{ev.type.replace(/_/g, ' ')}</p>
                </div>
              </div>
            ))}
            {recent.length === 0 && !activity.loading && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
