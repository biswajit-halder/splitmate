import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { groupsApi } from '../../lib/api/groups'
import { friendsApi } from '../../lib/api/friends'
import { formatMoney } from '../../lib/money'
import { BlobAvatar, Modal } from '../ui'

interface SearchDialogProps {
  open: boolean
  onClose: () => void
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  const groups = useApi(() => open ? groupsApi.list() : Promise.resolve([]), [open])
  const friends = useApi(() => open ? friendsApi.list() : Promise.resolve([]), [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      // Let the modal mount before focusing the input.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const groupResults = (groups.data ?? [])
      .filter(g => !q || g.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(g => ({
        key: `group-${g.id}`,
        label: g.name,
        detail: `${g.memberCount} members · ${formatMoney(g.balancePaise)}`,
        icon: 'group',
        to: `/groups/${g.id}`,
      }))
    const friendResults = (friends.data ?? [])
      .filter(f => !q || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q))
      .slice(0, 5)
      .map(f => ({
        key: `friend-${f.id}`,
        label: f.name,
        detail: f.email,
        to: '/friends',
        avatar: { id: f.id, name: f.name },
      }))
    const actions = q
      ? []
      : [
          { key: 'action-expense', label: 'Add an expense', detail: 'Record a shared payment', icon: 'add', to: '/expenses/add' },
          { key: 'action-analytics', label: 'View analytics', detail: 'Spending breakdown', icon: 'bar_chart', to: '/analytics' },
        ]

    return [...groupResults, ...friendResults, ...actions]
  }, [query, groups.data, friends.data])

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="sm:max-w-xl">
      <div className="flex items-center gap-sm rounded-xl border border-line bg-surface-container-low px-md">
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">search</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && results[0]) go(results[0].to)
          }}
          placeholder="Search groups, friends, actions…"
          className="h-12 flex-1 bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/70"
        />
        <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-label-sm text-on-surface-variant sm:block">ESC</kbd>
      </div>

      <div className="mt-lg max-h-[50vh] overflow-y-auto">
        <p className="eyebrow mb-sm px-1">{query ? 'Results' : 'Quick access'}</p>
        {results.length === 0 && (
          <p className="py-xl text-center font-body-md text-body-md text-on-surface-variant">
            No matches for “{query}”.
          </p>
        )}
        <div className="flex flex-col gap-1">
          {results.map(result => (
            <button
              key={result.key}
              type="button"
              onClick={() => go(result.to)}
              className="flex w-full items-center gap-md rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-surface-container-low"
            >
              {'avatar' in result && result.avatar ? (
                <BlobAvatar userId={result.avatar.id} name={result.avatar.name} size={36} />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <span className="material-symbols-outlined text-[19px]">{'icon' in result ? result.icon : 'person'}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-label-md text-label-md text-on-surface">{result.label}</p>
                <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{result.detail}</p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">arrow_forward</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
