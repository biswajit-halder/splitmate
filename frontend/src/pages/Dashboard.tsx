import { Card, Avatar, Badge } from '../components/ui'

const mockData = { totalBalance: 452.80, youAreOwed: 820.50, youOwe: 367.70, monthlySpend: 1240.00 }

const upcomingSettlements = [
  { name: 'Sarah J.', amount: 120.00, type: 'receive', due: '2 days' },
  { name: 'Tahoe Trip', amount: 85.50, type: 'pay', due: 'Tomorrow' },
  { name: 'Mike R.', amount: 45.00, type: 'receive', due: 'next week' },
]

const recentExpenses = [
  { icon: 'restaurant', description: "Dinner at Gusto's", date: 'Today', amount: 124.50, split: 'Lent $62.25' },
  { icon: 'local_taxi', description: 'Uber to Airport', date: 'Yesterday', amount: 45.00, split: 'Borrowed $22.50' },
  { icon: 'shopping_cart', description: 'Groceries for Weekend', date: 'Oct 24', amount: 210.80, split: 'Lent $158.10' },
]

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-xl">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Welcome back, Alex</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Here is your financial overview for this month.</p>
      </div>
      <div className="grid grid-cols-1 gap-lg md:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col gap-md">
          <div className="flex items-center gap-md"><span className="material-symbols-outlined text-primary-container text-2xl">account_balance</span><h3 className="font-label-md text-label-md text-on-surface-variant">Total Balance</h3></div>
          <p className="font-display-lg text-display-lg text-on-surface">${mockData.totalBalance.toFixed(2)}</p>
          <span className="font-label-sm text-label-sm text-green-600">+12% from last month</span>
        </Card>
        <Card className="flex flex-col gap-md">
          <div className="flex items-center gap-md"><span className="material-symbols-outlined text-green-500 text-2xl">call_received</span><h3 className="font-label-md text-label-md text-on-surface-variant">You are owed</h3></div>
          <p className="font-headline-md text-headline-md text-on-surface">${mockData.youAreOwed.toFixed(2)}</p>
          <span className="font-label-sm text-label-sm text-on-surface-variant">From 4 friends</span>
        </Card>
        <Card className="flex flex-col gap-md">
          <div className="flex items-center gap-md"><span className="material-symbols-outlined text-error text-2xl">call_made</span><h3 className="font-label-md text-label-md text-on-surface-variant">You owe</h3></div>
          <p className="font-headline-md text-headline-md text-on-surface">${mockData.youOwe.toFixed(2)}</p>
          <span className="font-label-sm text-label-sm text-on-surface-variant">To 2 groups</span>
        </Card>
        <Card className="flex flex-col gap-md">
          <div className="flex items-center gap-md"><span className="material-symbols-outlined text-secondary text-2xl">credit_card</span><h3 className="font-label-md text-label-md text-on-surface-variant">Monthly Spend</h3></div>
          <p className="font-headline-md text-headline-md text-on-surface">${mockData.monthlySpend.toFixed(2)}</p>
          <span className="font-label-sm text-label-sm text-on-surface-variant">This month</span>
        </Card>
      </div>
      <Card>
        <div className="mb-lg flex items-center justify-between"><h3 className="font-headline-sm text-headline-sm text-on-surface">Spending Trends</h3><div className="flex gap-sm"><Badge variant="primary">Week</Badge><Badge>Month</Badge><Badge>Year</Badge></div></div>
        <div className="h-48 flex items-end justify-between gap-sm rounded-md bg-surface-container-low p-md">
          {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 55, 90].map((height, i) => (<div key={i} className="flex-1 rounded-t bg-primary-container transition-all hover:bg-primary" style={{ height: `${height}%` }} />))}
        </div>
        <div className="mt-sm flex justify-between font-label-sm text-label-sm text-on-surface-variant"><span>1st</span><span>5th</span><span>10th</span><span>15th</span><span>20th</span><span>25th</span><span>30th</span></div>
      </Card>
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <Card><h3 className="mb-lg font-headline-sm text-headline-sm text-on-surface">Upcoming Settlements</h3>
          <div className="flex flex-col gap-md">
            {upcomingSettlements.map((s, i) => (<div key={i} className="flex items-center justify-between rounded-md bg-surface-container-low p-md"><div className="flex items-center gap-md"><Avatar initials={s.name.split(' ').map(n => n[0]).join('')} size="sm" /><div><p className="font-label-md text-label-md text-on-surface">{s.name}</p><p className="font-label-sm text-label-sm text-on-surface-variant">Due in {s.due}</p></div></div><span className={`font-label-md text-label-md ${s.type === 'receive' ? 'text-green-600' : 'text-error'}`}>{s.type === 'receive' ? '+' : '-'}${s.amount.toFixed(2)}</span></div>))}
          </div>
        </Card>
        <Card><div className="mb-lg flex items-center justify-between"><h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Expenses</h3><a href="#" className="font-label-md text-label-md text-primary hover:underline">View All</a></div>
          <div className="flex flex-col gap-md">
            {recentExpenses.map((e, i) => (<div key={i} className="flex items-center justify-between rounded-md bg-surface-container-low p-md"><div className="flex items-center gap-md"><span className="material-symbols-outlined text-on-surface-variant">{e.icon}</span><div><p className="font-label-md text-label-md text-on-surface">{e.description}</p><p className="font-label-sm text-label-sm text-on-surface-variant">{e.date} • {e.split}</p></div></div><span className="font-label-md text-label-md text-on-surface">${e.amount.toFixed(2)}</span></div>))}
          </div>
        </Card>
      </div>
    </div>
  )
}
