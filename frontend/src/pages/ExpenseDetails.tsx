import { useParams, useNavigate } from 'react-router-dom'
import { Card, Badge } from '../components/ui'

const splitDetails = [
  { name: 'You', initials: 'YO', amount: 60.00, status: 'paid' as const, avatarBg: 'bg-primary-container', avatarText: 'text-on-primary' },
  { name: 'Sarah Jenkins', initials: 'SJ', amount: 30.00, status: 'owes' as const, avatarBg: 'bg-secondary-container', avatarText: 'text-on-secondary-container' },
  { name: 'Mike Ross', initials: 'MR', amount: 30.00, status: 'owes' as const, avatarBg: 'bg-tertiary-container', avatarText: 'text-on-tertiary-container' },
]

const activityLog = [
  { icon: 'check_circle', text: 'You paid $60.00', time: 'Today, 8:50 PM', status: 'completed' },
  { icon: 'receipt_long', text: 'Expense created', time: 'Today, 8:45 PM', status: 'completed' },
  { icon: 'schedule', text: 'Sarah Jenkins - pending', time: 'Waiting for payment', status: 'pending' },
  { icon: 'schedule', text: 'Mike Ross - pending', time: 'Waiting for payment', status: 'pending' },
]

export function ExpenseDetailsPage() {
  useParams()
  const navigate = useNavigate()

  const totalPaid = splitDetails.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0)
  const totalOwed = splitDetails.filter(s => s.status === 'owes').reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="flex flex-col gap-xl max-w-2xl">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-xs text-on-surface-variant hover:text-on-surface transition-colors self-start"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        <span className="font-label-md text-label-md">Back to Activity</span>
      </button>

      {/* Expense Header */}
      <div className="flex items-start gap-md">
        <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-on-primary text-[28px]">restaurant</span>
        </div>
        <div className="flex-1">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Dinner at Mario's</h1>
          <div className="flex items-center gap-md mt-xs flex-wrap">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">calendar_today</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Oct 25, 2023</span>
            </div>
            <Badge variant="warning">Partially Settled</Badge>
          </div>
        </div>
      </div>

      {/* Amount Card */}
      <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg text-center">
        <p className="font-headline-lg text-headline-lg text-on-surface">$120.00</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Total Amount</p>
      </div>

      {/* Split Details */}
      <Card>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Split Details</h3>
        <div className="flex flex-col gap-md">
          {splitDetails.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-md">
                <div className={`w-10 h-10 rounded-full ${s.avatarBg} ${s.avatarText} flex items-center justify-center font-label-md text-label-md`}>
                  {s.initials}
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface">{s.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {s.status === 'paid' ? 'Paid their share' : 'Owes their share'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <span className="font-label-md text-label-md text-on-surface">${s.amount.toFixed(2)}</span>
                <Badge variant={s.status === 'paid' ? 'success' : 'warning'}>
                  {s.status === 'paid' ? 'Paid' : 'Owes'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-lg pt-lg border-t border-outline-variant/30 flex flex-col gap-sm">
          <div className="flex justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Total Paid</span>
            <span className="font-label-md text-label-md text-success">${totalPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Total Owed</span>
            <span className="font-label-md text-label-md text-error">${totalOwed.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Settlement Status</span>
            <span className="font-label-md text-label-md text-on-surface">{totalOwed > 0 ? 'Partially Settled' : 'Fully Settled'}</span>
          </div>
        </div>
      </Card>

      {/* Activity Log */}
      <Card>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Activity</h3>
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-outline-variant/30" />
          <div className="flex flex-col gap-lg">
            {activityLog.map((item, i) => (
              <div key={i} className="flex gap-md relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 ${
                  item.status === 'completed' ? 'bg-success' : 'bg-surface-container-high'
                }`}>
                  <span className={`material-symbols-outlined text-[18px] ${
                    item.status === 'completed' ? 'text-on-success' : 'text-on-surface-variant'
                  }`}>{item.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">{item.text}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-md">
        <button className="flex-1 flex items-center justify-center gap-xs px-md py-3 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Edit
        </button>
        <button className="flex-1 flex items-center justify-center gap-xs px-md py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          Settle Up
        </button>
        <button className="flex items-center justify-center gap-xs px-md py-3 rounded-lg border border-error/30 text-error font-label-md text-label-md hover:bg-error/5 transition-colors">
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  )
}
