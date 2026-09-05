import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { groupsApi } from '../lib/api/groups'
import { formatMoney } from '../lib/money'
import { Skeleton, Modal, useToast, EmptyState, CategoryIcon } from '../components/ui'
import { GroupsSkeleton } from '../components/skeletons/GroupsSkeleton'

const ICON_TO_CATEGORY: Record<string, string> = {
  flight: 'trip',
  home: 'home',
  restaurant: 'food',
  group: 'social',
  business: 'office',
}

function categoryFromGroup(group: { type: string | null; icon: string | null }): string {
  if (group.type) return group.type
  return ICON_TO_CATEGORY[group.icon ?? ''] ?? 'home'
}

export function GroupsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('all')
  const { data, loading, refetch } = useApi(() => groupsApi.list())
  const groups = data ?? []

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)

  // Open create modal when ?new=1 is present
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreateModal(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newGroupName.trim()
    if (!name) return

    setCreating(true)
    try {
      await groupsApi.create({ name })
      setShowCreateModal(false)
      setNewGroupName('')
      refetch()
      addToast('Group created successfully', 'success')
    } catch {
      addToast('Failed to create group', 'error')
    } finally {
      setCreating(false)
    }
  }

  const filtered = useMemo(() => {
    let result = groups
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(g => g.name.toLowerCase().includes(q))
    }
    return result
  }, [groups, search])

  if (loading) {
    return <GroupsSkeleton />
  }

  return (
    <div className="flex flex-col gap-xl max-w-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">My Groups</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage your shared expenses and group balances.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-sm py-2 px-lg rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 active:scale-[0.98] transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Group
        </button>
      </div>

      {/* Search + Filter + Dropdown */}
      <div className="flex items-center gap-md">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-md rounded-lg border border-line/40 bg-surface font-body-md text-body-md placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
          />
        </div>
        <button className="p-2 rounded-lg border border-line/40 hover:bg-surface-container-low transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as typeof filter)}
          className="h-10 px-md rounded-lg border border-line/40 bg-surface font-body-md text-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
        >
          <option value="all">All Groups</option>
          <option value="active">Active</option>
          <option value="settled">Settled</option>
        </select>
      </div>

      {loading && <Skeleton height={300} />}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon="group_add"
          title="No groups found"
          description="Create a group to start tracking shared expenses."
          action={{ label: 'Create Group', onClick: () => setShowCreateModal(true) }}
        />
      )}

      {/* Group Cards */}
      {!loading && (
        <div className="flex flex-col gap-md">
          {filtered.map((group) => {
            const balance = group.balancePaise ?? 0
            return (
              <button
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="bg-surface rounded-xl border border-line/40 p-lg text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start gap-md">
                  {/* Group Icon */}
                  <div className="shrink-0">
                    <CategoryIcon category={categoryFromGroup(group)} size={48} />
                  </div>

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-md">
                      <div className="min-w-0">
                        <p className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">
                          {group.name}
                        </p>
                        {group.type && (
                          <span className="inline-block mt-xs px-sm py-[2px] rounded-full font-label-xs text-label-xs bg-surface-container text-on-surface-variant">
                            {group.type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Members + Balance */}
                    <div className="flex items-center justify-between mt-md">
                      {/* Member Avatars */}
                      <div className="flex items-center gap-xs">
                        <div className="flex -space-x-2">
                          {group.members.slice(0, 3).map((m, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded-full ${m.bgColor ?? 'bg-surface-container'} text-on-surface flex items-center justify-center text-[10px] font-semibold border-2 border-surface`}
                              title={m.initials}
                            >
                              {m.initials}
                            </div>
                          ))}
                          {group.memberCount > 3 && (
                            <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[10px] font-medium border-2 border-surface">
                              +{group.memberCount - 3}
                            </div>
                          )}
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant ml-xs">
                          {group.memberCount} members
                        </span>
                      </div>

                      {/* Balance */}
                      <div className="text-right">
                        <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wide">Your Balance</p>
                        <p className={`font-label-md text-label-md font-semibold ${balance >= 0 ? 'text-primary' : 'text-error'}`}>
                          {balance >= 0 ? '+' : ''}{formatMoney(balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setNewGroupName('') }} title="Create New Group">
        <form onSubmit={handleCreateGroup} className="flex flex-col gap-lg">
          <div className="flex flex-col gap-sm">
            <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="group-name">
              Group Name
            </label>
            <input
              id="group-name"
              type="text"
              placeholder="e.g. Trip to Goa"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              className="w-full h-12 px-md rounded-lg border border-line/40 bg-transparent text-on-background font-body-md text-body-md placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-md">
            <button
              type="button"
              onClick={() => { setShowCreateModal(false); setNewGroupName('') }}
              className="px-6 py-3 rounded-lg border border-line/40 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newGroupName.trim()}
              className="px-6 py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
