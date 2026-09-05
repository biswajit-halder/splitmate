import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { groupsApi } from '../lib/api/groups'
import { settlementsApi } from '../lib/api/settlements'
import { formatMoney, toPaise } from '../lib/money'
import { Modal, Button, Skeleton, Badge, EmptyState } from '../components/ui'
import { useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function SettlementsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const groups = useApi(() => groupsApi.list())
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [newOpen, setNewOpen] = useState(false)
  const [memberId, setMemberId] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (params.get('new') === '1') {
      setNewOpen(true)
      navigate('/settlements', { replace: true })
    }
  }, [params, navigate])

  const selectedGroup = useMemo(
    () => (groups.data ?? []).find(g => g.id === selectedGroupId),
    [groups.data, selectedGroupId],
  )
  const groupDetail = useApi(
    () => (selectedGroupId ? groupsApi.get(selectedGroupId) : Promise.resolve(null)),
    [selectedGroupId],
  )

  const settlements = useApi(
    () => (selectedGroupId ? settlementsApi.list(selectedGroupId, selectedGroup?.name) : Promise.resolve([])),
    [selectedGroupId, selectedGroup?.name],
  )

  const create = useMutation((body: { payerId: string; payeeId: string; amountPaise: number }) =>
    settlementsApi.create(selectedGroupId, body),
  )
  const confirm = useMutation((id: string) => settlementsApi.confirm(id))
  const remove = useMutation((id: string) => settlementsApi.remove(id))

  const members = groupDetail.data?.members ?? []

  const handleCreate = async () => {
    if (!memberId || !amount) return
    try {
      await create.mutate({ payerId: user?.id ?? '', payeeId: memberId, amountPaise: toPaise(amount) })
      addToast('Settlement recorded', 'success')
      setNewOpen(false)
      setMemberId('')
      setAmount('')
      settlements.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error' as never)
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      await confirm.mutate(id)
      addToast('Settlement confirmed', 'success')
      settlements.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error' as never)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await remove.mutate(id)
      settlements.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error' as never)
    }
  }

  const list = settlements.data ?? []

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <div className="flex items-start justify-between flex-wrap gap-md">
        <div>
          <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Settlements</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Track and confirm payments between members.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setNewOpen(true)} disabled={!selectedGroupId}>
          <span className="material-symbols-outlined text-[18px] leading-none">add</span> New Settlement
        </Button>
      </div>

      <div className="flex flex-col gap-xs">
        <label className="font-label-sm text-label-sm text-on-surface-variant">Group</label>
        <select
          value={selectedGroupId}
          onChange={e => setSelectedGroupId(e.target.value)}
          className="w-full sm:w-80 h-12 px-md rounded-lg border border-line/40 bg-surface"
        >
          <option value="">Select a group</option>
          {(groups.data ?? []).map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {settlements.loading && <Skeleton height={120} />}

      <div className="flex flex-col gap-md">
        {list.map(s => (
          <div key={s.id} className="bg-surface rounded-xl border border-line/40 p-lg flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">payments</span>
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface">{s.fromName} → {s.toName}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{s.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-md">
              <span className="font-label-md text-label-md text-on-surface">{formatMoney(s.amountPaise)}</span>
              <Badge variant={s.status === 'confirmed' ? 'success' : s.status === 'pending' ? 'warning' : 'danger'}>{s.status}</Badge>
              {s.status === 'pending' && s.toUserId === user?.id && (
                <Button onClick={() => handleConfirm(s.id)}>Confirm</Button>
              )}
              {s.status !== 'confirmed' && (
                <Button variant="ghost" onClick={() => handleRemove(s.id)}>Remove</Button>
              )}
            </div>
          </div>
        ))}
        {!settlements.loading && selectedGroupId && list.length === 0 && (
          <EmptyState icon="payments" title="No settlements yet" description="Settlements will appear here once you record payments." />
        )}
        {!selectedGroupId && !settlements.loading && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">Select a group to view settlements.</p>
        )}
      </div>

      <Modal isOpen={newOpen} onClose={() => setNewOpen(false)} title="New Settlement">
        <div className="flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Pay to</label>
            <select
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
              className="w-full h-12 px-md rounded-lg border border-line/40 bg-surface"
            >
              <option value="">Select a member</option>
              {members.filter(m => m.userId !== user?.id).map(m => (
                <option key={m.userId} value={m.userId}>{m.name}</option>
              ))}
            </select>
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
            <Button variant="secondary" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={create.loading || !memberId}>Record</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
