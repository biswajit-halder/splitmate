import { useParams, useNavigate } from 'react-router-dom'
import { Card, Avatar } from '../components/ui'

const expenses = [
  { icon: 'flight', desc: 'Flights to Paris', paidBy: 'Alex', date: '12 Aug', amount: 1200.00, split: 'You owe $300.00', isOwed: false },
  { icon: 'hotel', desc: 'Airbnb - 5 Nights', paidBy: 'You', date: '10 Aug', amount: 850.00, split: 'Lent $637.50', isOwed: true },
  { icon: 'restaurant', desc: 'Dinner at Le Jules Verne', paidBy: 'Sarah', date: '14 Aug', amount: 420.00, split: 'You owe $105.00', isOwed: false },
]

export function GroupDetailPage() {
  useParams()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-xl">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/groups')}
        className="flex items-center gap-xs text-on-surface-variant hover:text-on-surface transition-colors self-start"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        <span className="font-label-md text-label-md">Back to Groups</span>
      </button>

      {/* Group Header */}
      <div className="flex items-center justify-between flex-wrap gap-md">
        <div className="flex items-center gap-md">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary">flight</span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Europe Summer 2025</h1>
            <div className="flex items-center gap-xs mt-xs">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Group Trip</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">•</span>
              <span className="flex items-center gap-xs font-body-sm text-body-sm text-primary">
                <span className="material-symbols-outlined text-[14px]">person_add</span>
                +2 Members
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-sm">
          <button className="flex items-center gap-xs px-md py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Export Summary
          </button>
          <button
            onClick={() => navigate('/expenses/add')}
            className="flex items-center gap-xs px-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Expense
          </button>
        </div>
      </div>

      {/* Total Group Spend */}
      <Card>
        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Total Group Spend</p>
        <p className="font-display-lg text-display-lg text-on-surface">$4,850.00</p>
      </Card>

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        {/* Recent Expenses */}
        <Card>
          <div className="flex items-center justify-between mb-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Expenses</h3>
            <button className="font-label-md text-label-md text-primary hover:text-primary/80 transition-colors">View All</button>
          </div>
          <div className="flex flex-col gap-md">
            {expenses.map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-md rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant">{e.icon}</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{e.desc}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Paid by {e.paidBy} • {e.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-label-md text-label-md text-on-surface">${e.amount.toFixed(2)}</p>
                  <p className={`font-body-sm text-body-sm ${e.isOwed ? 'text-success' : 'text-error'}`}>{e.split}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Your Balance */}
        <Card>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Your Balance</h3>
          <div className="flex flex-col gap-md">
            <div className="flex justify-between items-center p-md rounded-lg bg-error/5">
              <span className="font-label-md text-label-md text-on-surface-variant">Total You Owe</span>
              <span className="font-headline-sm text-headline-sm text-error">$405.00</span>
            </div>
            <div className="flex justify-between items-center p-md rounded-lg bg-success/5">
              <span className="font-label-md text-label-md text-on-surface-variant">Total You're Owed</span>
              <span className="font-headline-sm text-headline-sm text-success">$637.50</span>
            </div>

            <div className="mt-md">
              <p className="font-label-md text-label-md text-on-surface-variant mb-md">Who owes whom</p>
              <div className="flex flex-col gap-md">
                <div className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-md">
                    <Avatar initials="A" size="sm" />
                    <span className="font-label-md text-label-md text-on-surface">Alex</span>
                  </div>
                  <span className="font-label-md text-label-md text-success">owes you $212.50</span>
                </div>
                <div className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-md">
                    <Avatar initials="S" size="sm" />
                    <span className="font-label-md text-label-md text-on-surface">Sarah</span>
                  </div>
                  <span className="font-label-md text-label-md text-error">you owe $105.00</span>
                </div>
              </div>
            </div>

            <button className="mt-md w-full py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity">
              Settle Up
            </button>
          </div>
        </Card>
      </div>

      {/* Export Summary */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Export Summary</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Download a detailed CSV of all group transactions.</p>
          </div>
          <button className="flex items-center gap-xs px-md py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download CSV
          </button>
        </div>
      </Card>
    </div>
  )
}
