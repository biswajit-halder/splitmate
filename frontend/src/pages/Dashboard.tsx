import { Card } from '../components/ui'

const stats = [
  { label: 'Total Balance', amount: '$452.80', icon: 'account_balance', amountClass: 'text-on-surface', iconBg: 'bg-primary/10', iconColor: 'text-primary', delta: { text: '+12% from last month', icon: 'trending_up', color: 'text-primary-container' } },
  { label: 'You are owed', amount: '$820.50', icon: 'call_received', amountClass: 'text-primary-container', iconBg: 'bg-primary/10', iconColor: 'text-primary-container', delta: { text: 'From 4 friends', icon: null, color: 'text-on-surface-variant' } },
  { label: 'You owe', amount: '$367.70', icon: 'call_made', amountClass: 'text-error', iconBg: 'bg-error/10', iconColor: 'text-error', delta: { text: 'To 2 groups', icon: null, color: 'text-on-surface-variant' } },
  { label: 'Monthly Spend', amount: '$1,240.00', icon: 'credit_card', amountClass: 'text-on-surface', iconBg: 'bg-secondary-container/30', iconColor: 'text-on-secondary-container', delta: { text: 'This month', icon: null, color: 'text-on-surface-variant' } },
]

const chartPoints = [
  { x: 0, y: 150 },
  { x: 100, y: 120 },
  { x: 200, y: 180 },
  { x: 300, y: 90 },
  { x: 400, y: 140 },
  { x: 500, y: 60 },
  { x: 600, y: 110 },
  { x: 700, y: 40 },
  { x: 800, y: 80 },
]
const chartAreaPath = `M0,200 L0,150 L100,120 L200,180 L300,90 L400,140 L500,60 L600,110 L700,40 L800,80 L800,200 Z`
const chartLinePath = `M0,150 L100,120 L200,180 L300,90 L400,140 L500,60 L600,110 L700,40 L800,80`

const upcomingSettlements = [
  { name: 'Sarah J.', due: 'Due in 2 days', amount: '$120.00', side: 'You receive', progress: 75, progressColor: 'bg-primary', tone: 'receive' },
  { name: 'Tahoe Trip', due: 'Due Tomorrow', amount: '$85.50', side: 'You pay', progress: 90, progressColor: 'bg-error', tone: 'pay' },
  { name: 'Mike R.', due: 'Due next week', amount: '$45.00', side: 'You receive', progress: 30, progressColor: 'bg-primary', tone: 'receive', faded: true },
]

const recentExpenses = [
  { icon: 'restaurant', title: "Dinner at Gusto's", meta: 'Today', sub: 'Paid by you', amount: '$124.50', tag: 'Lent $62.25', tagClass: 'text-primary-container', participants: 2 },
  { icon: 'local_taxi', title: 'Uber to Airport', meta: 'Yesterday', sub: 'Paid by Sarah J.', amount: '$45.00', tag: 'Borrowed $22.50', tagClass: 'text-error', participants: 1 },
  { icon: 'shopping_cart', title: 'Groceries for Weekend', meta: 'Oct 24', sub: 'Paid by you', amount: '$210.80', tag: 'Lent $158.10', tagClass: 'text-primary-container', participants: 3 },
]

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-xl">
      {/* Page Header */}
      <div className="mb-xs">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-on-surface mb-xs">Welcome back, Alex</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Here is your financial overview for this month.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-xl">
        {stats.map(stat => (
          <Card key={stat.label} className="flex flex-col justify-between h-[140px] border border-outline-variant/30 hover:shadow-hover transition-interactive">
            <div className="flex justify-between items-start">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{stat.label}</span>
              <div className={`w-8 h-8 rounded-full ${stat.iconBg} flex items-center justify-center ${stat.iconColor}`}>
                <span className="material-symbols-outlined text-sm">{stat.icon}</span>
              </div>
            </div>
            <div>
              <div className={`font-display-lg text-display-lg ${stat.amountClass}`}>{stat.amount}</div>
              <div className={`font-label-sm text-label-sm ${stat.delta.color} mt-1 flex items-center gap-1`}>
                {stat.delta.icon && <span className="material-symbols-outlined text-[14px]">{stat.delta.icon}</span>}
                {stat.delta.text}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bento Grid: Chart (2 cols) + Upcoming Settlements (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-xl">
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-lg shadow-ambient h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Spending Trends</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/30 hover:bg-surface-container transition-colors">Week</button>
              <button className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-bold border border-primary/20">Month</button>
              <button className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/30 hover:bg-surface-container transition-colors">Year</button>
            </div>
          </div>
          <div className="flex-1 relative w-full mt-4">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 250">
              <line stroke="#E5E7EB" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="800" y1="50" y2="50" />
              <line stroke="#E5E7EB" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="800" y1="100" y2="100" />
              <line stroke="#E5E7EB" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="800" y1="150" y2="150" />
              <line stroke="#E5E7EB" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="800" y1="200" y2="200" />
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={chartAreaPath} fill="url(#chartGradient)" />
              <path className="chart-line" d={chartLinePath} fill="none" stroke="#4F46E5" strokeWidth="3" />
              {chartPoints.slice(1, -1).map(p => (
                <circle key={p.x} cx={p.x} cy={p.y} fill="#fff" r="4" stroke="#4F46E5" strokeWidth="2" />
              ))}
            </svg>
            <div className="absolute bottom-0 left-0 w-full flex justify-between px-4 font-label-sm text-label-sm text-on-surface-variant translate-y-6">
              <span>1st</span>
              <span>5th</span>
              <span>10th</span>
              <span>15th</span>
              <span>20th</span>
              <span>25th</span>
              <span>30th</span>
            </div>
          </div>
        </div>

        {/* Upcoming Settlements */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-ambient h-[400px] flex flex-col overflow-hidden">
          <div className="p-lg border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Upcoming Settlements</h3>
            <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
          </div>
          <div className="flex-1 overflow-y-auto p-md flex flex-col gap-md">
            {upcomingSettlements.map((s, i) => (
              <div key={i} className={`bg-surface rounded-lg p-md border border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low transition-colors cursor-pointer group ${s.faded ? 'opacity-70' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 flex items-center justify-center text-on-surface font-bold ${s.name === 'Tahoe Trip' ? 'bg-surface-container-high' : 'bg-primary/20'}`}>
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-bold group-hover:text-primary transition-colors">{s.name}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{s.due}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-label-md text-label-md font-bold ${s.tone === 'receive' ? 'text-primary-container' : 'text-error'}`}>{s.amount}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{s.side}</p>
                  </div>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-2 mt-3">
                  <div className={`${s.progressColor} h-2 rounded-full`} style={{ width: `${s.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Recent Expenses + Recent Settlements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Recent Expenses */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-ambient overflow-hidden">
          <div className="p-lg border-b border-outline-variant/20 flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Expenses</h3>
            <button className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors">View All</button>
          </div>
          <ul className="divide-y divide-outline-variant/20">
            {recentExpenses.map((e, i) => (
              <li key={i} className="p-md hover:bg-surface-container-low transition-colors flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">{e.icon}</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">{e.title}</p>
                    <div className="font-label-sm text-label-sm text-on-surface-variant mt-1 flex items-center gap-2">
                      <span>{e.meta}</span>
                      <span>•</span>
                      <span>{e.sub}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-md">
                  <div className="hidden sm:flex -space-x-2">
                    {e.participants > 1 ? (
                      <>
                        <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-surface bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">A</div>
                        <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-surface bg-secondary-container text-on-surface text-[10px] font-bold flex items-center justify-center">B</div>
                        {e.participants > 2 && (
                          <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-surface flex items-center justify-center bg-surface-container-highest text-[10px] font-bold">+{e.participants - 2}</div>
                        )}
                      </>
                    ) : (
                      <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-surface bg-secondary text-on-secondary text-[10px] font-bold flex items-center justify-center">S</div>
                    )}
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">{e.amount}</p>
                    <p className={`font-label-sm text-label-sm ${e.tagClass}`}>{e.tag}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Settlements Timeline */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-ambient overflow-hidden">
          <div className="p-lg border-b border-outline-variant/20 flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Settlements</h3>
          </div>
          <div className="p-lg">
            <div className="relative border-l-2 border-outline-variant/30 ml-6 pb-md">
              <div className="mb-xl relative pl-md">
                <div className="absolute -left-[25px] top-0 w-12 h-12 rounded-full bg-surface-container-lowest border-2 border-surface flex items-center justify-center z-10">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-success">
                    <span className="material-symbols-outlined text-[16px] text-green-600">check_circle</span>
                  </div>
                </div>
                <div className="bg-surface rounded-lg p-md border border-outline-variant/20 shadow-sm ml-2">
                  <p className="font-body-md text-body-md text-on-surface">
                    <span className="font-bold">Mike R.</span> paid you <span className="font-bold text-primary-container">$45.00</span>
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">2 hours ago • Venmo</p>
                </div>
              </div>
              <div className="relative pl-md">
                <div className="absolute -left-[25px] top-0 w-12 h-12 rounded-full bg-surface-container-lowest border-2 border-surface flex items-center justify-center z-10">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                  </div>
                </div>
                <div className="bg-surface rounded-lg p-md border border-outline-variant/20 shadow-sm ml-2">
                  <p className="font-body-md text-body-md text-on-surface">
                    You paid <span className="font-bold">Tahoe Trip Group</span> <span className="font-bold text-error">$120.00</span>
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Yesterday • Bank Transfer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
