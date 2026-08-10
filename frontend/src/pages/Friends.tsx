type FriendType = 'owed' | 'owe' | 'settled'

interface Friend {
  id: string
  name: string
  email: string
  initials: string
  avatarBg: string
  avatarTextColor: string
  statusColor: string // online dot
  grayscale?: boolean
  type: FriendType
  balanceLabel: string
  balanceColor: string
  balanceIcon?: string
  decorativeBg: string
  mutualGroups: Array<{ letter: string; bg: string; text: string }>
  extraMutual?: number
  lastActivityIcon: string
  lastActivityText: string
  primaryActionLabel: string
  secondaryActionLabel: string
}

const friends: Friend[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    initials: 'SJ',
    avatarBg: 'bg-primary-container',
    avatarTextColor: 'text-on-primary',
    statusColor: 'bg-green-500',
    type: 'owed',
    balanceLabel: 'Owes you $124.50',
    balanceColor: 'text-green-600',
    decorativeBg: 'bg-primary/5',
    mutualGroups: [
      { letter: 'R', bg: 'bg-blue-100', text: 'text-blue-700' },
      { letter: 'T', bg: 'bg-purple-100', text: 'text-purple-700' },
    ],
    lastActivityIcon: 'restaurant',
    lastActivityText: "Dinner at Luigi's • 4h ago",
    primaryActionLabel: 'Settle Up',
    secondaryActionLabel: 'Remind',
  },
  {
    id: '2',
    name: 'Marcus Reed',
    email: 'm.reed@example.com',
    initials: 'MR',
    avatarBg: 'bg-orange-100',
    avatarTextColor: 'text-orange-700',
    statusColor: 'bg-gray-400',
    type: 'owe',
    balanceLabel: 'You owe $85.00',
    balanceColor: 'text-error',
    decorativeBg: 'bg-error/5',
    mutualGroups: [{ letter: 'H', bg: 'bg-teal-100', text: 'text-teal-700' }],
    lastActivityIcon: 'confirmation_number',
    lastActivityText: 'Concert Tickets • 2d ago',
    primaryActionLabel: 'Pay Now',
    secondaryActionLabel: 'View Profile',
  },
  {
    id: '3',
    name: 'David Chen',
    email: 'david.c@example.com',
    initials: 'DC',
    avatarBg: 'bg-secondary-container',
    avatarTextColor: 'text-on-secondary',
    statusColor: 'bg-green-500',
    grayscale: true,
    type: 'settled',
    balanceLabel: 'Settled up',
    balanceColor: 'text-on-surface-variant',
    balanceIcon: 'check_circle',
    decorativeBg: 'bg-surface-variant/20',
    mutualGroups: [],
    lastActivityIcon: 'payments',
    lastActivityText: 'Settled Balance • 1w ago',
    primaryActionLabel: 'View Profile',
    secondaryActionLabel: '',
  },
  {
    id: '4',
    name: 'Elena Rodriguez',
    email: 'elena.r@example.com',
    initials: 'ER',
    avatarBg: 'bg-pink-100',
    avatarTextColor: 'text-pink-700',
    statusColor: 'bg-yellow-400',
    type: 'owed',
    balanceLabel: 'Owes you $12.00',
    balanceColor: 'text-green-600',
    decorativeBg: 'bg-primary/5',
    mutualGroups: [
      { letter: 'R', bg: 'bg-blue-100', text: 'text-blue-700' },
      { letter: 'G', bg: 'bg-pink-100', text: 'text-pink-700' },
    ],
    extraMutual: 1,
    lastActivityIcon: 'local_cafe',
    lastActivityText: 'Coffee run • 3h ago',
    primaryActionLabel: 'Settle Up',
    secondaryActionLabel: 'Remind',
  },
]

export function FriendsPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-background tracking-tight mb-sm">
            Friends
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage your connections and mutual balances.
          </p>
        </div>
        <button className="bg-primary-container text-on-primary px-lg py-3 rounded-lg font-label-md text-label-md font-medium hover:opacity-90 transition-opacity active:scale-[0.98] flex items-center justify-center gap-sm shadow-sm whitespace-nowrap">
          <span className="material-symbols-outlined text-sm">person_add</span>
          Add Friend
        </button>
      </div>

      {/* Filters & Sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-xl pb-md border-b border-outline-variant/30">
        <div className="flex gap-sm overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button className="px-md py-sm rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md whitespace-nowrap transition-colors">
            All Friends
          </button>
          <button className="px-md py-sm rounded-full bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest font-label-md text-label-md whitespace-nowrap transition-colors">
            You Owe
          </button>
          <button className="px-md py-sm rounded-full bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest font-label-md text-label-md whitespace-nowrap transition-colors">
            Owe You
          </button>
          <button className="px-md py-sm rounded-full bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest font-label-md text-label-md whitespace-nowrap transition-colors">
            Settled
          </button>
        </div>
        <div className="flex items-center gap-sm self-end sm:self-auto">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Sort by:
          </span>
          <button className="flex items-center gap-1 text-on-surface hover:text-primary transition-colors font-label-md text-label-md px-sm py-1 rounded-md hover:bg-surface-container-lowest">
            Recent Activity
            <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
        {friends.map(friend => (
          <div
            key={friend.id}
            className={`relative rounded-xl p-lg border border-outline-variant/40 shadow-sm hover:shadow-md transition-shadow overflow-hidden group ${
              friend.type === 'settled' ? 'opacity-80 hover:opacity-100' : ''
            } bg-surface-container-lowest`}
          >
            {/* Decorative corner blob */}
            <div
              className={`absolute top-0 right-0 w-24 h-24 ${friend.decorativeBg} rounded-bl-full -z-10 transition-transform group-hover:scale-110`}
            />

            {/* Top row: avatar + name + more */}
            <div className="flex justify-between items-start mb-lg">
              <div className="flex items-center gap-md">
                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-full ${friend.avatarBg} ${friend.avatarTextColor} font-headline-sm font-bold border-2 border-surface shadow-sm flex items-center justify-center ${
                      friend.grayscale ? 'grayscale hover:grayscale-0 transition-all' : ''
                    }`}
                  >
                    {friend.initials}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${friend.statusColor} border-2 border-surface rounded-full`}
                  />
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    {friend.name}
                  </h3>
                  <p className="font-body-md text-label-sm text-on-surface-variant">{friend.email}</p>
                </div>
              </div>
              <button className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>

            {/* Balance */}
            <div className="mb-lg flex justify-between items-end">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Balance
                </p>
                <p className={`font-headline-md text-headline-md font-bold ${friend.balanceColor}`}>
                  {friend.balanceLabel}
                </p>
              </div>
              {friend.balanceIcon && (
                <span
                  className="material-symbols-outlined text-green-500 text-[28px] opacity-50"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {friend.balanceIcon}
                </span>
              )}
            </div>

            {/* Mutual groups + Last activity */}
            <div className="flex justify-between items-center mb-lg pt-md border-t border-outline-variant/20">
              <div>
                <p className="font-label-sm text-[11px] text-on-surface-variant mb-1 uppercase tracking-wider">
                  Mutual Groups
                </p>
                {friend.mutualGroups.length > 0 ? (
                  <div className="flex -space-x-2">
                    {friend.mutualGroups.map((g, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded-full ${g.bg} border border-surface flex items-center justify-center text-[10px] font-bold ${g.text} shadow-sm`}
                      >
                        {g.letter}
                      </div>
                    ))}
                    {friend.extraMutual && (
                      <div className="w-7 h-7 rounded-full bg-yellow-100 border border-surface flex items-center justify-center text-[10px] font-bold text-yellow-700 shadow-sm">
                        +{friend.extraMutual}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="font-label-sm text-[12px] text-on-surface-variant">None</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-label-sm text-[11px] text-on-surface-variant mb-1 uppercase tracking-wider">
                  Last Activity
                </p>
                <p className="font-label-sm text-[12px] text-on-surface flex items-center gap-1 justify-end">
                  <span className="material-symbols-outlined text-[14px]">
                    {friend.lastActivityIcon}
                  </span>
                  {friend.lastActivityText}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-sm">
              {friend.secondaryActionLabel && (
                <button className="flex-1 bg-surface-container border border-outline-variant/50 text-on-surface py-sm rounded-lg font-label-sm text-label-sm font-medium hover:bg-surface-container-high transition-colors flex justify-center items-center gap-xs">
                  {friend.secondaryActionLabel}
                </button>
              )}
              <button
                className={`flex-1 py-sm rounded-lg font-label-sm text-label-sm font-medium transition-opacity flex justify-center items-center gap-xs shadow-sm ${
                  friend.type === 'settled'
                    ? 'bg-surface-container border border-outline-variant/50 text-on-surface hover:bg-surface-container-high'
                    : 'bg-primary-container text-on-primary hover:opacity-90'
                }`}
              >
                {friend.primaryActionLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
