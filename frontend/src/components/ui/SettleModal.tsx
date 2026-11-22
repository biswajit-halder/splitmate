import { useEffect, useMemo, useRef, useState } from 'react'
import { settlementsApi } from '../../lib/api/settlements'
import { balancesApi } from '../../lib/api/balances'
import { toPaise, formatMoney } from '../../lib/money'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from './Toast'
import { Modal } from './Modal'
import { Button } from './Button'
import { Select } from './Select'

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

  // Pairwise position: negative means "I owe them", positive means "they owe me".
  const myBalanceMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of balances.data?.myBalances ?? []) map.set(b.userId, b.netPaise)
    return map
  }, [balances.data])

  // Only members with an actual pairwise debt can be settled with.
  const eligibleMembers = useMemo(
    () => members.filter(m => m.userId !== user?.id && myBalanceMap.get(m.userId)),
    [members, user?.id, myBalanceMap]
  )

  const selectedBalance = toUserId ? (myBalanceMap.get(toUserId) ?? 0) : 0
  const iOweThem = selectedBalance < 0
  const theyOweMe = selectedBalance > 0

  // Preselect the requested member once balances have loaded.
  useEffect(() => {
    if (!open) return
    if (preselectedUserId && eligibleMembers.some(m => m.userId === preselectedUserId)) {
      setToUserId(preselectedUserId)
    }
  }, [open, preselectedUserId, eligibleMembers])

  useEffect(() => {
    if (!open || !toUserId) return
    if (!eligibleMembers.some(m => m.userId === toUserId)) {
      setToUserId(eligibleMembers.length === 1 ? eligibleMembers[0].userId : '')
    }
  }, [open, toUserId, eligibleMembers])

  // Pre-fill the amount with the outstanding balance unless the user edited it.
  useEffect(() => {
    if (!open || !toUserId || userEditedAmount.current) return
    setAmount((Math.abs(selectedBalance) / 100).toFixed(2))
  }, [open, toUserId, selectedBalance])

  const reset = () => {
    setToUserId('')
    setAmount('')
    setMethod(PAYMENT_METHODS[0])
    setNote('')
    userEditedAmount.current = false
  }

  const handleSubmit = async () => {
    if (!toUserId || !amount || !groupId || !user) return
    const amountPaise = toPaise(amount)
    const outstanding = Math.abs(selectedBalance)
    if (amountPaise <= 0) {
      addToast('Enter a valid amount', 'error')
      return
    }
    if (amountPaise > outstanding) {
      addToast(`Amount cannot be more than ${formatMoney(outstanding)}`, 'error')
      return
    }
    setSubmitting(true)
    try {
      // The payer is whoever owes the money, so a settlement always clears a
      // debt instead of creating one.
      await settlementsApi.create(groupId, {
        payerId: iOweThem ? user.id : toUserId,
        payeeId: iOweThem ? toUserId : user.id,
        amountPaise,
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

  const directionLabel = iOweThem ? 'Pay To' : theyOweMe ? 'Collect From' : 'Member'
  const actionLabel = iOweThem ? 'Record Payment' : theyOweMe ? 'Record Payment Received' : 'Record Settlement'

  return (
    <Modal isOpen={open} onClose={handleClose} title={`Settle Up — ${groupName}`}>
      <div className="flex flex-col gap-lg">
        <div className="flex flex-col gap-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">{directionLabel}</label>
          <Select
            value={toUserId}
            onChange={(value) => {
              userEditedAmount.current = false
              setToUserId(value)
            }}
            placeholder={balances.loading ? 'Loading members…' : 'Select a member'}
            options={eligibleMembers.map(m => ({ value: m.userId, label: m.name }))}
          />
          {toUserId && !balances.loading && (
            <span className={`font-body-sm text-body-sm ${
              iOweThem ? 'text-error' :
              theyOweMe ? 'text-success' :
              'text-on-surface-variant'
            }`}>
              {iOweThem && `You owe them ${formatMoney(Math.abs(selectedBalance))}`}
              {theyOweMe && `They owe you ${formatMoney(selectedBalance)}`}
              {selectedBalance === 0 && 'No outstanding balance'}
            </span>
          )}
          {!balances.loading && eligibleMembers.length === 0 && (
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Nobody in this group owes you money right now.
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
          <Select
            value={method}
            onChange={setMethod}
            options={PAYMENT_METHODS.map(m => ({ value: m, label: m }))}
          />
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
            {submitting ? 'Recording...' : actionLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
