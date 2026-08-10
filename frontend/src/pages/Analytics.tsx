import React, { useState } from 'react'

type ChartView = 'daily' | 'weekly'
type ConnectionTab = 'friends' | 'groups'

const spendingData = [20, 45, 30, 60, 40, 75, 50, 80, 55, 70, 60, 85, 45, 65, 50, 75, 60, 80, 55, 70]
const spendingLabels = ['Oct 1', 'Oct 8', 'Oct 15', 'Oct 22', 'Oct 29']

const categories = [
  { name: 'Dining', percentage: 45, color: 'bg-primary' },
  { name: 'Travel', percentage: 25, color: 'bg-secondary' },
  { name: 'Utilities', percentage: 15, color: 'bg-tertiary' },
  { name: 'Other', percentage: 15, color: 'bg-outline' },
]

const friends = [
  { name: 'Sarah Jenkins', initials: 'SJ', amount: 420.00 },
  { name: 'Mike Ross', initials: 'MK', amount: 280.50 },
  { name: 'David Chen', initials: 'DC', amount: 150.25 },
  { name: 'Anna Lee', initials: 'AL', amount: 85.00 },
]

const groups = [
  { name: 'Europe Summer 2025', amount: 1250.00 },
  { name: 'Apartment 4B', amount: 890.00 },
  { name: 'NYC Trip 2023', amount: 540.00 },
]

const largestExpenses = [
  { icon: 'flight', desc: 'Flights to NYC', category: 'Travel', group: 'NYC Trip 2023', date: 'Oct 12, 2023', amount: 540.00 },
  { icon: 'restaurant', desc: 'Steakhouse Dinner', category: 'Dining', group: 'Sarah Jenkins', date: 'Oct 18, 2023', amount: 215.50 },
  { icon: 'home', desc: 'Monthly Rent Share', category: 'Housing', group: 'Apartment 4B', date: 'Oct 01, 2023', amount: 850.00 },
  { icon: 'confirmation_number', desc: 'Concert Tickets', category: 'Entertainment', group: 'Music Festival Squad', date: 'Oct 25, 2023', amount: 180.00 },
]

const heatmapData = [
  [0.2, 0.4, 0.6, 0.3, 0.5, 0.8, 0.7],
  [0.1, 0.3, 0.5, 0.4, 0.6, 0.9, 0.8],
  [0.3, 0.5, 0.7, 0.6, 0.8, 1.0, 0.9],
]

export function AnalyticsPage() {
  const [chartView, setChartView] = useState<ChartView>('daily')
  const [connectionTab, setConnectionTab] = useState<ConnectionTab>('friends')
  const maxSpending = Math.max(...spendingData)

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Reports & Analytics</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Deep dive into your financial interactions.
          </p>
        </div>
        <div className="flex items-center gap-md flex-wrap">
          <button className="flex items-center gap-xs px-md py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Last 30 Days (Oct 1 - Oct 31)
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">arrow_drop_down</span>
          </button>
          <div className="flex gap-sm">
            <button className="flex items-center gap-xs px-md py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              PDF
            </button>
            <button className="flex items-center gap-xs px-md py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[18px]">table_chart</span>
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-md flex-wrap">
        <div className="relative">
          <select className="h-10 px-md pr-10 rounded-lg border border-outline-variant bg-surface text-on-surface font-label-md text-label-md appearance-none">
            <option>All Groups</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
        </div>
        <div className="relative">
          <select className="h-10 px-md pr-10 rounded-lg border border-outline-variant bg-surface text-on-surface font-label-md text-label-md appearance-none">
            <option>All Friends</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
        </div>
        <div className="relative">
          <select className="h-10 px-md pr-10 rounded-lg border border-outline-variant bg-surface text-on-surface font-label-md text-label-md appearance-none">
            <option>All Categories</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
        </div>
        <button className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">Clear Filters</button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-lg md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-xs p-lg rounded-xl bg-surface border border-outline-variant/20">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">account_balance</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Monthly Spending</span>
          </div>
          <p className="font-headline-md text-headline-md text-on-surface">$1,240.50</p>
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px] text-success">trending_up</span>
            <span className="font-body-sm text-body-sm text-success">+12.5% vs last month</span>
          </div>
        </div>
        <div className="flex flex-col gap-xs p-lg rounded-xl bg-surface border border-outline-variant/20">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">calendar_view_week</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Weekly Average</span>
          </div>
          <p className="font-headline-md text-headline-md text-on-surface">$310.12</p>
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">trending_flat</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Stable</span>
          </div>
        </div>
        <div className="flex flex-col gap-xs p-lg rounded-xl bg-surface border border-outline-variant/20">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">receipt_long</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Avg. Expense</span>
          </div>
          <p className="font-headline-md text-headline-md text-on-surface">$45.20</p>
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px] text-success">trending_down</span>
            <span className="font-body-sm text-body-sm text-success">-4.2% vs last month</span>
          </div>
        </div>
        <div className="flex flex-col gap-xs p-lg rounded-xl bg-surface border border-outline-variant/20">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">check_circle</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Total Settled</span>
          </div>
          <p className="font-headline-md text-headline-md text-on-surface">$890.00</p>
          <span className="font-body-sm text-body-sm text-on-surface-variant">72% of total volume</span>
        </div>
      </div>

      {/* Spending Trends Chart */}
      <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
        <div className="flex items-center justify-between mb-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Spending Trends</h3>
          <div className="flex bg-surface-container rounded-lg p-1">
            <button
              onClick={() => setChartView('daily')}
              className={`px-sm py-1 rounded font-label-md text-label-md transition-colors ${chartView === 'daily' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Daily
            </button>
            <button
              onClick={() => setChartView('weekly')}
              className={`px-sm py-1 rounded font-label-md text-label-md transition-colors ${chartView === 'weekly' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Weekly
            </button>
          </div>
        </div>
        {/* Y-axis labels + bars */}
        <div className="flex gap-md h-48">
          <div className="flex flex-col justify-between text-right">
            <span className="font-label-sm text-label-sm text-on-surface-variant">$500</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">$250</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">$0</span>
          </div>
          <div className="flex-1 flex items-end justify-between gap-xs border-b border-outline-variant/30 pb-xs">
            {spendingData.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/20 rounded-t hover:bg-primary/40 transition-colors"
                style={{ height: `${(h / maxSpending) * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-xs ml-12">
          {spendingLabels.map(l => (
            <span key={l} className="font-label-sm text-label-sm text-on-surface-variant">{l}</span>
          ))}
        </div>
      </div>

      {/* Two Column: Category + Connections */}
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        {/* Category Breakdown */}
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Category Breakdown</h3>
          <div className="flex items-center gap-lg mb-lg">
            <span className="font-headline-md text-headline-md text-on-surface">$1.2k</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Total</span>
          </div>
          <div className="flex flex-col gap-md">
            {categories.map(c => (
              <div key={c.name} className="flex items-center gap-md">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-xs">
                    <span className="font-label-md text-label-md text-on-surface">{c.name}</span>
                    <span className="font-label-md text-label-md text-on-surface-variant">{c.percentage}%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.percentage}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Connections */}
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Top Connections</h3>
          <div className="flex border-b border-outline-variant/30 mb-lg">
            <button
              onClick={() => setConnectionTab('friends')}
              className={`relative px-md py-2 font-label-md text-label-md transition-colors ${connectionTab === 'friends' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Friends
              {connectionTab === 'friends' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
            <button
              onClick={() => setConnectionTab('groups')}
              className={`relative px-md py-2 font-label-md text-label-md transition-colors ${connectionTab === 'groups' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Groups
              {connectionTab === 'groups' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          </div>
          <div className="flex flex-col gap-md">
            {connectionTab === 'friends' ? (
              friends.map(f => (
                <div key={f.name} className="flex items-center justify-between p-md rounded-lg hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                      <span className="font-label-md text-label-md text-on-primary">{f.initials}</span>
                    </div>
                    <span className="font-label-md text-label-md text-on-surface">{f.name}</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant">${f.amount.toFixed(2)}</span>
                </div>
              ))
            ) : (
              groups.map(g => (
                <div key={g.name} className="flex items-center justify-between p-md rounded-lg hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-secondary-container text-[18px]">group</span>
                    </div>
                    <span className="font-label-md text-label-md text-on-surface">{g.name}</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant">${g.amount.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Spending Intensity Heatmap */}
      <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">Spending Intensity</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-lg">When do you spend the most?</p>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-xs items-center">
              {/* Header row */}
              <div />
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="text-center font-label-sm text-label-sm text-on-surface-variant">{d}</div>
              ))}
              {/* Rows */}
              {['AM', 'Noon', 'PM'].map((time, ri) => (
                <React.Fragment key={ri}>
                  <span className="font-label-sm text-label-sm text-on-surface-variant pr-sm">{time}</span>
                  {heatmapData[ri].map((val, ci) => (
                    <div
                      key={`${ri}-${ci}`}
                      className="aspect-square rounded-md transition-colors"
                      style={{ backgroundColor: `rgba(53, 37, 205, ${val * 0.6})` }}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
            <div className="flex items-center gap-sm mt-md justify-end">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Less</span>
              <div className="flex gap-xs">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
                  <div key={i} className="w-4 h-4 rounded" style={{ backgroundColor: `rgba(53, 37, 205, ${v * 0.6})` }} />
                ))}
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Largest Expenses */}
      <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
        <div className="flex items-center justify-between mb-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Largest Expenses</h3>
          <button className="font-label-md text-label-md text-primary hover:text-primary/80 transition-colors">View All</button>
        </div>
        {/* Table Header */}
        <div className="hidden md:grid md:grid-cols-5 gap-md px-md pb-sm border-b border-outline-variant/30">
          <span className="font-label-sm text-label-sm text-on-surface-variant col-span-2">Transaction</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Category</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Group / Friend</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant text-right">Amount</span>
        </div>
        {/* Rows */}
        <div className="flex flex-col">
          {largestExpenses.map((e, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-md items-center p-md rounded-lg hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 last:border-b-0">
              <div className="flex items-center gap-md col-span-2">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant">{e.icon}</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface">{e.desc}</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{e.category}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{e.group}</span>
              <span className="font-label-md text-label-md text-on-surface text-right">${e.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
