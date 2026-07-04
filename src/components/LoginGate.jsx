import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

// Real Supabase email/password login. There's no public sign-up screen on
// purpose -- create the 5 accounts yourself in Supabase Dashboard >
// Authentication > Users, then set each member's email in the `members`
// table to match (see schema.sql / README).
export default function LoginGate({ children }) {
  const { session, authLoading, authError, signIn, currentMember } = useAuth()
  const { loading: dataLoading, loadError } = useData()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (authLoading || (session && dataLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  if (session && currentMember) return children

  if (session && !currentMember) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Signed in, but not linked</h1>
          <p className="text-sm text-gray-500">
            You're logged in as <span className="font-medium">{session.user.email}</span>, but no member in the
            group has that email set. Ask whoever set up the database to update their row in the
            <code className="mx-1 bg-gray-100 px-1 rounded">members</code> table.
          </p>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    await signIn(email, password)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">5 State Group</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with your member account.</p>

        {(authError || loadError) && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {authError || loadError}
          </div>
        )}

        <label className="block mb-3">
          <span className="block text-xs font-medium text-gray-600 mb-1">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
        </label>

        <label className="block mb-4">
          <span className="block text-xs font-medium text-gray-600 mb-1">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          No account yet? Ask whoever set up the Supabase project to create one for you
          (Authentication → Users → Add user) and link your email to your member row.
        </p>
      </form>
    </div>
  )
}
