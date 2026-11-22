import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { notificationsApi } from '../../lib/api/notifications'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { BrandMark, BlobAvatar } from '../ui'
import { SearchDialog } from './SearchDialog'

function IconButton({ label, onClick, children, badge }: {
  label: string
  onClick: () => void
  children: React.ReactNode
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line/70 bg-surface-container-low/70 text-on-surface-variant backdrop-blur transition-colors hover:border-primary/50 hover:text-primary"
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="num absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

export function TopBar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { data } = useApi(() => notificationsApi.list())
  const [searchOpen, setSearchOpen] = useState(false)
  const unread = data?.unread ?? 0

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header className="glass-panel fixed left-0 right-0 top-0 z-50 lg:left-[248px]">
        <div className="mx-auto flex h-16 w-full max-w-content items-center gap-md px-md md:px-xxl">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex shrink-0 items-center gap-sm lg:hidden"
            aria-label="SplitMate home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[var(--accent-2)] glow-shadow">
              <BrandMark size={20} className="text-[#241016]" />
            </span>
            <span className="font-headline-md text-on-surface">SplitMate</span>
          </button>

          <div className="hidden shrink-0 lg:block">
            <p className="font-body-sm text-on-surface-variant">workspace / <span className="text-on-surface">overview</span></p>
          </div>

          {/* Command bar — opens the search dialog */}
          <button
            onClick={() => setSearchOpen(true)}
            className="ml-auto hidden h-9 max-w-md flex-1 items-center gap-sm rounded-xl border border-line bg-surface-container-low/70 px-md text-left font-body-sm text-on-surface-variant backdrop-blur transition-colors hover:border-primary/50 md:flex"
          >
            <span className="material-symbols-outlined text-[18px] accent-text">search</span>
            <span className="truncate">Search groups, friends, anything…</span>
            <kbd className="ml-auto rounded border border-line px-1.5 py-0.5 font-label-sm text-on-surface-variant">⌘ K</kbd>
          </button>
          <div className="ml-auto md:hidden">
            <IconButton label="Search" onClick={() => setSearchOpen(true)}>
              <span className="material-symbols-outlined text-[20px]">search</span>
            </IconButton>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              onClick={() => navigate('/activity')}
              className="hidden items-center gap-2 rounded-full border border-line bg-surface-container-low/70 px-md py-1.5 font-label-sm text-on-surface-variant backdrop-blur transition-colors hover:border-primary/50 xl:flex"
              title="Live activity"
            >
              <span className="accent-dot" />
              LIVE
            </button>
            <IconButton
              label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </IconButton>
            <IconButton label="Notifications" onClick={() => navigate('/notifications')} badge={unread}>
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </IconButton>

            <button
              onClick={() => navigate('/expenses/add')}
              className="ml-1 hidden h-9 items-center gap-1.5 rounded-xl bg-gradient-to-br from-primary to-[var(--accent-2)] px-md font-label-md text-on-primary glow-shadow transition-all hover:brightness-110 md:flex"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add expense
            </button>

            <Link to="/profile" className="ml-1 shrink-0 rounded-full transition-transform hover:scale-105" aria-label="Profile">
              {user ? (
                <BlobAvatar userId={user.id} name={user.name} size={36} rounded="square" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container font-label-md text-on-primary-container">
                  ?
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
