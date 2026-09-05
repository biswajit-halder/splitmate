import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { groupsApi } from '../lib/api/groups'
import { settlementsApi } from '../lib/api/settlements'
import { expensesApi } from '../lib/api/expenses'
import { balancesApi } from '../lib/api/balances'
import { formatMoney, toPaise } from '../lib/money'
import { Modal, Button, Skeleton, Badge, EmptyState, BlobAvatar, CategoryIcon, Select } from '../components/ui'
import { useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const CATEGORY_ICONS: Record<string, string> = {
  Food: 'restaurant',
  Transport: 'directions_car',
  Shopping: 'shopping_bag',
  Bills: 'receipt_long',
  Entertainment: 'celebration',
  Other: 'category',
}

export function GroupDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()

  const group = useApi(() => groupsApi.get(id), [id])
  const expenses = useApi(() => expensesApi.list(id), [id])
  const settlements = useApi(
    () => (group.data ? settlementsApi.list(id, group.data.name) : Promise.resolve([])),
    [id, group.data?.name],
  )
  const balances = useApi(() => balancesApi.group(id), [id])

  const [settleOpen, setSettleOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [memberId, setMemberId] = useState('')
  const [amount, setAmount] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null)
  const [confirmMessage, setConfirmMessage] = useState('')

  const createSettlement = useMutation((body: { payerId: string; payeeId: string; amountPaise: number }) =>
    settlementsApi.create(id, body),
  )
  const invite = useMutation((email: string) => groupsApi.invite(id, email))
  const deleteExpense = useMutation((expId: string) => expensesApi.remove(expId))
  const leaveGroupMutation = useMutation(() => groupsApi.leave(id))
  const removeMemberMutation = useMutation((userId: string) => groupsApi.removeMember(id, userId))

  const members = useMemo(
    () =>
      (balances.data?.members ?? group.data?.members ?? []).map(m => ({
        userId: 'userId' in m ? m.userId : (m as { id: string }).id,
        name: m.name,
        avatarBg: 'avatarBg' in m ? m.avatarBg : (m as { bgColor: string | null }).bgColor,
        netPaise: 'netPaise' in m ? m.netPaise : 0,
      })),
    [balances.data, group.data],
  )

  const handleSettle = async () => {
    if (!memberId || !amount) return
    try {
      await createSettlement.mutate({ payerId: user?.id ?? '', payeeId: memberId, amountPaise: toPaise(amount) })
      addToast('Settlement recorded', 'success')
      setSettleOpen(false)
      setMemberId('')
      setAmount('')
      settlements.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to settle', 'error' as never)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    try {
      await invite.mutate(inviteEmail.trim())
      addToast('Invite sent', 'success')
      setInviteEmail('')
      setInviteOpen(false)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to invite', 'error' as never)
    }
  }

  const handleDeleteExpense = async (expId: string) => {
    try {
      await deleteExpense.mutate(expId)
      addToast('Expense deleted', 'success')
      expenses.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete', 'error' as never)
    }
  }

  const handleConfirm = async () => {
    if (!confirmAction) return
    try {
      await confirmAction()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Action failed', 'error' as never)
    } finally {
      setConfirmOpen(false)
      setConfirmAction(null)
    }
  }

  const handleLeaveGroup = () => {
    setConfirmMessage('Are you sure you want to leave this group?')
    setConfirmAction(async () => {
      await leaveGroupMutation.mutate()
      addToast('You have left the group', 'success')
      navigate('/groups')
    })
    setConfirmOpen(true)
  }

  const handleRemoveMember = (memberName: string, memberUserId: string) => {
    setConfirmMessage(`Remove ${memberName} from this group?`)
    setConfirmAction(async () => {
      await removeMemberMutation.mutate(memberUserId)
      addToast(`${memberName} removed`, 'success')
      group.refetch()
      balances.refetch()
    })
    setConfirmOpen(true)
  }

  if (group.loading) {
    return (
      <div className="flex flex-col gap-lg max-w-content">
        <Skeleton height={48} />
        <Skeleton height={200} />
      </div>
    )
  }

  if (!group.data) {
    return <div className="max-w-content"><p className="font-body-md text-body-md text-on-surface-variant">Group not found.</p></div>
  }

  const g = group.data

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <div className="bg-surface rounded-xl border border-line/40 p-lg">
        <div className="flex items-center justify-between flex-wrap gap-md">
          <div className="flex items-center gap-md">
            <CategoryIcon category={g.type ?? 'home'} size={48} />
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">{g.name}</h2>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{g.type} · {g.members.length} members</p>
            </div>
          </div>
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={() => setInviteOpen(true)} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] leading-none">person_add</span> Invite
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/expenses/add?group=${g.id}`)} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] leading-none">add</span> Add Expense
            </Button>
            <Button onClick={() => setSettleOpen(true)} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] leading-none">payments</span> Settle Up
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-md mt-lg">
          <div className="bg-surface-container-low rounded-lg p-md">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Group Net</p>
            <p className="font-headline-sm text-headline-sm text-on-surface">{formatMoney(balances.data?.sumPaise ?? 0)}</p>
          </div>
          <div className="bg-surface-container-low rounded-lg p-md">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Expenses</p>
            <p className="font-headline-sm text-headline-sm text-on-surface">{expenses.data?.length ?? 0}</p>
          </div>
          <div className="bg-surface-container-low rounded-lg p-md">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Settlements</p>
            <p className="font-headline-sm text-headline-sm text-on-surface">{settlements.data?.length ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-surface rounded-xl border border-line/40 p-lg">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Members</h3>
        <div className="flex flex-col gap-sm">
          {members.map(m => (
            <div key={m.userId} className="flex items-center justify-between p-md rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-md">
                <BlobAvatar userId={m.userId} name={m.name} size={36} />
                <span className="font-label-md text-label-md text-on-surface">{m.name}{m.userId === user?.id ? ' (You)' : ''}</span>
              </div>
              <div className="flex items-center gap-md">
                <span className={`font-label-md text-label-md ${m.netPaise > 0 ? 'text-success' : m.netPaise < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                  {formatMoney(m.netPaise)}
                </span>
                {g.createdBy === user?.id && m.userId !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(m.name, m.userId)}
                    className="text-on-surface-variant hover:text-error p-xs transition-colors"
                    aria-label={`Remove ${m.name}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {g.createdBy !== user?.id && (
          <div className="mt-lg pt-md border-t border-line/40">
            <Button variant="danger" onClick={handleLeaveGroup} disabled={leaveGroupMutation.loading}>
              <span className="material-symbols-outlined text-[18px]">logout</span> Leave Group
            </Button>
          </div>
        )}
      </div>

      {/* Expenses */}
      <div className="bg-surface rounded-xl border border-line/40 p-lg">
        <div className="flex items-center justify-between mb-md">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Expenses</h3>
          <button onClick={() => navigate(`/expenses/add?group=${g.id}`)} className="font-label-sm text-label-sm text-primary">Add</button>
        </div>
        <div className="flex flex-col gap-sm">
          {(expenses.data ?? []).map(exp => (
            <div key={exp.id} className="flex items-center gap-md p-md rounded-lg bg-surface-container-low hover:bg-surface-container-low/70 transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[18px]">{CATEGORY_ICONS[exp.category ?? ''] ?? 'category'}</span>
              </div>
              <button className="flex-1 text-left min-w-0" onClick={() => navigate(`/expenses/${exp.id}`)}>
                <p className="font-label-md text-label-md text-on-surface truncate">{exp.description}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{exp.paidByName} · {exp.expenseDate}</p>
              </button>
              <div className="text-right">
                <p className="font-label-md text-label-md text-on-surface">{formatMoney(exp.amountPaise)}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant capitalize">{exp.splitMode}</p>
              </div>
              <button onClick={() => handleDeleteExpense(exp.id)} className="text-on-surface-variant hover:text-error p-xs" aria-label="Delete expense">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
          {expenses.loading && <Skeleton height={48} />}
          {!expenses.loading && (expenses.data?.length ?? 0) === 0 && (
            <EmptyState
              icon="receipt_long"
              title="No expenses yet"
              description="Add your first expense to start tracking."
              action={{ label: 'Add Expense', onClick: () => navigate(`/expenses/add?group=${g.id}`) }}
            />
          )}
        </div>
      </div>

      {/* Settlements */}
      {(settlements.data?.length ?? 0) > 0 && (
        <div className="bg-surface rounded-xl border border-line/40 p-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Settlements</h3>
          <div className="flex flex-col gap-sm">
            {(settlements.data ?? []).map(s => (
              <div key={s.id} className="flex items-center gap-md p-md rounded-lg bg-surface-container-low">
                <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-success text-[18px]">payments</span>
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">{s.fromName} → {s.toName}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{s.date}</p>
                </div>
                <Badge variant={s.status === 'confirmed' ? 'success' : s.status === 'pending' ? 'warning' : 'danger'}>{s.status}</Badge>
                <p className="font-label-md text-label-md text-primary">{formatMoney(s.amountPaise)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settle modal */}
      <Modal isOpen={settleOpen} onClose={() => setSettleOpen(false)} title="Settle Up">
        <div className="flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Pay to</label>
            <Select
              value={memberId}
              onChange={setMemberId}
              placeholder="Select a member"
              options={members.filter(m => m.userId !== user?.id).map(m => ({ value: m.userId, label: m.name }))}
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Amount</label>
            <div className="flex items-center gap-md px-md rounded-lg border border-line/40 bg-surface">
              <span className="text-outline">₹</span>
              <input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                inputMode="decimal"
                className="w-full h-12 bg-transparent text-on-surface font-body-md text-body-md outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-md">
            <Button variant="secondary" onClick={() => setSettleOpen(false)}>Cancel</Button>
            <Button onClick={handleSettle} disabled={createSettlement.loading || !memberId}>Record</Button>
          </div>
        </div>
      </Modal>

      {/* Invite modal */}
      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Member">
        <div className="flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Email</label>
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface"
            />
          </div>
          <div className="flex justify-end gap-md">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={invite.loading}>Send Invite</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm modal */}
      <Modal isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setConfirmAction(null) }} title="Confirm">
        <div className="flex flex-col gap-lg">
          <p className="font-body-md text-body-md text-on-surface">{confirmMessage}</p>
          <div className="flex justify-end gap-md">
            <Button variant="secondary" onClick={() => { setConfirmOpen(false); setConfirmAction(null) }}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirm} disabled={leaveGroupMutation.loading || removeMemberMutation.loading}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
