import { NavLink } from 'react-router-dom'
import { NAV_LINKS } from '../navLinks'
import Icon from './ui/Icon'

// Persistent left navigation rail, visible from the `sm` breakpoint up.
// Below `sm`, BottomNav.jsx takes over instead.
export default function SideNav() {
  return (
    <aside
      className="fixed bottom-0 left-0 top-0 z-20 hidden w-60 flex-col border-r border-slate-200 bg-white pt-[calc(3.75rem+env(safe-area-inset-top))] dark:border-slate-700 dark:bg-slate-800 sm:flex"
    >
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={l.icon} filled={isActive} className="text-[20px]" />
                {l.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
