import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { groupsApi } from '../lib/api/groups'
import { expensesApi } from '../lib/api/expenses'
import { toPaise } from '../lib/money'
import { Button } from '../components/ui'
import { useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'

type SplitMode = 'equally' | 'exact'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other']

export function AddExpensePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()
  const [params] = useSearchParams()
  const groups = useApi(() => groupsApi.list())

  const [groupId, setGroupId] = useState(params.get('group') ?? '')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [paidBy, setPaidBy] = useState(user?.id ?? '')
  const [splitMode, setSplitMode] = useState<SplitMode>('equally')
  const [exact, setExact] = useState<Record<string, string>>({})

  const groupDetail = useApi(
    () => (groupId ? groupsApi.get(groupId) : Promise.resolve(null)),
    [groupId],
  )
  const members = groupDetail.data?.members ?? []

  const create = useMutation((body: Parameters<typeof expensesApi.create>[1]) =>
    expensesApi.create(groupId, body),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId || !description || !amount) {
      addToast('Fill in group, description and amount', 'error' as never)
      return
    }
    const amountPaise = toPaise(amount)
    if (amountPaise <= 0) {
      addToast('Enter a valid amount', 'error' as never)
      return
    }

    let participants: { userId: string; amountPaise?: number }[]
    if (splitMode === 'equally') {
      participants = members.map(m => ({ userId: m.userId }))
    } else {
      participants = members.map(m => ({ userId: m.userId, amountPaise: toPaise(exact[m.userId] ?? '0') }))
      const sum = participants.reduce((s, p) => s + (p.amountPaise ?? 0), 0)
      if (sum !== amountPaise) {
        addToast('Exact splits must sum to the total', 'error' as never)
        return
      }
    }

    try {
      await create.mutate({
        description,
        amountPaise,
        paidBy: paidBy || user?.id || '',
        splitMode,
        participants,
        category,
      })
      addToast('Expense added', 'success')
      navigate(`/groups/${groupId}`)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to add expense', 'error' as never)
    }
  }

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <div>
        <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Add Expense</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Record a shared expense.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-line/40 p-lg flex flex-col gap-lg">
        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Group</label>
          <select
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
          >
            <option value="">Select a group</option>
            {(groups.data ?? []).map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Description</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Dinner at restaurant"
            className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Amount</label>
          <div className="flex items-center gap-md px-md rounded-lg border border-line/40 bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
            <span className="text-outline">₹</span>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="w-full h-12 bg-transparent text-on-surface font-body-md text-body-md outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Paid by</label>
            <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors">
              <option value={user?.id ?? ''}>You</option>
              {members.filter(m => m.userId !== user?.id).map(m => (
                <option key={m.userId} value={m.userId}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Split</label>
          <div className="flex gap-md">
            <button type="button" onClick={() => setSplitMode('equally')} className={`px-md py-md rounded-lg border ${splitMode === 'equally' ? 'border-primary text-primary' : 'border-line/40 text-on-surface-variant'}`}>Equally</button>
            <button type="button" onClick={() => setSplitMode('exact')} className={`px-md py-md rounded-lg border ${splitMode === 'exact' ? 'border-primary text-primary' : 'border-line/40 text-on-surface-variant'}`}>Exact</button>
          </div>
        </div>

        {splitMode === 'exact' && members.length > 0 && (
          <div className="flex flex-col gap-sm">
            {members.map(m => (
              <div key={m.userId} className="flex items-center gap-md">
                <span className="flex-1 font-label-md text-label-md text-on-surface">{m.name}</span>
                <div className="flex items-center gap-xs px-md rounded-lg border border-line/40 bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
                  <span className="text-outline">₹</span>
                  <input
                    value={exact[m.userId] ?? ''}
                    onChange={e => setExact(prev => ({ ...prev, [m.userId]: e.target.value }))}
                    inputMode="decimal"
                    className="w-28 h-10 bg-transparent text-on-surface outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-md">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={create.loading}>{create.loading ? 'Saving…' : 'Add Expense'}</Button>
        </div>
      </form>
    </div>
  )
}
