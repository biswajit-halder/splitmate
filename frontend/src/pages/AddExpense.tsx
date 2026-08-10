import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

type SplitMode = 'equally' | 'exact' | 'percent'
type ParticipantKey = 'you' | 'alex' | 'sam'

interface Participant {
  key: ParticipantKey
  name: string
  initials: string
  avatarBg: string
  avatarTextColor: string
  amount: string
  included: boolean
}

const initialParticipants: Participant[] = [
  { key: 'you', name: 'You', initials: 'YO', avatarBg: 'bg-primary-container', avatarTextColor: 'text-on-primary', amount: '$25.00', included: true },
  { key: 'alex', name: 'Alex L.', initials: 'AL', avatarBg: 'bg-secondary-container', avatarTextColor: 'text-on-secondary-container', amount: '$25.00', included: true },
  { key: 'sam', name: 'Sam R.', initials: 'SR', avatarBg: 'bg-tertiary-container', avatarTextColor: 'text-on-tertiary-container', amount: '--', included: false },
]

export function AddExpensePage() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('2026-08-08')
  const [splitMode, setSplitMode] = useState<SplitMode>('equally')
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants)

  useEffect(() => setMounted(true), [])

  const toggleParticipant = (key: ParticipantKey) => {
    setParticipants(prev =>
      prev.map(p => (p.key === key ? { ...p, included: !p.included, amount: !p.included ? '$25.00' : '--' } : p))
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/dashboard')
  }

  const close = () => navigate('/dashboard')

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-md">
      {/* Overlay */}
      <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm" onClick={close} />

      {/* Modal Card */}
      <form
        onSubmit={handleSave}
        className="relative z-10 w-full max-w-lg bg-surface rounded-xl shadow-soft flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant/30 shrink-0">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Add Expense</h2>
          <button
            type="button"
            onClick={close}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-sm rounded-full hover:bg-surface-container"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-lg space-y-xl">
          {/* Amount */}
          <div className="flex flex-col items-center justify-center gap-sm py-md">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Total Amount
            </label>
            <div className="flex items-baseline gap-xs">
              <span className="font-headline-lg text-headline-lg text-on-surface-variant">$</span>
              <input
                autoFocus
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-48 text-center font-display-lg text-display-lg text-on-surface bg-transparent border-none focus:ring-0 placeholder-outline-variant p-0 m-0 outline-none"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-xs px-sm py-xs bg-surface-container rounded-full hover:bg-surface-container-high transition-colors"
            >
              <span className="font-label-md text-label-md text-on-surface">USD</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
            </button>
          </div>

          {/* Description + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Description</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  receipt_long
                </span>
                <input
                  type="text"
                  placeholder="e.g. Dinner at Mario's"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full h-12 pl-11 pr-md rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                />
              </div>
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Date</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  calendar_today
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full h-12 pl-11 pr-md rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* Paid By + Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Paid By</label>
              <button
                type="button"
                className="flex items-center justify-between w-full h-12 px-md rounded-lg border border-outline-variant bg-surface hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-sm">
                  <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm">
                    YO
                  </div>
                  <span className="font-body-md text-body-md text-on-surface">You</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
              </button>
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Group</label>
              <button
                type="button"
                className="flex items-center justify-between w-full h-12 px-md rounded-lg border border-outline-variant bg-surface hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary">group</span>
                  <span className="font-body-md text-body-md text-on-surface">Weekend Trip</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
              </button>
            </div>
          </div>

          {/* Split Details */}
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Split Details</label>
              <div className="flex bg-surface-container rounded-lg p-1">
                {(['equally', 'exact', 'percent'] as SplitMode[]).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSplitMode(mode)}
                    className={`px-sm py-1 rounded font-label-md text-label-md transition-colors ${
                      splitMode === mode
                        ? 'bg-surface shadow-sm text-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {mode === 'equally' ? 'Equally' : mode === 'exact' ? 'Exact' : '%'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-sm">
              {participants.map(p => (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => toggleParticipant(p.key)}
                  className={`w-full flex items-center justify-between p-sm rounded-lg border transition-colors text-left ${
                    p.included
                      ? 'border-primary/20 bg-primary/5'
                      : 'border-outline-variant/50 hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-md">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                        p.included ? 'bg-primary text-on-primary' : 'border border-outline-variant'
                      }`}
                    >
                      {p.included && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      )}
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full ${p.avatarBg} ${p.avatarTextColor} flex items-center justify-center font-label-md text-label-md`}
                    >
                      {p.initials}
                    </div>
                    <span className="font-body-md text-body-md text-on-surface font-medium">{p.name}</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant">{p.amount}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-lg py-md border-t border-outline-variant/30 flex gap-md justify-end bg-surface-container-lowest shrink-0">
          <button
            type="button"
            onClick={close}
            className="px-lg py-3 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-lg py-3 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:opacity-90 transition-opacity"
          >
            Save Expense
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}

