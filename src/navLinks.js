// Shared nav item list used by both the desktop side rail (SideNav.jsx) and
// the mobile bottom navigation bar (BottomNav.jsx), so the two stay in sync.
export const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/me', label: 'Individual', icon: 'person' },
  { to: '/transactions', label: 'Transactions', icon: 'receipt_long' },
  { to: '/projects', label: 'Projects', icon: 'folder' },
]
