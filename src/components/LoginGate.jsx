import { useState, useId } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Button from './ui/Button'
import IconButton from './ui/IconButton'
import Spinner from './ui/Spinner'
import Icon from './ui/Icon'

// Full-bleed branded backdrop shared by every state this gate can show
// (loading / signed-in-but-not-linked / the actual login form). The image
// itself (world map + gold "5 State" lockup) lives in /public so it's just
// served as a plain static file -- see public/login-background.jpg.
function BrandedBackground({ children }) {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{
        backgroundImage: "url('/login-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#0b0b0b', // shows while the image loads, and if it's missing
      }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <IconButton
        icon={isDark ? 'light_mode' : 'dark_mode'}
        label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
        className="fixed right-4 !text-amber-300 hover:!bg-white/10"
        style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
      />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  )
}

// Small gold/glass-styled input used only on this branded login card --
// styled to match the black-and-gold "5 State" brand rather than the app's
// regular light-card TextField, which would look out of place here.
function GoldField({ label, icon, type = 'text', value, onChange, required, ...rest }) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && show ? 'text' : type

  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-medium tracking-wide text-amber-200/80">{label}</span>
      <span className="relative flex items-center">
        <Icon name={icon} className="pointer-events-none absolute left-3 text-[19px] text-amber-400/70" />
        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full rounded-xl border border-amber-400/25 bg-black/40 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 text-amber-400/70 hover:text-amber-300"
          >
            <Icon name={show ? 'visibility_off' : 'visibility'} className="text-[19px]" />
          </button>
        )}
      </span>
    </label>
  )
}

function BrandHeader() {
  return (
    <div className="mb-6 text-center">
      <img
        src="/logo1.png"
        alt="5 State"
        className="mx-auto mb-3 h-16 w-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
      <h1 className="text-lg font-semibold tracking-[0.15em] text-amber-300">WELCOME BACK</h1>
      <p className="mt-1 text-sm text-slate-300">Sign in to continue to 5 State Group</p>
    </div>
  )
}

// Real Supabase email/password login. There's no public sign-up screen on
// purpose -- create the 5 accounts yourself in Supabase Dashboard >
// Authentication > Users, then set each member's email in the `members`
// table to match (see schema.sql / README).
export default function LoginGate({ children }) {
  const { session, authLoading, authError, signIn, logout, currentMember } = useAuth()
  const { loading: dataLoading, loadError, refresh } = useData()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [retrying, setRetrying] = useState(false)

  if (authLoading || (session && dataLoading)) {
    return (
      <BrandedBackground>
        <div className="flex flex-col items-center gap-3 text-sm text-amber-200">
          <Spinner size={22} className="text-amber-400" />
          Loading…
        </div>
      </BrandedBackground>
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
      <BrandedBackground>
        <div className="animate-scale-in rounded-2xl border border-amber-400/25 bg-black/60 p-6 text-center shadow-e4 backdrop-blur-xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15">
            <Icon name="link_off" className="text-[26px] text-amber-300" />
          </div>
          <h1 className="mb-2 text-lg font-semibold text-amber-200">Signed in, but not linked</h1>
          <p className="text-sm text-slate-300">
            You're logged in as <span className="font-medium text-amber-100">{session.user.email}</span>, but no
            member in the group has that email set. Ask whoever set up the database to update their row in the{' '}
            <code className="mx-0.5 rounded bg-black/40 px-1 text-amber-200">members</code> table.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Just fixed it in Supabase? Click Retry -- no need to sign out and back in.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="gold" fullWidth onClick={handleRetry} loading={retrying}>
              {retrying ? 'Checking…' : 'Retry'}
            </Button>
            <Button
              variant="text"
              fullWidth
              onClick={logout}
              className="!text-slate-200 hover:!bg-white/10"
            >
              Sign out
            </Button>
          </div>
        </div>
      </BrandedBackground>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    await signIn(email.trim(), password)
    setSubmitting(false)
  }

  return (
    <BrandedBackground>
      <form
        onSubmit={handleSubmit}
        className="animate-scale-in rounded-2xl border border-amber-400/25 bg-black/60 p-6 shadow-e4 backdrop-blur-xl sm:p-8"
      >
        <BrandHeader />

        {(authError || loadError) && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            <Icon name="error" className="mt-0.5 text-[18px]" />
            <span>{authError || loadError}</span>
          </div>
        )}

        <div className="space-y-3">
          <GoldField
            label="Email"
            icon="person"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <GoldField
            label="Password"
            icon="lock"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" variant="gold" fullWidth loading={submitting} className="mt-5">
          {submitting ? 'Signing in…' : 'Sign In'}
        </Button>

        <p className="mt-4 text-xs text-slate-400">
          No account yet? Ask whoever set up the Supabase project to create one for you
          (Authentication → Users → Add user) and link your email to your member row.
        </p>
      </form>
    </BrandedBackground>
  )
}
