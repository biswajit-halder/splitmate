import { useState } from 'react'

type ActivityFilter = 'all' | 'expenses' | 'settlements' | 'groups' | 'friends'

interface ActivityItem {
  id: number
  type: 'expense_added' | 'expense_edited' | 'settlement_made' | 'settlement_received' | 'group_created' | 'group_joined' | 'friend_added' | 'friend_request'
  icon: string
  iconBg: string
  iconColor: string
  title: string
  description: string
  amount?: string
  amountClass?: string
  timestamp: string
  group?: string
  participants?: string[]
}

const filters: { key: ActivityFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All Activity', icon: 'dashboard' },
  { key: 'expenses', label: 'Expenses', icon: 'receipt_long' },
  { key: 'settlements', label: 'Settlements', icon: 'payments' },
  { key: 'groups', label: 'Groups', icon: 'group' },
  { key: 'friends', label: 'Friends', icon: 'person' },
]

const activities: ActivityItem[] = [
  {
    id: 1,
    type: 'expense_added',
    icon: 'receipt_long',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    title: 'New expense added',
    description: 'Dinner at Mario\'s',
    amount: '$120.00',
    amountClass: 'text-on-surface',
    timestamp: '2 hours ago',
    group: 'Europe Summer 2025',
    participants: ['You', 'Sarah', 'Mike'],
  },
  {
    id: 2,
    type: 'settlement_made',
    icon: 'payments',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    title: 'Settlement received',
    description: 'Mike R. paid you via Venmo',
    amount: '$45.00',
    amountClass: 'text-success',
    timestamp: '3 hours ago',
    group: 'Europe Summer 2025',
  },
  {
    id: 3,
    type: 'expense_added',
    icon: 'receipt_long',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    title: 'New expense added',
    description: 'Flights to Paris',
    amount: '$1,200.00',
    amountClass: 'text-on-surface',
    timestamp: '5 hours ago',
    group: 'Europe Summer 2025',
    participants: ['You', 'Sarah', 'Alex'],
  },
  {
    id: 4,
    type: 'settlement_received',
    icon: 'payments',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    title: 'Settlement received',
    description: 'Sarah J. paid you via PayPal',
    amount: '$85.50',
    amountClass: 'text-success',
    timestamp: 'Yesterday',
    group: 'Tahoe Trip',
  },
  {
    id: 5,
    type: 'expense_edited',
    icon: 'edit',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    title: 'Expense edited',
    description: 'Updated Groceries for Weekend',
    amount: '$210.80',
    amountClass: 'text-on-surface',
    timestamp: 'Yesterday',
    group: 'Apartment Expenses',
    participants: ['You', 'Tom', 'Lisa'],
  },
  {
    id: 6,
    type: 'group_created',
    icon: 'group_add',
    iconBg: 'bg-tertiary/10',
    iconColor: 'text-tertiary',
    title: 'New group created',
    description: 'Created "Weekend Warriors"',
    timestamp: '2 days ago',
    participants: ['You', 'Mike', 'Alex', 'Sarah'],
  },
  {
    id: 7,
    type: 'friend_added',
    icon: 'person_add',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    title: 'Friend added',
    description: 'You are now friends with Sarah Jenkins',
    timestamp: '3 days ago',
  },
  {
    id: 8,
    type: 'settlement_made',
    icon: 'payments',
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
    title: 'Settlement sent',
    description: 'You paid Alex via Bank Transfer',
    amount: '$300.00',
    amountClass: 'text-error',
    timestamp: '4 days ago',
    group: 'Europe Summer 2025',
  },
  {
    id: 9,
    type: 'expense_added',
    icon: 'receipt_long',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    title: 'New expense added',
    description: 'Uber to Airport',
    amount: '$45.00',
    amountClass: 'text-on-surface',
    timestamp: '5 days ago',
    group: 'Tahoe Trip',
    participants: ['You', 'Mike'],
  },
  {
    id: 10,
    type: 'friend_request',
    icon: 'person_add',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    title: 'Friend request sent',
    description: 'Request sent to Tom Wilson',
    timestamp: '1 week ago',
  },
]

const filterCounts: Record<ActivityFilter, number> = {
  all: activities.length,
  expenses: activities.filter(a => a.type === 'expense_added' || a.type === 'expense_edited').length,
  settlements: activities.filter(a => a.type === 'settlement_made' || a.type === 'settlement_received').length,
  groups: activities.filter(a => a.type === 'group_created' || a.type === 'group_joined').length,
  friends: activities.filter(a => a.type === 'friend_added' || a.type === 'friend_request').length,
}

export function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all')

  const filteredActivities = activeFilter === 'all'
    ? activities
    : activities.filter(a => {
        if (activeFilter === 'expenses') return a.type === 'expense_added' || a.type === 'expense_edited'
        if (activeFilter === 'settlements') return a.type === 'settlement_made' || a.type === 'settlement_received'
        if (activeFilter === 'groups') return a.type === 'group_created' || a.type === 'group_joined'
        if (activeFilter === 'friends') return a.type === 'friend_added' || a.type === 'friend_request'
        return true
      })

  // Group by date
  const grouped: Record<string, ActivityItem[]> = {}
  filteredActivities.forEach(a => {
    const dateKey = a.timestamp.includes('ago') || a.timestamp === 'Yesterday'
      ? 'Recent'
      : a.timestamp.includes('days') ? 'This Week' : 'Earlier'
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(a)
  })

  return (
    <div className="flex flex-col gap-xl max-w-content">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Activity</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Track all your financial interactions and group activities.</p>
        </div>
        <div className="flex items-center gap-md">
          <button className="flex items-center gap-sm px-md py-sm rounded-lg border border-outline-variant/30 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[18px]">search</span>
            Search
          </button>
          <button className="flex items-center gap-sm px-md py-sm rounded-lg border border-outline-variant/30 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-sm overflow-x-auto pb-xs">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex items-center gap-sm px-md py-sm rounded-lg font-label-md text-label-md whitespace-nowrap transition-all ${
              activeFilter === f.key
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
            {f.label}
            <span className={`px-xs py-px rounded-full text-[11px] font-bold ${
              activeFilter === f.key ? 'bg-on-primary/20 text-on-primary' : 'bg-outline-variant/30 text-on-surface-variant'
            }`}>
              {filterCounts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg flex items-center gap-md">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Today</p>
            <p className="font-headline-sm text-headline-sm text-on-surface">$165.00</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg flex items-center gap-md">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-success">payments</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">This Week</p>
            <p className="font-headline-sm text-headline-sm text-on-surface">$890.00</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg flex items-center gap-md">
          <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary">trending_up</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Activity Score</p>
            <p className="font-headline-sm text-headline-sm text-on-surface">Active</p>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      {Object.entries(grouped).map(([dateLabel, items]) => (
        <div key={dateLabel}>
          <div className="flex items-center gap-md mb-md">
            <h3 className="font-label-lg text-label-lg text-on-surface-variant">{dateLabel}</h3>
            <div className="flex-1 h-px bg-outline-variant/30" />
          </div>

          <div className="flex flex-col gap-sm">
            {items.map(activity => (
              <div
                key={activity.id}
                className="bg-surface rounded-xl border border-outline-variant/20 p-lg hover:border-outline-variant/40 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-md">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl ${activity.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <span className={`material-symbols-outlined text-[20px] ${activity.iconColor}`}>{activity.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-md">
                      <div className="min-w-0">
                        <p className="font-label-md text-label-md text-on-surface">{activity.title}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-px truncate">{activity.description}</p>
                      </div>
                      {activity.amount && (
                        <span className={`font-label-lg text-label-lg font-bold shrink-0 ${activity.amountClass}`}>{activity.amount}</span>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-md mt-sm flex-wrap">
                      <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {activity.timestamp}
                      </span>
                      {activity.group && (
                        <span className="font-label-sm text-label-sm text-primary flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[14px]">group</span>
                          {activity.group}
                        </span>
                      )}
                      {activity.participants && activity.participants.length > 0 && (
                        <div className="flex items-center gap-xs">
                          <div className="flex -space-x-1.5">
                            {activity.participants.slice(0, 3).map((p, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full bg-surface-container-high border border-surface flex items-center justify-center"
                              >
                                <span className="text-[9px] font-bold text-on-surface-variant">{p[0]}</span>
                              </div>
                            ))}
                          </div>
                          {activity.participants.length > 3 && (
                            <span className="font-label-sm text-label-sm text-on-surface-variant">+{activity.participants.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <span className="material-symbols-outlined text-[20px] text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity mt-1">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-xl text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-high mx-auto flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">inbox</span>
          </div>
          <p className="font-headline-sm text-headline-sm text-on-surface mb-xs">No activity found</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">There are no activities matching this filter.</p>
        </div>
      )}

      {/* Load More */}
      {filteredActivities.length > 0 && (
        <div className="text-center pb-lg">
          <button className="px-lg py-sm rounded-lg border border-outline-variant/30 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">
            Load More Activity
          </button>
        </div>
      )}
    </div>
  )
}
