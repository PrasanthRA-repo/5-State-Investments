import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useData } from './DataContext'

// Real auth now (Supabase email/password) -- "who am I" is resolved by
// matching the signed-in auth user's email to a row in `members`. Create the
// 5 login accounts in Supabase Dashboard > Authentication > Users, then set
// each member's email in the `members` table to match (see schema.sql).
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { members } = useData()
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email, password) => {
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthError(error.message)
      return false
    }
    return true
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const authedEmail = session?.user?.email || null
  const currentMember = authedEmail
    ? members.find((m) => (m.email || '').toLowerCase() === authedEmail.toLowerCase()) || null
    : null

  const value = {
    session,
    authLoading,
    authError,
    signIn,
    logout,
    currentMemberId: currentMember?.id || null,
    currentMember,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
