export interface User {
  id: string
  email: string
  name: string
  avatarBg: string | null
}

export interface AuthResult {
  token: string
  user: User
}

export interface GroupMemberSummary {
  initials: string
  bgColor: string | null
}

export interface Group {
  id: string
  name: string
  icon: string | null
  iconBg: string | null
  iconColor: string | null
  type: string | null
  createdBy: string
  balancePaise: number
  memberCount: number
  members: GroupMemberSummary[]
}

export interface GroupMember {
  membershipId: string
  status: string
  userId: string
  name: string
  email: string
  avatarBg: string | null
}

export interface GroupDetail {
  id: string
  name: string
  icon: string | null
  iconBg: string | null
  iconColor: string | null
  type: string | null
  createdBy: string
  createdByName: string
  members: GroupMember[]
}

export interface Friend {
  id: string
  requestId: string
  name: string
  email: string
  initials: string
  avatarBg: string | null
  balancePaise: number
}

export interface FriendRequest {
  id: string
  status: string
  createdAt: string
  userId: string
  name: string
  email: string
  direction: 'incoming' | 'outgoing'
}

export interface ExpenseSummary {
  id: string
  description: string
  amountPaise: number
  expenseDate: string
  category: string | null
  splitMode: string
  paidBy: string
  paidByName: string
}

export interface ExpenseSplit {
  userId: string
  amountPaise: number
  weight: number | null
  settled: number
  name: string
}

export interface ExpenseDetail {
  id: string
  groupId: string
  description: string
  amountPaise: number
  expenseDate: string
  category: string | null
  splitMode: string
  paidBy: string
  paidByName: string
  createdAt: string
  splits: ExpenseSplit[]
}

export interface Settlement {
  id: string
  groupId?: string
  groupName?: string
  amountPaise: number
  status: 'pending' | 'confirmed' | 'declined'
  date: string
  fromName: string
  toName: string
  fromUserId?: string
  toUserId?: string
  note?: string | null
}

export interface Balances {
  netPaise: number
  owedPaise: number
  owePaise: number
  groups: Array<{
    groupId: string
    groupName: string
    icon: string | null
    iconBg: string | null
    iconColor: string | null
    netPaise: number
  }>
}

export interface GroupBalanceMember {
  userId: string
  name: string
  email: string
  avatarBg: string | null
  netPaise: number
}

export interface GroupBalances {
  members: GroupBalanceMember[]
  sumPaise: number
}

export interface AnalyticsMonthly {
  month: string
  totalPaise: number
  settledPaise: number
}

export interface AnalyticsBreakdown {
  byGroup: Array<{ groupId: string; groupName: string; totalPaise: number }>
  byCategory: Array<{ category: string; totalPaise: number }>
  largestExpenses: Array<{ id: string; description: string; amountPaise: number; paidByName: string }>
}

export type ActivityType =
  | 'expense_added'
  | 'expense_edited'
  | 'settlement_made'
  | 'settlement_received'
  | 'group_created'
  | 'group_joined'
  | 'friend_added'
  | 'friend_request'

export interface ActivityEvent {
  id: string
  actorId: string
  actorName: string
  type: ActivityType
  groupId: string | null
  payload: Record<string, unknown> | null
  createdAt: string
}

export interface AppNotification {
  id: string
  title: string
  body: string | null
  type: string | null
  refId: string | null
  isRead: number
  createdAt: string
}

export interface NotificationsResult {
  notifications: AppNotification[]
  unread: number
}
