import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { groupsApi } from '../lib/api/groups'
import { expensesApi } from '../lib/api/expenses'
import { toPaise, fromPaise } from '../lib/money'
import { Button, Select } from '../components/ui'
import { useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'

type SplitMode = 'equally' | 'exact' | 'percent'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other']

export function AddExpensePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()
  const [params] = useSearchParams()
  const editId = params.get('edit')
  const isEditMode = !!editId
  const groups = useApi(() => groupsApi.list())

  const [groupId, setGroupId] = useState(params.get('group') ?? '')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [paidBy, setPaidBy] = useState(user?.id ?? '')
  const [splitMode, setSplitMode] = useState<SplitMode>('equally')
  const [exact, setExact] = useState<Record<string, string>>({})
  const [percentages, setPercentages] = useState<Record<string, string>>({})

  const editExpense = useApi(
    () => (editId ? expensesApi.get(editId) : Promise.resolve(null)),
    [editId],
  )

  const groupDetail = useApi(
    () => (groupId ? groupsApi.get(groupId) : Promise.resolve(null)),
    [groupId],
  )
  const members = groupDetail.data?.members ?? []

  useEffect(() => {
    const expense = editExpense.data
    if (!expense) return
    setGroupId(expense.groupId)
    setDescription(expense.description)
    setAmount(fromPaise(expense.amountPaise))
    setCategory(expense.category ?? 'Food')
    setPaidBy(expense.paidBy)
    setSplitMode(expense.splitMode as SplitMode)
    if (expense.splitMode === 'exact') {
      const exactMap: Record<string, string> = {}
      for (const s of expense.splits) {
        exactMap[s.userId] = fromPaise(s.amountPaise)
      }
      setExact(exactMap)
    } else if (expense.splitMode === 'percent') {
      const pctMap: Record<string, string> = {}
      for (const s of expense.splits) {
        pctMap[s.userId] = s.weight != null ? String(s.weight) : ''
      }
      setPercentages(pctMap)
    }
  }, [editExpense.data])

  const rawTotalPercent = members.reduce((s, m) => s + (parseFloat(percentages[m.userId]) || 0), 0)
  const roundedTotalPercent = members.reduce((s, m) => s + Math.round(parseFloat(percentages[m.userId]) || 0), 0)
  const percentSumValid = roundedTotalPercent === 100

  const create = useMutation((body: Parameters<typeof expensesApi.create>[1]) =>
    expensesApi.create(groupId, body),
  )

  const update = useMutation((body: Parameters<typeof expensesApi.update>[1]) =>
    expensesApi.update(editId!, body),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId || !description || !amount) {
      addToast('Fill in group, description and amount', 'error')
      return
    }
    const amountPaise = toPaise(amount)
    if (amountPaise <= 0) {
      addToast('Enter a valid amount', 'error')
      return
    }

    let participants: { userId: string; amountPaise?: number; weight?: number }[]
    if (splitMode === 'equally') {
      participants = members.map(m => ({ userId: m.userId }))
    } else if (splitMode === 'exact') {
      participants = members.map(m => ({ userId: m.userId, amountPaise: toPaise(exact[m.userId] ?? '0') }))
      const sum = participants.reduce((s, p) => s + (p.amountPaise ?? 0), 0)
      if (sum !== amountPaise) {
        addToast('Exact splits must sum to the total', 'error')
        return
      }
    } else {
      if (!percentSumValid) {
        addToast('Percentages must total 100%', 'error')
        return
      }
      participants = members.map(m => ({
        userId: m.userId,
        weight: Math.round(parseFloat(percentages[m.userId]) || 0),
      }))
    }

    try {
      const payload = {
        description,
        amountPaise,
        paidBy: paidBy || user?.id || '',
        splitMode,
        participants,
        category,
      }
      if (isEditMode) {
        await update.mutate(payload)
        addToast('Expense updated', 'success')
      } else {
        await create.mutate(payload)
        addToast('Expense added', 'success')
      }
      navigate(`/groups/${groupId}`)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to save expense', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-xl">
      <div>
        <p className="eyebrow mb-2">{isEditMode ? 'Update record' : 'New record'}</p>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{isEditMode ? 'Edit Expense' : 'Add Expense'}</h1>
        <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
          {isEditMode ? 'Update the details of this shared expense.' : 'Record a shared expense and split it your way.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="surface-card flex flex-col gap-xl p-xl">
        <div className="flex flex-col gap-xs">
          <label className="eyebrow">Group</label>
          <Select
            value={groupId}
            onChange={setGroupId}
            placeholder="Select a group"
            options={(groups.data ?? []).map(g => ({ value: g.id, label: g.name }))}
          />
        </div>

        <div className="flex flex-col gap-xs">
          <label className="eyebrow">Description</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Dinner at restaurant"
            className="h-11 w-full rounded-lg border border-line bg-surface px-md font-body-md outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="flex flex-col gap-xs">
          <label className="eyebrow">Amount</label>
          <div className="flex h-11 items-center gap-md rounded-lg border border-line bg-surface px-md transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <span className="text-on-surface-variant">₹</span>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="num h-full w-full bg-transparent font-body-md text-body-md text-on-surface outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="eyebrow">Category</label>
            <Select
              value={category}
              onChange={setCategory}
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="eyebrow">Paid by</label>
            <Select
              value={paidBy}
              onChange={setPaidBy}
              options={[
                { value: user?.id ?? '', label: 'You' },
                ...members.filter(m => m.userId !== user?.id).map(m => ({ value: m.userId, label: m.name })),
              ]}
            />
          </div>
        </div>

        <div className="flex flex-col gap-xs">
          <label className="eyebrow">Split method</label>
          <div className="flex gap-sm rounded-xl bg-surface-container-low p-1">
            {(['equally', 'exact', 'percent'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setSplitMode(mode)}
                className={`flex-1 rounded-lg px-md py-2 font-label-md capitalize transition-colors ${
                  splitMode === mode
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {splitMode === 'exact' && members.length > 0 && (
          <div className="flex flex-col gap-sm">
            {members.map(m => (
              <div key={m.userId} className="flex items-center gap-md">
                <span className="flex-1 font-label-md text-label-md text-on-surface">{m.name}</span>
                <div className="flex h-10 items-center gap-xs rounded-lg border border-line bg-surface px-md transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                  <span className="text-on-surface-variant">₹</span>
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

        {splitMode === 'percent' && members.length > 0 && (
          <div className="flex flex-col gap-sm">
            {members.map(m => {
              const pct = parseFloat(percentages[m.userId]) || 0
              const calculatedAmount = amount ? (parseFloat(amount) * pct / 100).toFixed(2) : '0.00'
              return (
                <div key={m.userId} className="flex items-center gap-md">
                  <span className="flex-1 font-label-md text-label-md text-on-surface">{m.name}</span>
                  <span className="num w-20 text-right font-body-sm text-body-sm text-on-surface-variant">₹{calculatedAmount}</span>
                  <div className="flex h-10 items-center gap-xs rounded-lg border border-line bg-surface px-md transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                    <input
                      value={percentages[m.userId] ?? ''}
                      onChange={e => setPercentages(prev => ({ ...prev, [m.userId]: e.target.value }))}
                      inputMode="decimal"
                      placeholder="0"
                      className="w-16 h-10 bg-transparent text-on-surface outline-none text-right"
                    />
                    <span className="text-on-surface-variant">%</span>
                  </div>
                </div>
              )
            })}
            {!percentSumValid && rawTotalPercent > 0 && (
              <p className="text-body-sm text-error mt-xs">
                Percentages must total 100% (currently {rawTotalPercent.toFixed(1)}%)
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-md">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={create.loading || update.loading}>{create.loading || update.loading ? 'Saving…' : isEditMode ? 'Save Changes' : 'Add Expense'}</Button>
        </div>
      </form>
    </div>
  )
}
