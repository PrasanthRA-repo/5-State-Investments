import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import IconButton from './ui/IconButton'

// MD3 top app bar. Always visible; the actual page-to-page navigation lives
// in SideNav.jsx (desktop/tablet, left rail) and BottomNav.jsx (mobile,
// bottom bar) so this bar only carries branding + global actions.
export default function Nav() {
  const { currentMember, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-800/95"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:pl-[15.5rem]">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold leading-tight text-slate-900 dark:text-slate-50 sm:text-base">
            5 State Group
          </h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            Logged in as {currentMember?.name}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            icon={isDark ? 'light_mode' : 'dark_mode'}
            label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          />
          <IconButton icon="logout" label="Sign out" onClick={logout} />
        </div>
      </div>
    </header>
  )
}
