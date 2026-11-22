import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { balancesApi } from '../lib/api/balances'
import { groupsApi } from '../lib/api/groups'
import { settlementsApi } from '../lib/api/settlements'
import { formatMoney } from '../lib/money'
import { formatDateTime } from '../lib/dates'
import { Button, Skeleton, Badge, EmptyState, Select, SettleModal } from '../components/ui'
import { useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function SettlementsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const balances = useApi(() => balancesApi.all())
  const groups = useApi(() => groupsApi.list())
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [preselected, setPreselected] = useState<string | null>(null)

  useEffect(() => {
    if (params.get('new') === '1') {
      setPreselected(params.get('payTo'))
      setModalOpen(true)
      navigate('/settlements', { replace: true })
    }
  }, [params, navigate])

  useEffect(() => {
    if (!preselected || !groups.data?.length) return
    const controller = new AbortController()
    const find = async () => {
      for (const g of groups.data!) {
        const detail = await groupsApi.get(g.id)
        if (controller.signal.aborted) return
        if (detail.members.some(m => m.userId === preselected)) {
          setSelectedGroupId(g.id)
          return
        }
      }
      if (!controller.signal.aborted) setSelectedGroupId(groups.data![0].id)
    }
    find()
    return () => controller.abort()
  }, [preselected, groups.data])

  useEffect(() => {
    if (!preselected && !selectedGroupId && groups.data?.length) setSelectedGroupId(groups.data[0].id)
  }, [preselected, selectedGroupId, groups.data])

  const selectedGroup = useMemo(() => groups.data?.find(g => g.id === selectedGroupId), [groups.data, selectedGroupId])
  const groupDetail = useApi(
    () => (selectedGroupId ? groupsApi.get(selectedGroupId) : Promise.resolve(null)),
    [selectedGroupId],
  )
  const list = useApi(
    () => (selectedGroupId ? settlementsApi.list(selectedGroupId, selectedGroup?.name) : Promise.resolve([])),
    [selectedGroupId, selectedGroup?.name],
  )
  const confirm = useMutation((id: string) => settlementsApi.confirm(id))
  const remove = useMutation((id: string) => settlementsApi.remove(id))

  const handleConfirm = async (id: string) => {
    try {
      await confirm.mutate(id)
      addToast('Settlement confirmed', 'success')
      list.refetch()
      balances.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await remove.mutate(id)
      addToast('Settlement removed', 'success')
      list.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const counterparties = balances.data?.counterparties ?? []

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="micro-label mb-2">{counterparties.length} open balances</p>
          <h1 className="font-headline-lg text-on-surface">Settle up</h1>
          <p className="mt-xs font-body-md text-on-surface-variant">Clear debts in one tap.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={!selectedGroupId}>
          <span className="material-symbols-outlined text-[18px]">add</span> New settlement
        </Button>
      </div>

      {/* Pairwise board */}
      <div className="mt-xl grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
        {counterparties.map(c => {
          const theyOweMe = c.netPaise > 0
          return (
            <button
              key={c.userId}
              onClick={() => setModalOpen(true)}
              className="glass-card pressable flex flex-col items-center gap-md p-xl"
            >
              <div className="flex items-center gap-md">
                <span className="tint-lilac flex h-11 w-11 items-center justify-center rounded-xl font-label-md">
                  {user?.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('')}
                </span>
                <span className={`material-symbols-outlined text-2xl ${theyOweMe ? 'text-secondary' : 'text-primary'}`}>
                  {theyOweMe ? 'arrow_back' : 'arrow_forward'}
                </span>
                <span className="tint-lilac flex h-11 w-11 items-center justify-center rounded-xl font-label-md">
                  {c.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('')}
                </span>
              </div>
              <div className="text-center">
                <p className="font-body-sm text-on-surface-variant">
                  {theyOweMe ? `${c.name} owes you` : `You owe ${c.name}`}
                </p>
                <p className={`num mt-1 font-headline-md ${theyOweMe ? 'text-secondary glow-mint' : 'text-primary glow-coral'}`}>
                  {formatMoney(Math.abs(c.netPaise))}
                </p>
              </div>
            </button>
          )
        })}
        {counterparties.length === 0 && (
          <div className="glass-card col-span-full p-xl text-center">
            <p className="font-headline-sm text-on-surface">Everyone's square</p>
            <p className="mt-xs font-body-md text-on-surface-variant">No outstanding balances to settle.</p>
          </div>
        )}
      </div>

      {/* History */}
      <div className="mt-xxl flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="font-headline-sm text-on-surface">History</h2>
          <p className="micro-label mt-1">Recorded payments</p>
        </div>
        <Select
          value={selectedGroupId}
          onChange={setSelectedGroupId}
          placeholder="Select a group"
          options={(groups.data ?? []).map(g => ({ value: g.id, label: g.name }))}
          className="w-full sm:w-64"
        />
      </div>

      <div className="mt-lg flex flex-col">
        {list.loading && <Skeleton height={80} />}
        {(list.data ?? []).map(s => {
          const isPayer = s.fromUserId === user?.id
          const isPayee = s.toUserId === user?.id
          return (
            <div key={s.id} className="timeline-dot relative flex flex-wrap items-center gap-md border-b border-line/70 py-md">
              <div className="min-w-0 flex-1">
                <p className="truncate font-label-md text-on-surface">{s.fromName} → {s.toName}</p>
                <p className="font-body-sm text-on-surface-variant">
                  {formatDateTime(s.date)}{s.note ? ` · ${s.note}` : ''}
                </p>
              </div>
              <span className="num font-label-md text-on-surface">{formatMoney(s.amountPaise)}</span>
              <Badge variant={s.status === 'completed' ? 'success' : 'warning'} className="capitalize">{s.status}</Badge>
              {s.status === 'pending' && (isPayer || isPayee) && (
                <Button variant="secondary" onClick={() => handleConfirm(s.id)}>Confirm</Button>
              )}
              {s.status === 'pending' && isPayer && (
                <Button variant="ghost" onClick={() => handleRemove(s.id)}>Cancel</Button>
              )}
            </div>
          )
        })}
        {!list.loading && selectedGroupId && (list.data?.length ?? 0) === 0 && (
          <EmptyState icon="payments" title="No settlements yet" description="Record a payment to start clearing balances." />
        )}
      </div>

      {selectedGroup && (
        <SettleModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setPreselected(null) }}
          groupId={selectedGroupId}
          groupName={selectedGroup.name}
          members={(groupDetail.data?.members ?? []).map(m => ({ userId: m.userId, name: m.name }))}
          onSettled={() => { list.refetch(); balances.refetch() }}
          preselectedUserId={preselected ?? undefined}
        />
      )}
    </div>
  )
}
