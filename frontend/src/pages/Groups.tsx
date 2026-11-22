import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { groupsApi } from '../lib/api/groups'
import { formatMoney } from '../lib/money'
import { Button, Modal, useToast, EmptyState, Select } from '../components/ui'
import { GroupsSkeleton } from '../components/skeletons/GroupsSkeleton'
import type { Group } from '../lib/types'

const TYPES = [
  { value: 'all', label: 'All circles', icon: 'auto_awesome' },
  { value: 'trip', label: 'Travel', icon: 'flight' },
  { value: 'home', label: 'Home', icon: 'home' },
  { value: 'food', label: 'Food', icon: 'restaurant' },
  { value: 'social', label: 'Social', icon: 'group' },
  { value: 'office', label: 'Office', icon: 'business' },
]

function cover(group: Group): { className: string; icon: string } {
  switch (group.type) {
    case 'trip': return { className: 'cover-coral', icon: 'flight' }
    case 'home': return { className: 'cover-lilac', icon: 'home' }
    case 'food': return { className: 'cover-mint', icon: 'restaurant' }
    case 'social': return { className: 'cover-lilac', icon: 'group' }
    case 'office': return { className: 'cover-mint', icon: 'business' }
    default: return { className: 'cover-lilac', icon: 'group' }
  }
}

export function GroupsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { addToast } = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const { data, loading, refetch } = useApi(() => groupsApi.list())
  const groups = data ?? []

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('home')
  const [currency, setCurrency] = useState('INR')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreateModal(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      await groupsApi.create({ name: name.trim(), type, currency })
      setShowCreateModal(false)
      setName('')
      setType('home')
      setCurrency('INR')
      refetch()
      addToast('Group created', 'success')
    } catch {
      addToast('Failed to create group', 'error')
    } finally {
      setCreating(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups
      .filter(g => (!q || g.name.toLowerCase().includes(q)) && (filter === 'all' || g.type === filter))
      .sort((a, b) => Math.abs(b.balancePaise) - Math.abs(a.balancePaise))
  }, [groups, query, filter])

  if (loading) return <GroupsSkeleton />

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="micro-label mb-2">{groups.length} circles</p>
          <h1 className="font-headline-lg text-on-surface">Your groups</h1>
          <p className="mt-xs font-body-md text-on-surface-variant">Every shared space, one tap away.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <span className="material-symbols-outlined text-[18px]">add</span> New circle
        </Button>
      </div>

      {/* Inline filter bar */}
      <div className="mt-xl flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-sm">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-label-sm transition-all ${
                filter === t.value
                  ? 'tint-coral shadow-[0_0_20px_rgba(255,107,94,0.15)]'
                  : 'glass-card text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Find a group…"
            className="h-10 w-full rounded-xl border border-line bg-surface-container-low/70 pl-10 pr-md font-body-sm outline-none backdrop-blur transition-colors placeholder:text-on-surface-variant/60 focus:border-primary"
          />
        </div>
      </div>

      {/* Cover gallery */}
      <div className="mt-xl grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((group, index) => {
          const style = cover(group)
          const balance = group.balancePaise ?? 0
          return (
            <button
              key={group.id}
              onClick={() => navigate(`/groups/${group.id}`)}
              style={group.accent
                ? { backgroundImage: group.hasPhoto
                    ? `url(/api/groups/${group.id}/photo)`
                    : `linear-gradient(135deg, ${group.accent}, color-mix(in srgb, ${group.accent} 45%, #B69CFF))` }
                : undefined}
              className={`pressable relative flex h-48 flex-col justify-between overflow-hidden rounded-2xl bg-cover bg-center p-lg text-left ${group.accent ? '' : style.className} ${index === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
              <div className="flex items-start justify-between">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{style.icon}</span>
                <span className="rounded-full bg-black/10 px-2.5 py-1 font-label-sm">{group.type ?? 'group'}</span>
              </div>
              <div>
                <p className="font-headline-md truncate">{group.name}</p>
                <div className="mt-sm flex items-end justify-between gap-sm">
                  <div>
                    <p className="text-[11px] opacity-75">{group.memberCount} people</p>
                    <p className="num mt-1 font-headline-sm">{formatMoney(balance, group.currency ?? 'INR')}</p>
                  </div>
                  <div className="flex -space-x-2">
                    {(group.members ?? []).slice(0, 4).map((m, i) => (
                      <span key={i} className="h-5 w-5 rounded-full border-2 border-white/70 bg-black/25" title={m.initials} />
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <EmptyState icon="group_add" title="No circles found" description="Try another filter, or start a new group."
            action={{ label: 'Create group', onClick: () => setShowCreateModal(true) }} />
        )}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setName(''); setType('home') }}
        title="New circle" subtitle="Give your shared space a name and a vibe.">
        <form onSubmit={handleCreate} className="flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="micro-label" htmlFor="group-name">Circle name</label>
            <input
              id="group-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Weekend in Goa"
              className="h-11 w-full rounded-xl border border-line bg-surface-container-low/80 px-md font-body-md outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,94,0.12)]"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-sm">
            <p className="micro-label">Vibe</p>
            <div className="flex flex-wrap gap-sm">
              {TYPES.filter(t => t.value !== 'all').map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-xs rounded-xl px-md py-2 font-label-md transition-all ${
                    type === t.value ? 'tint-coral shadow-[0_0_20px_rgba(255,107,94,0.2)]' : 'glass-card text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-xs">
            <p className="micro-label">Currency</p>
            <Select
              value={currency}
              onChange={setCurrency}
              options={['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD'].map(c => ({ value: c, label: c }))}
            />
          </div>
          <div className="flex justify-end gap-md">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" disabled={creating || !name.trim()}>{creating ? 'Creating…' : 'Create circle'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
