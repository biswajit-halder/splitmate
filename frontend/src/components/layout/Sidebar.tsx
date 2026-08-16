import { NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/groups', label: 'Groups', icon: 'group' },
  { path: '/friends', label: 'Friends', icon: 'person' },
  { path: '/activity', label: 'Activity', icon: 'history' },
  { path: '/settlements', label: 'Settlements', icon: 'payments' },
  { path: '/analytics', label: 'Reports', icon: 'insights' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
]

export function Sidebar() {
  const navigate = useNavigate()
  return (
    <aside className="fixed left-0 top-0 h-full w-sidebar border-r border-outline-variant/30 bg-surface shadow-sm hidden lg:flex flex-col py-xl z-40">
      <div className="px-xl mb-xl">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-headline-sm">
            S
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">SplitMate</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Financial Clarity</p>
          </div>
        </div>
      </div>

      <div className="px-md mb-xl flex flex-col gap-sm">
        <button
          onClick={() => navigate('/expenses/add')}
          className="w-full bg-primary-container text-on-primary flex items-center justify-center gap-sm py-3 px-lg rounded-xl font-label-md text-label-md hover:bg-primary transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          Add Expense
        </button>
        <div className="flex gap-sm">
          <button
            onClick={() => navigate('/groups?new=1')}
            className="flex-1 bg-surface-container text-on-surface border border-outline-variant/50 flex items-center justify-center gap-xs py-2 px-md rounded-lg font-label-sm text-label-sm hover:bg-surface-container-low transition-colors"
          >
            Create Group
          </button>
          <button
            onClick={() => navigate('/settlements?new=1')}
            className="flex-1 bg-surface-container text-on-surface border border-outline-variant/50 flex items-center justify-center gap-xs py-2 px-md rounded-lg font-label-sm text-label-sm hover:bg-surface-container-low transition-colors"
          >
            Settle Up
          </button>
        </div>
      </div>

      <nav className="flex-1">
        <ul className="flex flex-col">
          {navItems.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-md px-lg py-md transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/5 text-primary font-bold border-l-4 border-primary translate-x-1'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                    >
                      {item.icon}
                    </span>
                    <span className="font-label-md text-label-md">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

