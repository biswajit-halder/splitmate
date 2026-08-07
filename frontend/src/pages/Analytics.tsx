import { Card, Badge } from '../components/ui'

export function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-xl">
      <div><h1 className="font-headline-lg text-headline-lg text-on-surface">Reports & Analytics</h1><p className="font-body-md text-body-md text-on-surface-variant">Deep dive into your financial interactions.</p></div>
      <div className="grid grid-cols-1 gap-lg md:grid-cols-2 lg:grid-cols-4">
        <Card><p className="font-label-md text-label-md text-on-surface-variant">Monthly Spending</p><p className="font-headline-md text-headline-md text-on-surface">$1,240.50</p><span className="font-label-sm text-label-sm text-green-600">+12.5% vs last month</span></Card>
        <Card><p className="font-label-md text-label-md text-on-surface-variant">Weekly Average</p><p className="font-headline-md text-headline-md text-on-surface">$310.12</p><span className="font-label-sm text-label-sm text-on-surface-variant">Stable</span></Card>
        <Card><p className="font-label-md text-label-md text-on-surface-variant">Avg. Expense</p><p className="font-headline-md text-headline-md text-on-surface">$45.20</p><span className="font-label-sm text-label-sm text-error">-4.2% vs last month</span></Card>
        <Card><p className="font-label-md text-label-md text-on-surface-variant">Total Settled</p><p className="font-headline-md text-headline-md text-on-surface">$890.00</p><span className="font-label-sm text-label-sm text-green-600">72% of total volume</span></Card>
      </div>
      <Card><div className="mb-lg flex items-center justify-between"><h3 className="font-headline-sm text-headline-sm text-on-surface">Spending Trends</h3><div className="flex gap-sm"><Badge variant="primary">Daily</Badge><Badge>Weekly</Badge></div></div><div className="h-48 flex items-end justify-between gap-sm rounded-md bg-surface-container-low p-md">{[20, 45, 30, 60, 40, 75, 50, 80, 55, 70, 60, 85, 45, 65, 50, 75, 60, 80, 55, 70].map((height, i) => (<div key={i} className="flex-1 rounded-t bg-primary-container transition-all hover:bg-primary" style={{ height: `${height}%` }} />))}</div></Card>
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <Card><h3 className="mb-lg font-headline-sm text-headline-sm text-on-surface">Category Breakdown</h3><div className="flex flex-col gap-md">{[{ category: 'Dining', percentage: 45, color: 'bg-primary-container' },{ category: 'Travel', percentage: 25, color: 'bg-secondary-container' },{ category: 'Utilities', percentage: 15, color: 'bg-tertiary-container' },{ category: 'Other', percentage: 15, color: 'bg-surface-container-high' }].map((c, i) => (<div key={i} className="flex items-center gap-md"><div className={`h-4 w-4 rounded ${c.color}`} /><span className="flex-1 font-label-md text-label-md text-on-surface">{c.category}</span><span className="font-label-md text-label-md text-on-surface-variant">{c.percentage}%</span></div>))}</div></Card>
        <Card><h3 className="mb-lg font-headline-sm text-headline-sm text-on-surface">Top Connections</h3><div className="flex flex-col gap-md">{[{ name: 'Sarah Jenkins', amount: 420.00 },{ name: 'Mike Ross', amount: 280.50 },{ name: 'David Chen', amount: 150.25 },{ name: 'Anna Lee', amount: 85.00 }].map((c, i) => (<div key={i} className="flex items-center justify-between"><span className="font-label-md text-label-md text-on-surface">{c.name}</span><span className="font-label-md text-label-md text-on-surface-variant">${c.amount.toFixed(2)}</span></div>))}</div></Card>
      </div>
    </div>
  )
}
