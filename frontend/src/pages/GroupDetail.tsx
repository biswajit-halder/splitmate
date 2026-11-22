import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { groupsApi } from '../lib/api/groups'
import { settlementsApi } from '../lib/api/settlements'
import { expensesApi } from '../lib/api/expenses'
import { balancesApi } from '../lib/api/balances'
import { formatMoney } from '../lib/money'
import { formatDateCompact, formatDateTime } from '../lib/dates'
import { Modal, Button, Skeleton, Badge, EmptyState, BlobAvatar, SettleModal } from '../components/ui'
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
  const simplified = useApi(() => balancesApi.simplify(id), [id])

  const [settleOpen, setSettleOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null)
  const [confirmMessage, setConfirmMessage] = useState('')

  const invite = useMutation((email: string) => groupsApi.invite(id, email))
  const deleteExpense = useMutation((expId: string) => expensesApi.remove(expId))
  const leaveGroup = useMutation(() => groupsApi.leave(id))
  const removeMember = useMutation((userId: string) => groupsApi.removeMember(id, userId))

  const members = useMemo(
    () => (balances.data?.members ?? group.data?.members ?? [])
      .map(m => ({
        userId: 'userId' in m ? m.userId : (m as { id: string }).id,
        name: m.name,
        netPaise: 'netPaise' in m ? m.netPaise : 0,
      }))
      .sort((a, b) => b.netPaise - a.netPaise || a.name.localeCompare(b.name)),
    [balances.data, group.data],
  )

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    try {
      await invite.mutate(inviteEmail.trim())
      addToast('Invite sent', 'success')
      setInviteEmail('')
      setInviteOpen(false)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to invite', 'error')
    }
  }

  const handleDelete = async (expenseId: string) => {
    try {
      await deleteExpense.mutate(expenseId)
      addToast('Expense removed', 'success')
      expenses.refetch()
      balances.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to remove', 'error')
    }
  }

  const handleConfirm = async () => {
    if (!confirmAction) return
    try {
      await confirmAction()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Action failed', 'error')
    } finally {
      setConfirmOpen(false)
      setConfirmAction(null)
    }
  }

  const ask = (message: string, action: () => Promise<void>) => {
    setConfirmMessage(message)
    setConfirmAction(() => action)
    setConfirmOpen(true)
  }

  if (group.loading) return <div className="flex flex-col gap-lg"><Skeleton height={60} /><Skeleton height={260} /></div>
  if (!group.data) return <p className="font-body-md text-on-surface-variant">Group not found.</p>

  const g = group.data
  const isOwner = g.createdBy === user?.id
  const currency = g.currency ?? 'INR'

  return (
    <div className="flex flex-col">
      {/* Statement header — no stat cards */}
      <div className="flex flex-col gap-lg sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-sm">
            <span className="tint-saffron rounded-full px-2.5 py-1 font-label-sm capitalize">{g.type ?? 'group'}</span>
            <span className="font-body-sm text-on-surface-variant">{g.members.length} people</span>
          </div>
          <h1 className="mt-sm font-headline-lg text-on-surface">{g.name}</h1>
          <p className="mt-xs font-body-sm text-on-surface-variant">Created by {g.createdByName}</p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <Button variant="secondary" onClick={() => setInviteOpen(true)}>
            <span className="material-symbols-outlined text-[18px]">person_add</span> Invite
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/expenses/add?group=${g.id}`)}>
            <span className="material-symbols-outlined text-[18px]">add</span> Expense
          </Button>
          <Button onClick={() => setSettleOpen(true)}>
            <span className="material-symbols-outlined text-[18px]">payments</span> Settle up
          </Button>
        </div>
      </div>

      <div className="mt-xxl grid grid-cols-1 gap-xl lg:grid-cols-[1.55fr_1fr]">
        {/* Ledger */}
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-headline-sm text-on-surface">Ledger</h2>
            <button onClick={() => navigate(`/expenses/add?group=${g.id}`)} className="font-label-md text-primary hover:opacity-70 transition-opacity">+ Add entry</button>
          </div>
          <div className="mt-lg flex flex-col">
            {(expenses.data ?? []).map(exp => (
              <div key={exp.id} className="group flex items-center gap-md border-b border-line/70 py-md transition-colors hover:bg-surface-container/40">
                <div className="tint-lilac flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <span className="material-symbols-outlined text-[19px]">{CATEGORY_ICONS[exp.category ?? ''] ?? 'category'}</span>
                </div>
                <button className="min-w-0 flex-1 text-left" onClick={() => navigate(`/expenses/${exp.id}`)}>
                  <p className="truncate font-label-md text-on-surface">{exp.description}</p>
                  <p className="truncate font-body-sm text-on-surface-variant">
                    {exp.paidByName}{exp.paidBy === user?.id ? ' (you)' : ''} · {formatDateCompact(exp.expenseDate)} · {exp.splitMode}
                  </p>
                </button>
                <span className="num font-label-md text-on-surface">{formatMoney(exp.amountPaise, currency)}</span>
                {exp.canEdit && (
                  <button
                    onClick={() => handleDelete(exp.id)}
                    aria-label={`Delete ${exp.description}`}
                    className="rounded-full p-1.5 text-on-surface-variant opacity-0 transition-all hover:bg-primary/15 hover:text-primary group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
            ))}
            {expenses.loading && <Skeleton height={48} />}
            {!expenses.loading && (expenses.data?.length ?? 0) === 0 && (
              <EmptyState icon="receipt_long" title="No entries yet" description="Add the first expense for this circle."
                action={{ label: 'Add expense', onClick: () => navigate(`/expenses/add?group=${g.id}`) }} />
            )}
          </div>

          {(settlements.data?.length ?? 0) > 0 && (
            <div className="mt-xxl">
              <h2 className="font-headline-sm text-on-surface">Settlements</h2>
              <div className="mt-lg flex flex-col">
                {(settlements.data ?? []).map(s => (
                  <div key={s.id} className="timeline-dot relative flex items-center gap-md border-b border-line/70 py-md">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-md text-on-surface">{s.fromName} → {s.toName}</p>
                      <p className="font-body-sm text-on-surface-variant">{formatDateTime(s.date)}</p>
                    </div>
                    <Badge variant={s.status === 'completed' ? 'success' : 'warning'} className="capitalize">{s.status}</Badge>
                    <span className="num font-label-md text-secondary">{formatMoney(s.amountPaise, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settle rail */}
        <aside className="glass-card h-fit p-xl lg:sticky lg:top-24">
          <h2 className="font-headline-sm text-on-surface">Balances</h2>
          <p className="micro-label mt-1">Who's owed, who owes</p>
          <div className="mt-lg flex flex-col">
            {members.map(m => {
              const owed = m.netPaise > 0
              return (
                <div key={m.userId} className="flex items-center gap-md border-b border-line/70 py-md">
                  <BlobAvatar userId={m.userId} name={m.name} size={36} rounded="square" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-label-md text-on-surface">
                      {m.name}{m.userId === user?.id ? ' (you)' : ''}
                    </p>
                    <p className="font-body-sm text-on-surface-variant">{owed ? 'owed to them' : m.netPaise < 0 ? 'they owe' : 'settled'}</p>
                  </div>
                  <span className={`num font-label-md ${owed ? 'text-secondary glow-mint' : m.netPaise < 0 ? 'text-primary glow-coral' : 'text-on-surface-variant'}`}>
                    {formatMoney(Math.abs(m.netPaise), currency)}
                  </span>
                  {isOwner && m.userId !== user?.id && (
                    <button
                      onClick={() => ask(`Remove ${m.name} from this group?`, async () => {
                        await removeMember.mutate(m.userId)
                        addToast(`${m.name} removed`, 'success')
                        group.refetch()
                        balances.refetch()
                      })}
                      aria-label={`Remove ${m.name}`}
                      className="text-on-surface-variant transition-colors hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <Button
            className="mt-lg w-full"
            variant="secondary"
            onClick={() => setSettleOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">payments</span> Settle up
          </Button>
          {(simplified.data?.transactions.length ?? 0) > 0 && (
            <div className="mt-xl border-t border-line pt-lg">
              <p className="micro-label mb-sm">Fewest payments to settle everyone</p>
              <div className="flex flex-col gap-1">
                {simplified.data!.transactions.map((t, i) => (
                  <div key={i} className="flex items-center justify-between gap-sm py-1 font-body-sm">
                    <span className="text-on-surface-variant">
                      {members.find(m => m.userId === t.from)?.name ?? 'Member'} → {members.find(m => m.userId === t.to)?.name ?? 'Member'}
                    </span>
                    <span className="num text-secondary">{formatMoney(t.amountPaise, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!isOwner && (
            <button
              onClick={() => ask('Leave this group? Balances must be settled first.', async () => {
                await leaveGroup.mutate()
                addToast('You left the group', 'success')
                navigate('/groups')
              })}
              className="mt-md w-full text-center font-body-sm text-on-surface-variant transition-colors hover:text-primary"
            >
              Leave group
            </button>
          )}
        </aside>
      </div>

      <SettleModal
        open={settleOpen}
        onClose={() => setSettleOpen(false)}
        groupId={id}
        groupName={g.name}
        members={members.map(m => ({ userId: m.userId, name: m.name }))}
        onSettled={() => { settlements.refetch(); balances.refetch() }}
      />

      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite someone" subtitle="They can join once they have an account.">
        <div className="flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="micro-label" htmlFor="invite-email">Email address</label>
            <input id="invite-email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
              className="h-11 w-full rounded-xl border border-line bg-surface-container-low/80 px-md font-body-md outline-none focus:border-primary" />
          </div>
          <div className="flex justify-end gap-md">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={invite.loading}>Send invite</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setConfirmAction(null) }}
        title="Are you sure?" subtitle={confirmMessage}>
        <div className="flex justify-end gap-md">
          <Button variant="secondary" onClick={() => { setConfirmOpen(false); setConfirmAction(null) }}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirm}>Confirm</Button>
        </div>
      </Modal>
    </div>
  )
}
