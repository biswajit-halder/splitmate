import { NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/groups', label: 'Groups', icon: 'group' },
  { path: '/friends', label: 'Friends', icon: 'person' },
  { path: '/activity', label: 'Activity', icon: 'history' },
  { path: '/analytics', label: 'Analytics', icon: 'bar_chart' },
  { path: '/settlements', label: 'Settlements', icon: 'payments' },
]

export function Sidebar() {
  const navigate = useNavigate()
  return (
    <aside className="fixed left-0 top-0 h-full w-sidebar border-r border-outline-variant/30 bg-surface shadow-sm hidden lg:flex flex-col py-xl z-40">
      {/* Logo */}
      <div className="px-xl mb-xl">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary">donut_small</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">SplitMate</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Expense Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
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

      {/* Logout at bottom */}
      <div className="px-md mt-auto border-t border-outline-variant/20 pt-md">
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="flex items-center gap-md px-lg py-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors w-full text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-md text-label-md">Logout</span>
        </button>
      </div>
    </aside>
  )
}
