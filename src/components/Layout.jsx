import Nav from './Nav'
import SideNav from './SideNav'
import BottomNav from './BottomNav'

// Responsive shell: fixed top app bar everywhere, a persistent left nav rail
// from `sm` up, and a fixed bottom nav bar below `sm`. Content padding
// clears all three so nothing sits underneath a fixed element.
export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-surface-dim dark:bg-slate-900">
      <Nav />
      <SideNav />
      <div className="sm:pl-60">
        <main
          className="mx-auto max-w-6xl px-4 pb-24 sm:pb-6"
          style={{ paddingTop: 'calc(4.5rem + env(safe-area-inset-top))' }}
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
