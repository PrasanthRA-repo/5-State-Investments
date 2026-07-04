import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Overall', end: true },
  { to: '/me', label: 'Individual' },
  { to: '/transactions', label: 'Transactions' },
]

export default function Nav() {
  const { currentMember, logout } = useAuth()

  return (
    <header
      className="bg-white border-b border-gray-200 sticky top-0 z-10"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="font-semibold text-gray-900 leading-tight truncate">5 State Group</h1>
          <p className="text-xs text-gray-500 truncate">Logged in as {currentMember?.name}</p>
        </div>
        <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-800 whitespace-nowrap ml-2">
          Sign out
        </button>
      </div>
      <nav className="max-w-6xl mx-auto px-4 flex gap-1 border-t border-gray-100 overflow-x-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
                isActive
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
