import { useEffect, useRef, useState } from 'react'
import { settlementsApi } from '../../lib/api/settlements'
import { balancesApi } from '../../lib/api/balances'
import { toPaise, formatMoney } from '../../lib/money'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from './Toast'
import { Modal } from './Modal'
import { Button } from './Button'

interface SettleModalProps {
  open: boolean
  onClose: () => void
  groupId: string
  groupName: string
  members: Array<{ userId: string; name: string }>
  onSettled: () => void
  preselectedUserId?: string
  preselectedUserName?: string
}

const PAYMENT_METHODS = ['UPI', 'Bank Transfer', 'Cash', 'Other'] as const

export function SettleModal({ open, onClose, groupId, groupName, members, onSettled, preselectedUserId }: SettleModalProps) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [toUserId, setToUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const userEditedAmount = useRef(false)

  const balances = useApi(
    (_signal) => groupId ? balancesApi.group(groupId) : Promise.resolve(null),
    [groupId],
  )

  const eligibleMembers = members.filter(m => m.userId !== user?.id)

  const memberBalanceMap = new Map<string, number>()
  if (balances.data?.members) {
    for (const member of balances.data.members) {
      memberBalanceMap.set(member.userId, member.netPaise)
    }
  }

  const selectedBalance = toUserId ? (memberBalanceMap.get(toUserId) ?? 0) : 0

  // Fix 1: Preselection — first useEffect sets toUserId when modal opens and members are available
  useEffect(() => {
    if (open && preselectedUserId && eligibleMembers.some(m => m.userId === preselectedUserId)) {
      setToUserId(preselectedUserId)
    }
  }, [open, preselectedUserId, eligibleMembers])

  // Fix 1b: If toUserId is set but doesn't match any eligible member (stale after members load), re-apply preselection
  useEffect(() => {
    if (open && toUserId && preselectedUserId && !eligibleMembers.some(m => m.userId === toUserId)) {
      if (eligibleMembers.some(m => m.userId === preselectedUserId)) {
        setToUserId(preselectedUserId)
      }
    }
  }, [open, toUserId, preselectedUserId, eligibleMembers])

  // Fix 2: Pre-fill amount with outstanding balance when member changes (unless user manually edited)
  useEffect(() => {
    if (!open || !toUserId || userEditedAmount.current) return
    setAmount(Math.abs(selectedBalance / 100).toFixed(2))
  }, [open, toUserId, selectedBalance])

  const reset = () => {
    setToUserId('')
    setAmount('')
    setMethod(PAYMENT_METHODS[0])
    setNote('')
    userEditedAmount.current = false
  }

  const handleSubmit = async () => {
    if (!toUserId || !amount || !groupId) return
    setSubmitting(true)
    try {
      await settlementsApi.create(groupId, {
        payerId: user?.id ?? '',
        payeeId: toUserId,
        amountPaise: toPaise(amount),
        method,
        note: note || undefined,
      })
      addToast('Settlement recorded', 'success')
      reset()
      onClose()
      onSettled()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to record settlement', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={open} onClose={handleClose} title={`Settle Up \u2014 ${groupName}`}>
      <div className="flex flex-col gap-lg">
        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Pay To</label>
          <select
            value={toUserId}
            onChange={e => setToUserId(e.target.value)}
            className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface font-body-md text-body-md text-on-surface"
          >
            <option value="">Select a member</option>
            {eligibleMembers.map(m => (
              <option key={m.userId} value={m.userId}>{m.name}</option>
            ))}
          </select>
          {toUserId && !balances.loading && (
            <span className={`font-body-sm text-body-sm ${
              selectedBalance > 0 ? 'text-success' :
              selectedBalance < 0 ? 'text-error' :
              'text-on-surface-variant'
            }`}>
              {selectedBalance > 0 && `They owe you ${formatMoney(selectedBalance)}`}
              {selectedBalance < 0 && `You owe them ${formatMoney(Math.abs(selectedBalance))}`}
              {selectedBalance === 0 && 'No outstanding balance'}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Amount</label>
          <div className="flex items-center gap-md px-md rounded-lg border border-line/40 bg-surface">
            <span className="text-outline font-body-md text-body-md">{'\u20B9'}</span>
            <input
              value={amount}
              onChange={e => {
                userEditedAmount.current = true
                setAmount(e.target.value)
              }}
              inputMode="decimal"
              placeholder="0.00"
              className="w-full h-12 bg-transparent text-on-surface font-body-md text-body-md outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Payment Method</label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface font-body-md text-body-md text-on-surface"
          >
            {PAYMENT_METHODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Note (optional)</label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Lunch split, taxi fare"
            className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface font-body-md text-body-md text-on-surface outline-none"
          />
        </div>

        <div className="flex justify-end gap-md">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !toUserId || !amount}>
            {submitting ? 'Recording...' : 'Record Settlement'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
