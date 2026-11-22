import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AccentSwitcher, BrandMark } from '../ui'

const primaryNav = [
  { path: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
  { path: '/groups', label: 'Groups', icon: 'group' },
  { path: '/friends', label: 'Friends', icon: 'person' },
]

const secondaryNav = [
  { path: '/activity', label: 'Activity', icon: 'history' },
  { path: '/analytics', label: 'Analytics', icon: 'bar_chart' },
  { path: '/settlements', label: 'Settlements', icon: 'payments' },
]

function NavItem({ item }: { item: { path: string; label: string; icon: string } }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 font-label-md transition-all ${
          isActive
            ? 'bg-primary/15 text-on-primary-container shadow-[inset_0_0_0_1px_rgba(255,107,94,0.25),0_0_20px_rgba(255,107,94,0.08)]'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_var(--color-primary)]" />}
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: `'FILL' 1` }}
          >
            {item.icon}
          </span>
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="glass-panel fixed left-0 top-0 z-40 hidden h-full w-sidebar flex-col border-r border-line bg-surface/70 lg:flex">
      <div className="flex items-center gap-3 px-xl pb-lg pt-xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#B69CFF] shadow-[0_0_24px_rgba(255,107,94,0.35)]">
          <BrandMark size={26} className="text-[#241016]" />
        </div>
        <div>
          <p className="font-headline-md leading-none text-on-surface">SplitMate</p>
          <p className="mt-1.5 font-label-sm text-on-surface-variant">Shared expenses, simplified</p>
        </div>
      </div>

      <nav className="flex-1 space-y-lg overflow-y-auto px-md py-lg">
        <div>
          <p className="eyebrow mb-sm px-3">Workspace</p>
          <div className="flex flex-col gap-1">
            {primaryNav.map(item => <NavItem key={item.path} item={item} />)}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-sm px-3">Insights</p>
          <div className="flex flex-col gap-1">
            {secondaryNav.map(item => <NavItem key={item.path} item={item} />)}
          </div>
        </div>
      </nav>

      <div className="border-t border-line px-md py-lg">
        <div className="mb-lg">
          <AccentSwitcher />
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-label-md text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
