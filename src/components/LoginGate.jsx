import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Button from './ui/Button'
import TextField from './ui/TextField'
import IconButton from './ui/IconButton'
import Spinner from './ui/Spinner'

// Real Supabase email/password login. There's no public sign-up screen on
// purpose -- create the 5 accounts yourself in Supabase Dashboard >
// Authentication > Users, then set each member's email in the `members`
// table to match (see schema.sql / README).
export default function LoginGate({ children }) {
  const { session, authLoading, authError, signIn, logout, currentMember } = useAuth()
  const { loading: dataLoading, loadError, refresh } = useData()
  const { isDark, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [retrying, setRetrying] = useState(false)

  const themeToggle = (
    <IconButton
      icon={isDark ? 'light_mode' : 'dark_mode'}
      label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className="fixed right-4 top-4"
      style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
    />
  )

  if (authLoading || (session && dataLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-surface-dim text-sm text-slate-400 dark:bg-slate-900">
        <Spinner size={18} />
        Loading…
      </div>
    )
  }

  if (session && currentMember) return children

  if (session && !currentMember) {
    async function handleRetry() {
      setRetrying(true)
      try {
        await refresh()
      } finally {
        setRetrying(false)
      }
    }

    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        {themeToggle}
        <div className="w-full max-w-sm animate-scale-in rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-e3 dark:border-slate-700 dark:bg-slate-800">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <span className="material-symbols-outlined text-[26px] text-amber-600 dark:text-amber-300">
              link_off
            </span>
          </div>
          <h1 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Signed in, but not linked</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You're logged in as <span className="font-medium text-slate-700 dark:text-slate-200">{session.user.email}</span>,
            but no member in the group has that email set. Ask whoever set up the database to update their row in the{' '}
            <code className="mx-0.5 rounded bg-slate-100 px-1 dark:bg-slate-700">members</code> table.
          </p>
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            Just fixed it in Supabase? Click Retry -- no need to sign out and back in.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="filled" fullWidth onClick={handleRetry} loading={retrying}>
              {retrying ? 'Checking…' : 'Retry'}
            </Button>
            <Button variant="outlined" fullWidth onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    await signIn(email.trim(), password)
    setSubmitting(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      {themeToggle}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm animate-scale-in rounded-2xl border border-slate-200 bg-white p-6 shadow-e3 dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-tertiary-500 shadow-e2">
            <span className="material-symbols-outlined text-[26px] text-white">groups</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">5 State Group</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in with your member account.</p>
        </div>

        {(authError || loadError) && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <span className="material-symbols-outlined mt-0.5 text-[18px]">error</span>
            <span>{authError || loadError}</span>
          </div>
        )}

        <div className="space-y-3">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" variant="filled" fullWidth loading={submitting} className="mt-5">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          No account yet? Ask whoever set up the Supabase project to create one for you
          (Authentication → Users → Add user) and link your email to your member row.
        </p>
      </form>
    </div>
  )
}
