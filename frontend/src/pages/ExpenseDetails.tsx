import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { expensesApi } from '../lib/api/expenses'
import { formatMoney } from '../lib/money'
import { formatDate } from '../lib/dates'
import { Skeleton, Button } from '../components/ui'
import { useToast } from '../components/ui'

const CATEGORY_ICONS: Record<string, string> = {
  Food: 'restaurant',
  Transport: 'directions_car',
  Shopping: 'shopping_bag',
  Bills: 'receipt_long',
  Entertainment: 'celebration',
  Other: 'category',
}

export function ExpenseDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { data, loading, refetch } = useApi(() => expensesApi.get(id), [id])
  const remove = useMutation((eid: string) => expensesApi.remove(eid))
  const restore = useMutation((eid: string) => expensesApi.restore(eid))
  const [deleted, setDeleted] = useState(false)

  const handleDelete = async () => {
    try {
      await remove.mutate(id)
      setDeleted(true)
      addToast('Expense deleted', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
  }

  const handleRestore = async () => {
    try {
      await restore.mutate(id)
      setDeleted(false)
      addToast('Expense restored', 'success')
      refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to restore', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-lg max-w-content">
        <Skeleton height={48} />
        <Skeleton height={200} />
      </div>
    )
  }

  if (!data) {
    return <div className="max-w-content"><p className="font-body-md text-body-md text-on-surface-variant">Expense not found.</p></div>
  }

  return (
    <div className="flex flex-col gap-xl max-w-content">
      {deleted && (
        <div className="tint-coral flex flex-wrap items-center justify-between gap-md rounded-xl px-lg py-md">
          <p className="font-body-md">This expense was deleted. You can still restore it.</p>
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={handleRestore} disabled={restore.loading}>Undo</Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>Back to group</Button>
          </div>
        </div>
      )}
      <div className="surface-card p-xl">
        <div className="flex items-start justify-between gap-md">
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">{CATEGORY_ICONS[data.category ?? ''] ?? 'category'}</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">{data.description}</h2>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {data.category ?? 'Other'} · {formatDate(data.expenseDate)} · paid by {data.paidByName}
              </p>
            </div>
          </div>
          <div className="flex gap-md">
            {data.canEdit && (
              <Button variant="primary" onClick={() => navigate(`/expenses/add?edit=${data.id}`)}>Edit</Button>
            )}
            {data.canEdit && (
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            )}
          </div>
        </div>
        <p className="num mt-lg font-headline-lg text-headline-lg text-on-surface">{formatMoney(data.amountPaise, data.currency)}</p>
      </div>

      <div className="surface-card p-xl">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Split ({data.splitMode})</h3>
        <div className="flex flex-col gap-sm">
          {data.splits.map(s => (
            <div key={s.userId} className="flex items-center justify-between p-md rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-md">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-label-sm text-on-surface">
                  {s.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <span className="font-label-md text-label-md text-on-surface">{s.name}</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface">{formatMoney(s.amountPaise, data.currency)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
