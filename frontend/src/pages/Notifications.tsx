import { useState } from 'react'

type Tab = 'all' | 'unread' | 'mentions' | 'announcements'

const notifications = [
  {
    id: 1,
    icon: 'receipt',
    iconBg: 'bg-primary-container',
    iconColor: 'text-on-primary',
    title: 'Sarah Jenkins added an expense',
    time: '2m ago',
    body: '"Dinner at Mario\'s" was added to Europe Summer group for $145.00. You owe $48.33.',
    actions: [
      { label: 'View Expense', primary: true },
      { label: 'Settle Up', primary: false },
    ],
    section: 'today' as const,
    unread: true,
  },
  {
    id: 2,
    icon: 'person_add',
    iconBg: 'bg-secondary-container',
    iconColor: 'text-on-secondary-container',
    title: 'David Chen invited you to a group',
    time: '1h ago',
    body: "You've been invited to join Ski Trip 2024.",
    actions: [
      { label: 'Accept Invite', primary: true },
      { label: 'Decline', primary: false },
    ],
    section: 'today' as const,
    unread: true,
  },
  {
    id: 3,
    icon: 'check_circle',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    title: 'Emma Wilson settled up',
    time: 'Yesterday, 4:30 PM',
    body: 'Emma paid you $25.00 for "Uber to Airport".',
    actions: [],
    section: 'yesterday' as const,
    unread: false,
  },
  {
    id: 4,
    icon: 'alarm',
    iconBg: 'bg-tertiary-container',
    iconColor: 'text-on-tertiary-container',
    title: 'Reminder to settle balances',
    time: 'Yesterday, 9:00 AM',
    body: 'You have outstanding balances in Apartment 4B totaling $120.00.',
    actions: [
      { label: 'Review Balances', primary: true },
    ],
    section: 'yesterday' as const,
    unread: false,
  },
]

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all')

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread', count: 3 },
    { key: 'mentions', label: 'Mentions' },
    { key: 'announcements', label: 'Announcements' },
  ]

  const todayNotifications = notifications.filter(n => n.section === 'today')
  const yesterdayNotifications = notifications.filter(n => n.section === 'yesterday')

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Notifications</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Stay on top of your shared expenses and group activity.
          </p>
        </div>
        <div className="flex items-center gap-md">
          <button className="font-label-md text-label-md text-primary hover:text-primary/80 transition-colors">Mark All Read</button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">settings</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-lg py-3 font-label-md text-label-md transition-colors ${
              activeTab === tab.key
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="flex items-center gap-xs">
              {tab.label}
              {tab.count && (
                <span className="px-xs py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{tab.count}</span>
              )}
            </span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Today Section */}
      <div>
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-md">Today</h3>
        <div className="flex flex-col gap-sm">
          {todayNotifications.map(n => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </div>
      </div>

      {/* Yesterday Section */}
      <div>
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-md">Yesterday</h3>
        <div className="flex flex-col gap-sm">
          {yesterdayNotifications.map(n => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </div>
      </div>

      {/* Load More */}
      <div className="text-center">
        <button className="font-label-md text-label-md text-primary hover:text-primary/80 transition-colors">
          Load Older Notifications
        </button>
      </div>
    </div>
  )
}

function NotificationCard({ notification }: { notification: typeof notifications[0] }) {
  return (
    <div className={`flex gap-md p-lg rounded-xl border transition-colors hover:bg-surface-container-low ${
      notification.unread
        ? 'border-l-2 border-l-primary border-t-outline-variant/20 border-r-outline-variant/20 border-b-outline-variant/20 bg-primary/[0.02]'
        : 'border-outline-variant/20 bg-surface'
    }`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full ${notification.iconBg} ${notification.iconColor} flex items-center justify-center shrink-0`}>
        <span className="material-symbols-outlined text-[20px]">{notification.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-md">
          <div>
            <h4 className="font-label-md text-label-md text-on-surface">{notification.title}</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">{notification.time}</p>
          </div>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0">
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">{notification.body}</p>

        {/* Actions */}
        {notification.actions.length > 0 && (
          <div className="flex items-center gap-md mt-md">
            {notification.actions.map((action, i) => (
              <button
                key={i}
                className={`px-md py-2 rounded-lg font-label-md text-label-md transition-colors ${
                  action.primary
                    ? 'bg-primary text-on-primary hover:opacity-90'
                    : 'border border-outline-variant text-on-surface hover:bg-surface-container'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
