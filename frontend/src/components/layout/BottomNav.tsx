import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', label: 'Home', icon: 'home' },
  { path: '/groups', label: 'Groups', icon: 'group' },
  { path: '/friends', label: 'Friends', icon: 'person' },
  { path: '/activity', label: 'Activity', icon: 'history' },
  { path: '/expenses/add', label: 'Pay', icon: 'account_balance_wallet' },
]

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 w-full z-50 rounded-t-xl border-t border-outline-variant/20 bg-surface shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex justify-around items-center h-16 px-md">
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-colors rounded-xl px-2 py-1 ${
              isActive
                ? 'text-primary font-bold bg-primary/5 scale-90'
                : 'text-on-surface-variant hover:bg-surface-container'
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
              <span className="font-label-sm text-label-sm">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

