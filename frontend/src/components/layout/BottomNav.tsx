import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', label: 'Home', icon: 'home' },
  { path: '/groups', label: 'Groups', icon: 'group' },
  { path: '/friends', label: 'Friends', icon: 'person' },
  { path: '/activity', label: 'Activity', icon: 'history' },
  { path: '/expenses/add', label: 'Add', icon: 'add_circle' },
]

export function BottomNav() {
  return (
    <nav className="glass-panel fixed bottom-0 left-0 right-0 z-50 flex h-[68px] items-center justify-around border-t border-line px-sm pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(0,0,0,0.4)] lg:hidden">
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-7 w-11 items-center justify-center rounded-full transition-all ${isActive ? 'bg-primary/20 shadow-[0_0_20px_rgba(255,107,94,0.25)]' : ''}`}
              >
                <span
                  className="material-symbols-outlined text-[21px]"
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                >
                  {item.icon}
                </span>
              </span>
              <span className="font-label-sm">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
