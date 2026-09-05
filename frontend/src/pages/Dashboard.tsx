import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { balancesApi } from '../lib/api/balances'
import { activityApi } from '../lib/api/activity'
import { formatMoney, formatSigned } from '../lib/money'
import { Skeleton, EmptyState, BlobAvatar, CategoryIcon } from '../components/ui'
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton'
import type { ActivityEvent } from '../lib/types'

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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const balances = useApi(() => balancesApi.all())
  const activity = useApi(() => activityApi.list({ limit: 5 }))
  const recent = activity.data?.events ?? []

  if (balances.loading && activity.loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex flex-col gap-xl max-w-content">
      {/* Header */}
      <div>
        <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Dashboard</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Welcome back, here's your financial overview.</p>
      </div>

      {/* Stat Cards — Hero Total Balance + supporting Owed/Owe */}
      <div className="flex flex-col gap-lg">
        {/* Total Balance — Hero Card */}
        <div className="bg-surface rounded-xl border border-line/40 p-lg md:p-xl flex items-center gap-lg border-l-4 border-l-primary">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[28px]">account_balance_wallet</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Total Balance</p>
            {balances.loading ? <Skeleton width={140} height={36} /> : (
              <p className="font-headline-xl text-headline-xl md:text-[2.5rem] md:font-bold text-primary leading-tight">
                {formatMoney(balances.data?.netPaise ?? 0)}
              </p>
            )}
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Across all your groups</p>
          </div>
        </div>

        {/* Owed + Owe — Supporting Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <div className="bg-surface rounded-xl border border-line/40 p-md flex items-center gap-md border-l-4 border-l-success">
            <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center">
              <span className="material-symbols-outlined text-white">check_circle</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">You're Owed</p>
              {balances.loading ? <Skeleton width={90} height={20} /> : (
                <p className="font-headline-sm text-headline-sm text-success">{formatMoney(balances.data?.owedPaise ?? 0)}</p>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-line/40 p-md flex items-center gap-md border-l-4 border-l-error">
            <div className="w-12 h-12 rounded-xl bg-error flex items-center justify-center">
              <span className="material-symbols-outlined text-white">trending_up</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">You Owe</p>
              {balances.loading ? <Skeleton width={90} height={20} /> : (
                <p className="font-headline-sm text-headline-sm text-error">{formatMoney(balances.data?.owePaise ?? 0)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity + My Groups */}
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-surface rounded-xl border border-line/40 p-lg">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Activity</h3>
            <button
              onClick={() => navigate('/activity')}
              className="font-label-sm text-label-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-xs"
            >
              View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
          <div className="flex flex-col gap-md">
            {activity.loading && <Skeleton height={48} />}
            {recent.map(ev => (
              <div key={ev.id} className="flex items-center gap-md">
                <BlobAvatar userId={ev.id} name={ev.actorName} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">
                    <span className="font-semibold">{ev.actorName}</span>{' '}
                    <span className="text-on-surface-variant">{activityLabel(ev.type)}</span>
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{timeAgo(ev.createdAt)}</p>
                </div>
              </div>
            ))}
            {recent.length === 0 && !activity.loading && (
              <EmptyState icon="inbox" title="No recent activity" description="Activity will appear here as your groups interact." />
            )}
          </div>
        </div>

        {/* My Groups */}
        <div className="bg-surface rounded-xl border border-line/40 p-lg">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">My Groups</h3>
            <button
              onClick={() => navigate('/groups?new=1')}
              className="font-label-sm text-label-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-xs"
            >
              Create New Group <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
          <div className="flex flex-col gap-md">
            {balances.loading && <Skeleton height={48} />}
            {(balances.data?.groups ?? []).map(g => (
              <button
                key={g.groupId}
                onClick={() => navigate(`/groups/${g.groupId}`)}
                className="flex items-center justify-between p-md rounded-lg hover:bg-surface-container-low transition-colors w-full text-left"
              >
                <div className="flex items-center gap-md">
                  <CategoryIcon category={g.icon ?? 'home'} size={40} />
                  <span className="font-label-md text-label-md text-on-surface">{g.groupName}</span>
                </div>
                <div className="flex items-center gap-sm">
                  <span className={`font-label-md text-label-md ${g.netPaise > 0 ? 'text-primary' : g.netPaise < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                    {formatSigned(g.netPaise)}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
                </div>
              </button>
            ))}
            {(balances.data?.groups.length ?? 0) === 0 && !balances.loading && (
              <EmptyState
                icon="group_add"
                title="No groups yet"
                description="Create your first group to start splitting expenses."
                action={{ label: 'Create Group', onClick: () => navigate('/groups?new=1') }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
