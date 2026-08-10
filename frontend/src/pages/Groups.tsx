import { Link } from 'react-router-dom'

type GroupType = 'owed' | 'owe' | 'settled'

interface Member {
  initials: string
  bgColor: string
}

interface Group {
  id: string
  name: string
  icon: string
  iconBg: string
  iconColor: string
  type: GroupType
  balanceLabel: string
  balanceColor: string
  progressColor: string
  progressPercent: number
  settledAmount: string
  totalAmount: string
  lastActivityIcon: string
  lastActivityText: string
  members: Member[]
  extraMembers: number
}

const groups: Group[] = [
  {
    id: '1',
    name: 'Europe Summer 2025',
    icon: 'flight',
    iconBg: 'bg-[#EEF2FF]',
    iconColor: 'text-primary-container',
    type: 'owed',
    balanceLabel: 'Owed $240.00',
    balanceColor: 'text-[#10B981]',
    progressColor: 'bg-[#10B981]',
    progressPercent: 65,
    settledAmount: '$450',
    totalAmount: '$690',
    lastActivityIcon: 'receipt_long',
    lastActivityText: 'Train to Paris • 2h ago',
    members: [
      { initials: 'SJ', bgColor: 'bg-primary-container' },
      { initials: 'MR', bgColor: 'bg-secondary-container' },
      { initials: 'AT', bgColor: 'bg-tertiary-container' },
    ],
    extraMembers: 2,
  },
  {
    id: '2',
    name: 'Apartment 4B',
    icon: 'home',
    iconBg: 'bg-[#FEF2F2]',
    iconColor: 'text-[#EF4444]',
    type: 'owe',
    balanceLabel: 'You owe $45.00',
    balanceColor: 'text-[#EF4444]',
    progressColor: 'bg-[#EF4444]',
    progressPercent: 25,
    settledAmount: '$15',
    totalAmount: '$60',
    lastActivityIcon: 'bolt',
    lastActivityText: 'Electric Bill • 1d ago',
    members: [
      { initials: 'AL', bgColor: 'bg-primary-container' },
      { initials: 'KP', bgColor: 'bg-secondary-container' },
    ],
    extraMembers: 0,
  },
  {
    id: '3',
    name: 'Weekend Getaway',
    icon: 'restaurant',
    iconBg: 'bg-[#F0FDF4]',
    iconColor: 'text-[#10B981]',
    type: 'settled',
    balanceLabel: 'Settled Up',
    balanceColor: 'text-on-surface-variant',
    progressColor: 'bg-primary-container',
    progressPercent: 100,
    settledAmount: '$320',
    totalAmount: '$320',
    lastActivityIcon: 'local_pizza',
    lastActivityText: "Dinner at Mario's • 3d ago",
    members: [
      { initials: 'MR', bgColor: 'bg-secondary-container' },
      { initials: 'AT', bgColor: 'bg-tertiary-container' },
      { initials: 'CK', bgColor: 'bg-primary-container' },
    ],
    extraMembers: 0,
  },
]

export function GroupsPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-xl gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-background">Groups</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage shared expenses and settle up.
          </p>
        </div>
        <button className="bg-primary-container hover:bg-primary text-white font-label-md text-label-md py-3 px-lg rounded-xl transition-colors flex items-center justify-center gap-sm active:scale-[0.98] shadow-sm w-full md:w-auto">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create Group
        </button>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-lg gap-md border-b border-outline-variant pb-md">
        <div className="flex gap-sm">
          <button className="px-md py-sm rounded-full bg-primary-container text-white font-label-sm text-label-sm transition-colors shadow-sm">
            All Groups
          </button>
          <button className="px-md py-sm rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors">
            Active
          </button>
          <button className="px-md py-sm rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors">
            Archived
          </button>
        </div>
        <div className="flex items-center gap-sm text-on-surface-variant hover:text-on-surface cursor-pointer group">
          <span className="font-label-sm text-label-sm">Sort by: Recent Activity</span>
          <span className="material-symbols-outlined text-[18px] group-hover:translate-y-0.5 transition-transform">
            keyboard_arrow_down
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
        {groups.map(group => (
          <Link
            key={group.id}
            to={`/groups/${group.id}`}
            className="group relative rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg shadow-ambient transition-all duration-300 hover:-translate-y-0.5 hover:shadow-level-2 cursor-pointer overflow-hidden"
          >
            {/* Hover Action */}
            <div className="absolute top-md right-md opacity-0 group-hover:opacity-100 transition-opacity flex gap-sm z-10">
              <button
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                className="w-8 h-8 rounded-full bg-surface/90 backdrop-blur shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors border border-outline-variant"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>

            {/* Icon + Members */}
            <div className="flex items-start justify-between mb-lg relative z-0">
              <div
                className={`w-12 h-12 rounded-xl ${group.iconBg} flex items-center justify-center ${group.iconColor}`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {group.icon}
                </span>
              </div>
              <div className="flex -space-x-2">
                {group.members.map((m, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-surface ${m.bgColor} text-on-primary flex items-center justify-center font-label-sm text-label-sm`}
                  >
                    {m.initials}
                  </div>
                ))}
                {group.extraMembers > 0 && (
                  <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-variant flex items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
                    +{group.extraMembers}
                  </div>
                )}
              </div>
            </div>

            {/* Name + Activity */}
            <h3 className="font-headline-sm text-headline-sm text-on-background mb-1">{group.name}</h3>
            <p className="font-body-md text-label-sm text-on-surface-variant mb-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px]">{group.lastActivityIcon}</span>
              {group.lastActivityText}
            </p>

            {/* Balance + Progress */}
            <div className="pt-md border-t border-outline-variant mt-md">
              <div className="flex justify-between items-end mb-sm">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                    Your Balance
                  </p>
                  <p className={`font-headline-sm text-headline-sm ${group.balanceColor} font-semibold`}>
                    {group.balanceLabel}
                  </p>
                </div>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden mt-md" style={{ backgroundColor: '#F1F5F9' }}>
                <div className={`h-full ${group.progressColor} rounded-full`} style={{ width: `${group.progressPercent}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Settled: {group.settledAmount}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Total: {group.totalAmount}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-xl flex justify-center pb-xl">
        <button className="bg-transparent border border-outline-variant text-on-background font-label-md text-label-md py-sm px-lg rounded-lg hover:bg-surface-container-high transition-colors active:scale-[0.98] shadow-sm">
          Load More
        </button>
      </div>
    </div>
  )
}
