import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import * as storage from '../lib/storage'
import { supabase } from '../lib/supabaseClient'

const DataContext = createContext(null)

// Merges a changed row into a list keyed by `id` (used for both our own
// optimistic updates and incoming Realtime events from other members, so
// whichever arrives first "wins" and the other is a harmless no-op).
function upsertById(list, row) {
  const exists = list.some((r) => r.id === row.id)
  return exists ? list.map((r) => (r.id === row.id ? row : r)) : [...list, row]
}

function removeById(list, id) {
  return list.filter((r) => r.id !== id)
}

export function DataProvider({ children }) {
  const [members, setMembers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [holdings, setHoldings] = useState([])
  const [projects, setProjects] = useState([])
  const [projectComments, setProjectComments] = useState([])
  // Starts true and only resolves once we know whether there's a session --
  // RLS blocks anonymous reads entirely, so there's nothing to fetch until
  // someone is signed in.
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const channelsRef = useRef([])

  const refresh = useCallback(async () => {
    try {
      const [m, t, h, p, pc] = await Promise.all([
        storage.getMembers(),
        storage.getTransactions(),
        storage.getHoldings(),
        storage.getProjects(),
        storage.getProjectComments(),
      ])
      setMembers(m)
      setTransactions(t)
      setHoldings(h)
      setProjects(p)
      setProjectComments(pc)
      setLoadError(null)
    } catch (e) {
      setLoadError(e.message || 'Failed to load data from Supabase')
    } finally {
      setLoading(false)
    }
  }, [])

  function subscribeRealtime() {
    const txChannel = supabase
      .channel('public:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setTransactions((prev) => upsertById(prev, payload.new))
        } else if (payload.eventType === 'DELETE') {
          setTransactions((prev) => removeById(prev, payload.old.id))
        }
      })
      .subscribe()

    const holdingsChannel = supabase
      .channel('public:holdings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holdings' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setHoldings((prev) => upsertById(prev, payload.new))
        } else if (payload.eventType === 'DELETE') {
          setHoldings((prev) => removeById(prev, payload.old.id))
        }
      })
      .subscribe()

    const membersChannel = supabase
      .channel('public:members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        storage.getMembers().then(setMembers).catch(() => {})
      })
      .subscribe()

    const projectsChannel = supabase
      .channel('public:projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setProjects((prev) => upsertById(prev, payload.new))
        } else if (payload.eventType === 'DELETE') {
          setProjects((prev) => removeById(prev, payload.old.id))
        }
      })
      .subscribe()

    const projectCommentsChannel = supabase
      .channel('public:project_comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_comments' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setProjectComments((prev) => upsertById(prev, payload.new))
        } else if (payload.eventType === 'DELETE') {
          setProjectComments((prev) => removeById(prev, payload.old.id))
        }
      })
      .subscribe()

    channelsRef.current = [txChannel, holdingsChannel, membersChannel, projectsChannel, projectCommentsChannel]
  }

  function unsubscribeRealtime() {
    channelsRef.current.forEach((ch) => supabase.removeChannel(ch))
    channelsRef.current = []
  }

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session) {
        refresh()
        subscribeRealtime()
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && channelsRef.current.length === 0) {
        setLoading(true)
        refresh()
        subscribeRealtime()
      } else if (!session) {
        unsubscribeRealtime()
        setMembers([])
        setTransactions([])
        setHoldings([])
        setProjects([])
        setProjectComments([])
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
      unsubscribeRealtime()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addTransaction = useCallback(async (tx) => {
    const row = await storage.addTransaction(tx)
    setTransactions((prev) => upsertById(prev, row))
    return row
  }, [])

  const updateTransaction = useCallback(async (id, patch) => {
    const row = await storage.updateTransaction(id, patch)
    setTransactions((prev) => upsertById(prev, row))
    return row
  }, [])

  const deleteTransaction = useCallback(async (id) => {
    await storage.deleteTransaction(id)
    setTransactions((prev) => removeById(prev, id))
  }, [])

  const addHolding = useCallback(async (holding) => {
    const row = await storage.addHolding(holding)
    setHoldings((prev) => upsertById(prev, row))
    return row
  }, [])

  const updateHolding = useCallback(async (id, patch) => {
    const row = await storage.updateHolding(id, patch)
    setHoldings((prev) => upsertById(prev, row))
    return row
  }, [])

  const deleteHolding = useCallback(async (id) => {
    await storage.deleteHolding(id)
    setHoldings((prev) => removeById(prev, id))
  }, [])

  const addProject = useCallback(async (project) => {
    const row = await storage.addProject(project)
    setProjects((prev) => upsertById(prev, row))
    return row
  }, [])

  const deleteProject = useCallback(async (id) => {
    await storage.deleteProject(id)
    setProjects((prev) => removeById(prev, id))
    setProjectComments((prev) => prev.filter((c) => c.project_id !== id))
  }, [])

  const addProjectComment = useCallback(async (comment) => {
    const row = await storage.addProjectComment(comment)
    setProjectComments((prev) => upsertById(prev, row))
    return row
  }, [])

  const value = {
    members,
    transactions,
    holdings,
    projects,
    projectComments,
    loading,
    loadError,
    refresh,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addHolding,
    updateHolding,
    deleteHolding,
    addProject,
    deleteProject,
    addProjectComment,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
