import { NavLink } from 'react-router-dom'
import { NAV_LINKS } from '../navLinks'
import Icon from './ui/Icon'

// Fixed bottom navigation bar shown below the `sm` breakpoint, matching the
// MD3 mobile navigation pattern (icon + label, active item highlighted).
// SideNav.jsx is the desktop/tablet equivalent.
export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-800/95 sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV_LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors duration-200 ${
              isActive ? 'text-primary-700 dark:text-primary-300' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200 ${
                  isActive ? 'bg-primary-100 dark:bg-primary-900/40' : ''
                }`}
              >
                <Icon name={l.icon} filled={isActive} className="text-[22px]" />
              </span>
              {l.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
