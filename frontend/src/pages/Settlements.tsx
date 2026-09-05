import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { groupsApi } from '../lib/api/groups'
import { settlementsApi } from '../lib/api/settlements'
import { formatMoney } from '../lib/money'
import { Button, Skeleton, Badge, EmptyState, SettleModal, Select } from '../components/ui'
import { useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function SettlementsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const groups = useApi(() => groupsApi.list())
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [preselectedPayTo, setPreselectedPayTo] = useState<string | null>(null)
  const [preselectedPayToName, setPreselectedPayToName] = useState<string | null>(null)

  useEffect(() => {
    if (params.get('new') === '1') {
      setPreselectedPayTo(params.get('payTo'))
      setPreselectedPayToName(params.get('payToName'))
      setModalOpen(true)
      navigate('/settlements', { replace: true })
    }
  }, [params, navigate])

  // When a friend is preselected, find which group contains them
  useEffect(() => {
    if (!preselectedPayTo || !groups.data || groups.data.length === 0) return

    const controller = new AbortController()

    const findGroupWithFriend = async () => {
      for (const group of groups.data!) {
        if (controller.signal.aborted) return
        try {
          const detail = await groupsApi.get(group.id)
          if (controller.signal.aborted) return
          if (detail.members.some(m => m.userId === preselectedPayTo)) {
            setSelectedGroupId(group.id)
            return
          }
        } catch {
          // Skip groups that fail to load
        }
      }
      // Fallback: no group contains the friend, select first group
      if (!controller.signal.aborted) {
        setSelectedGroupId(groups.data![0].id)
      }
    }

    findGroupWithFriend()
    return () => controller.abort()
  }, [preselectedPayTo, groups.data])

  // Auto-select first group when none selected and no friend preselected
  useEffect(() => {
    if (!preselectedPayTo && !selectedGroupId && groups.data && groups.data.length > 0) {
      setSelectedGroupId(groups.data[0].id)
    }
  }, [preselectedPayTo, selectedGroupId, groups.data])

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

  const confirm = useMutation((id: string) => settlementsApi.confirm(id))
  const remove = useMutation((id: string) => settlementsApi.remove(id))

  const members = groupDetail.data?.members ?? []

  const handleConfirm = async (id: string) => {
    try {
      await confirm.mutate(id)
      addToast('Settlement confirmed', 'success')
      settlements.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await remove.mutate(id)
      addToast('Settlement removed', 'success')
      settlements.refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
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
        <Button className="flex items-center gap-2" onClick={() => setModalOpen(true)} disabled={!selectedGroupId}>
          <span className="material-symbols-outlined text-[18px] leading-none">add</span> New Settlement
        </Button>
      </div>

      <div className="flex flex-col gap-xs">
        <label className="font-label-sm text-label-sm text-on-surface-variant">Group</label>
        <Select
          value={selectedGroupId}
          onChange={setSelectedGroupId}
          placeholder="Select a group"
          options={(groups.data ?? []).map(g => ({ value: g.id, label: g.name }))}
          className="w-full sm:w-80"
        />
      </div>

      {settlements.loading && <Skeleton height={120} />}

      <div className="flex flex-col gap-md">
        {list.map(s => {
          const isPayer = s.fromUserId === user?.id
          const isPayee = s.toUserId === user?.id
          return (
            <div key={s.id} className="bg-surface rounded-xl border border-line/40 p-lg flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">payments</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface">{s.fromName} → {s.toName}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{s.date}{s.note ? ` · ${s.note}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <span className="font-label-md text-label-md text-on-surface">{formatMoney(s.amountPaise)}</span>
                <Badge variant={s.status === 'confirmed' ? 'success' : s.status === 'pending' ? 'warning' : 'danger'}>{s.status}</Badge>
                {s.status === 'pending' && (isPayer || isPayee) && (
                  <Button onClick={() => handleConfirm(s.id)}>Confirm</Button>
                )}
                {s.status === 'pending' && isPayer && (
                  <Button variant="danger" onClick={() => handleRemove(s.id)}>Cancel</Button>
                )}
                {s.status !== 'confirmed' && !isPayer && (
                  <Button variant="ghost" onClick={() => handleRemove(s.id)}>Remove</Button>
                )}
              </div>
            </div>
          )
        })}
        {!settlements.loading && selectedGroupId && list.length === 0 && (
          <EmptyState icon="payments" title="No settlements yet" description="Settlements will appear here once you record payments." />
        )}
        {!selectedGroupId && !settlements.loading && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">Select a group to view settlements.</p>
        )}
      </div>

      {selectedGroupId && selectedGroup && (
        <SettleModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setPreselectedPayTo(null); setPreselectedPayToName(null) }}
          groupId={selectedGroupId}
          groupName={selectedGroup.name}
          members={members}
          onSettled={() => settlements.refetch()}
          preselectedUserId={preselectedPayTo ?? undefined}
          preselectedUserName={preselectedPayToName ? decodeURIComponent(preselectedPayToName) : undefined}
        />
      )}
    </div>
  )
}
