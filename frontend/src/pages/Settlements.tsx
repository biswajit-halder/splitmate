import { useState } from 'react'
import { Card, Avatar, Badge, Button } from '../components/ui'

const settlementData = [
  { date: 'Nov 12, 2023', name: 'Alex Lee', initials: 'AL', method: 'Bank Transfer', methodIcon: 'account_balance', amount: 85.00, status: 'Pending', note: 'Dinner Split' },
  { date: 'Nov 10, 2023', name: 'David Cho', initials: 'DC', method: 'Venmo', methodIcon: 'smartphone', amount: -150.00, status: 'Completed', note: 'Concert Tickets' },
  { date: 'Nov 05, 2023', name: 'Sarah Jenkins', initials: 'SJ', method: 'Card ending 4242', methodIcon: 'credit_card', amount: 42.75, status: 'Completed', note: 'Groceries' },
]

const suggestions = [
  { name: 'Pay Sarah Jenkins', initials: 'SJ', amount: 120.00, note: "Clears 3 expenses in 'Trip'" },
  { name: 'Pay Marcus K.', initials: 'MK', amount: 45.50, note: "Clears balance in 'Flatmates'" },
]

const paymentFlow = [
  { title: 'Payment Initiated', time: 'Today, 10:42 AM', desc: 'You initiated a $85.00 transfer to Alex Lee via Bank Transfer.', icon: 'send', completed: true },
  { title: 'Funds Received', time: 'Nov 10', desc: 'David Cho confirmed receipt of $150.00 for Concert Tickets.', icon: 'check_circle', completed: true, receipt: 'Receipt #492-AX' },
  { title: 'Auto-Settled', time: 'Nov 02', desc: 'Monthly balance of $210.00 settled automatically from wallet.', icon: 'check', completed: true },
]

const chartData = [
  { month: 'Jul', value: 45 },
  { month: 'Aug', value: 120 },
  { month: 'Sep', value: 30 },
  { month: 'Oct', value: 180 },
  { month: 'Nov', value: 95 },
]

export function SettlementsPage() {
  const [timeFilter, setTimeFilter] = useState<'all' | 'month'>('all')
  const maxVal = Math.max(...chartData.map(d => d.value))

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Settlements</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
          Review outstanding balances, clear debts efficiently, and track your recent financial resolutions across all groups.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-md">
        <div className="flex bg-surface-container rounded-lg p-1">
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-md py-2 rounded font-label-md text-label-md transition-colors ${timeFilter === 'all' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeFilter('month')}
            className={`px-md py-2 rounded font-label-md text-label-md transition-colors ${timeFilter === 'month' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            This Month
          </button>
        </div>
        <div className="flex items-center gap-sm">
          <button className="flex items-center gap-xs px-md py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          <button className="flex items-center gap-xs px-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Settle Up
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-md mb-md">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error">trending_down</span>
            </div>
            <h3 className="font-label-md text-label-md text-on-surface-variant">Outstanding</h3>
          </div>
          <p className="font-headline-md text-headline-md text-on-surface">$342.50</p>
          <div className="flex items-center gap-xs mt-xs">
            <p className="font-label-sm text-label-sm text-error">Total You Owe</p>
          </div>
          <div className="flex items-center gap-xs mt-sm">
            <span className="material-symbols-outlined text-[14px] text-error">arrow_upward</span>
            <span className="font-body-sm text-body-sm text-error">12% from last month</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-md mb-md">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-success">trending_up</span>
            </div>
            <h3 className="font-label-md text-label-md text-on-surface-variant">To Receive</h3>
          </div>
          <p className="font-headline-md text-headline-md text-on-surface">$197.00</p>
          <div className="flex items-center gap-xs mt-xs">
            <p className="font-label-sm text-label-sm text-success">Total Owed to You</p>
          </div>
          <div className="flex items-center gap-xs mt-sm">
            <span className="material-symbols-outlined text-[14px] text-success">arrow_downward</span>
            <span className="font-body-sm text-body-sm text-success">4% from last month</span>
          </div>
        </Card>
      </div>

      {/* Settlement Volume Chart */}
      <Card>
        <div className="flex items-center justify-between mb-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Settlement Volume</h3>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
        <div className="flex items-end gap-lg h-48">
          {chartData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant">${d.value}</span>
              <div
                className="w-full bg-primary/20 rounded-t-md transition-all duration-500"
                style={{ height: `${(d.value / maxVal) * 120}px` }}
              />
              <span className="font-label-sm text-label-sm text-on-surface-variant">{d.month}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Smart Suggestions */}
      <Card>
        <div className="flex items-center gap-md mb-lg">
          <span className="material-symbols-outlined text-primary">lightbulb</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Smart Suggestions</h3>
        </div>
        <div className="flex flex-col gap-md">
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-md rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-md">
                <Avatar initials={s.initials} />
                <div>
                  <p className="font-label-md text-label-md text-on-surface">{s.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{s.note}</p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <span className="font-label-md text-label-md text-on-surface">${s.amount.toFixed(2)}</span>
                <Button className="px-md py-2 text-sm">Settle</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Settlements */}
      <Card>
        <div className="flex items-center justify-between mb-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Settlements</h3>
          <button className="font-label-md text-label-md text-primary hover:text-primary/80 transition-colors">View All</button>
        </div>
        {/* Table Header */}
        <div className="hidden md:grid md:grid-cols-5 gap-md px-md pb-sm border-b border-outline-variant/30">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Date</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Recipient / Sender</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Method</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant text-right">Amount</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant text-right">Status</span>
        </div>
        {/* Rows */}
        <div className="flex flex-col">
          {settlementData.map((s, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-md items-center p-md rounded-lg hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 last:border-b-0">
              <span className="font-body-sm text-body-sm text-on-surface-variant">{s.date}</span>
              <div className="flex items-center gap-md">
                <Avatar initials={s.initials} size="sm" />
                <div>
                  <p className="font-label-md text-label-md text-on-surface">{s.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{s.note}</p>
                </div>
              </div>
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{s.methodIcon}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{s.method}</span>
              </div>
              <span className={`font-label-md text-label-md text-right ${s.amount > 0 ? 'text-error' : 'text-success'}`}>
                {s.amount > 0 ? '-' : '+'}${Math.abs(s.amount).toFixed(2)}
              </span>
              <div className="flex items-center justify-end gap-sm">
                <Badge variant={s.status === 'Completed' ? 'success' : 'warning'}>{s.status}</Badge>
                {s.status === 'Pending' && (
                  <button className="font-label-sm text-label-sm text-primary hover:text-primary/80 transition-colors">Mark Paid</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment Flow */}
      <Card>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Payment Flow</h3>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-outline-variant/30" />
          <div className="flex flex-col gap-xl">
            {paymentFlow.map((item, i) => (
              <div key={i} className="flex gap-lg relative">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center z-10 shrink-0">
                  <span className="material-symbols-outlined text-on-success text-[18px]">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-sm">
                    <h4 className="font-label-md text-label-md text-on-surface">{item.title}</h4>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{item.time}</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">{item.desc}</p>
                  {item.receipt && (
                    <div className="flex items-center gap-xs mt-xs">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">receipt_long</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{item.receipt}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-lg text-center">
          <button className="font-label-md text-label-md text-primary hover:text-primary/80 transition-colors">View Full History</button>
        </div>
      </Card>
    </div>
  )
}
