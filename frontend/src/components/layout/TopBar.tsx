import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { notificationsApi } from '../../lib/api/notifications'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export function TopBar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { data } = useApi(() => notificationsApi.list())
  const unread = data?.unread ?? 0
  const initials = (user?.name ?? '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header className="fixed top-0 w-full lg:w-main z-50 glass-panel shadow-sm">
      <div className="flex justify-between items-center h-16 px-md md:px-xxl w-full">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-sm">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[20px]">donut_small</span>
          </div>
          <span className="font-headline-md text-headline-md font-bold text-primary">SplitMate</span>
        </div>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        <div className="flex items-center gap-md ml-auto">
          {/* Search icon */}
          <button
            onClick={() => {/* TODO: open search modal */}}
            title="Search everywhere"
            aria-label="Search everywhere"
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">search</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-error text-white text-[10px] flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Add Expense button */}
          <button
            onClick={() => navigate('/expenses/add')}
            className="hidden md:flex items-center gap-sm py-2 px-lg rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Expense
          </button>

          {/* Profile */}
          <Link to="/profile">
            <div className={`w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 cursor-pointer ${user?.avatarBg ?? 'bg-primary'} flex items-center justify-center text-on-primary font-bold text-label-md`}>
              {initials}
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
