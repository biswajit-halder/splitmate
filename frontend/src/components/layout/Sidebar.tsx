import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/groups', label: 'Groups', icon: 'group' },
  { path: '/friends', label: 'Friends', icon: 'person' },
  { path: '/activity', label: 'Activity', icon: 'history' },
  { path: '/settlements', label: 'Settlements', icon: 'payments' },
  { path: '/analytics', label: 'Reports', icon: 'insights' },
]

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-70 flex-col border-r border-outline-variant bg-surface p-lg">
      <div className="mb-xl flex items-center gap-3">
        <span className="material-symbols-outlined text-primary-container text-2xl">account_balance</span>
        <div>
          <h1 className="font-headline-sm text-headline-sm text-on-surface">SplitMate</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Financial Clarity</p>
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col gap-sm">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-200 ${isActive ? 'border-l-4 border-primary bg-primary/5 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-md text-label-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="mt-auto flex flex-col gap-xs border-t border-outline-variant pt-md">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-4 rounded-lg px-4 py-2 transition-all duration-200 ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`
          }
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-md text-label-md">Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
