import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi, useMutation } from '../hooks/useApi'
import { groupsApi } from '../lib/api/groups'
import { formatMoney, formatSigned } from '../lib/money'
import { Modal, Button, Skeleton } from '../components/ui'
import { useToast } from '../components/ui'

const ICON_BG_OPTIONS = ['bg-primary-container', 'bg-secondary-container', 'bg-tertiary-container', 'bg-error-container']

export function GroupsPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [params] = useSearchParams()
  const { data, loading, refetch } = useApi(() => groupsApi.list())
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('Trip')
  const [iconBg, setIconBg] = useState(ICON_BG_OPTIONS[0])

  useEffect(() => {
    if (params.get('new') === '1') {
      setModalOpen(true)
      navigate('/groups', { replace: true })
    }
  }, [params, navigate])

  const createGroup = useMutation((body: { name: string; type: string; icon: string; icon_bg: string }) =>
    groupsApi.create(body),
  )

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      await createGroup.mutate({ name: name.trim(), type, icon: 'group', icon_bg: iconBg })
      addToast('Group created', 'success')
      setName('')
      setModalOpen(false)
      refetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create group', 'error' as never)
    }
  }

  const groups = data ?? []

  return (
    <div className="flex flex-col gap-xl max-w-content">
      <div className="flex items-start justify-between flex-wrap gap-md">
        <div>
          <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">Groups</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage shared expenses with friends and family.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <span className="material-symbols-outlined text-[18px]">add</span> Create Group
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-lg sm:grid-cols-3">
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Total Groups</p>
          <p className="font-headline-sm text-headline-sm text-on-surface">{loading ? '…' : groups.length}</p>
        </div>
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Net Balance</p>
          <p className="font-headline-sm text-headline-sm text-on-surface">
            {loading ? '…' : formatMoney(groups.reduce((s, g) => s + g.balancePaise, 0))}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-lg">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Total Members</p>
          <p className="font-headline-sm text-headline-sm text-on-surface">
            {loading ? '…' : groups.reduce((s, g) => s + g.memberCount, 0)}
          </p>
        </div>
      </div>

      {/* Group Grid */}
      {loading && <Skeleton height={180} />}
      <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => navigate(`/groups/${g.id}`)}
            className="bg-surface rounded-xl border border-outline-variant/20 p-lg hover:shadow-md hover:border-outline-variant/40 transition-all text-left"
          >
            <div className="flex items-center gap-md mb-md">
              <div className={`w-12 h-12 rounded-xl ${g.iconBg ?? 'bg-primary-container'} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-on-primary">{g.icon ?? 'group'}</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">{g.name}</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{g.type ?? 'Group'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {g.members.slice(0, 4).map((m, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full ${m.bgColor ?? 'bg-surface-container'} border-2 border-surface flex items-center justify-center font-label-sm text-label-sm text-on-surface`}
                  >
                    {m.initials}
                  </div>
                ))}
                {g.memberCount > 4 && (
                  <div className="w-7 h-7 rounded-full bg-surface-container-high border-2 border-surface flex items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
                    +{g.memberCount - 4}
                  </div>
                )}
              </div>
              <span className={`font-label-md text-label-md ${g.balancePaise > 0 ? 'text-success' : g.balancePaise < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                {formatSigned(g.balancePaise)}
              </span>
            </div>
          </button>
        ))}
      </div>
      {!loading && groups.length === 0 && (
        <div className="bg-surface rounded-xl border border-outline-variant/20 p-xl text-center">
          <p className="font-headline-sm text-headline-sm text-on-surface mb-xs">No groups yet</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Create a group to start splitting expenses.</p>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Group">
        <div className="flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Group Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Weekend Trip"
              className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
            >
              <option>Trip</option>
              <option>Home</option>
              <option>Event</option>
              <option>Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant">Color</label>
            <div className="flex gap-sm">
              {ICON_BG_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIconBg(opt)}
                  className={`w-9 h-9 rounded-full ${opt} ${iconBg === opt ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-md">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createGroup.loading}>
              {createGroup.loading ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
