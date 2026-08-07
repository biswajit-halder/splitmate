import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', label: 'Home', icon: 'home' },
  { path: '/groups', label: 'Groups', icon: 'group' },
  { path: '/friends', label: 'Friends', icon: 'person' },
  { path: '/activity', label: 'Activity', icon: 'notifications' },
  { path: '/more', label: 'More', icon: 'more_horiz' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-outline-variant bg-surface lg:hidden">
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-2 py-1 transition-all duration-200 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`
          }
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="font-label-sm text-label-sm">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
