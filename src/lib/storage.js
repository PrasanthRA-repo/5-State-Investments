// Supabase-backed persistence layer. All 5 members share the same Postgres
// tables (see schema.sql), so any change here is visible to everyone via
// DataContext's Realtime subscription.

import { supabase } from './supabaseClient'

function must(error, context) {
  if (error) {
    console.error(`Supabase error (${context}):`, error)
    throw error
  }
}

// --- Members ---
export async function getMembers() {
  const { data, error } = await supabase.from('members').select('*').order('name')
  must(error, 'getMembers')
  return data || []
}

// --- Transactions ---
export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
  must(error, 'getTransactions')
  return data || []
}

export async function addTransaction(tx) {
  const payload = {
    status: 'Active',
    notes: '',
    linked_asset: '',
    to_member_id: null,
    batch_id: null,
    batch_total: null,
    batch_count: null,
    batch_split: null,
    ...tx,
    to_member_id: tx.to_member_id || null,
  }
  const { data, error } = await supabase.from('transactions').insert(payload).select().single()
  must(error, 'addTransaction')
  return data
}

export async function updateTransaction(id, patch) {
  const { data, error } = await supabase.from('transactions').update(patch).eq('id', id).select().single()
  must(error, 'updateTransaction')
  return data
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  must(error, 'deleteTransaction')
  return id
}

// --- Holdings ---
export async function getHoldings() {
  const { data, error } = await supabase.from('holdings').select('*')
  must(error, 'getHoldings')
  return data || []
}

export async function addHolding(holding) {
  const payload = { status: 'Active', ...holding }
  const { data, error } = await supabase.from('holdings').insert(payload).select().single()
  must(error, 'addHolding')
  return data
}

export async function updateHolding(id, patch) {
  const { data, error } = await supabase.from('holdings').update(patch).eq('id', id).select().single()
  must(error, 'updateHolding')
  return data
}

export async function deleteHolding(id) {
  const { error } = await supabase.from('holdings').delete().eq('id', id)
  must(error, 'deleteHolding')
  return id
}

// --- Projects (standalone -- not linked to transactions/holdings) ---
export async function getProjects() {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
  must(error, 'getProjects')
  return data || []
}

export async function addProject(project) {
  const { data, error } = await supabase.from('projects').insert(project).select().single()
  must(error, 'addProject')
  return data
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  must(error, 'deleteProject')
  return id
}

// --- Project comments ---
export async function getProjectComments() {
  const { data, error } = await supabase
    .from('project_comments')
    .select('*')
    .order('created_at', { ascending: true })
  must(error, 'getProjectComments')
  return data || []
}

export async function addProjectComment(comment) {
  const { data, error } = await supabase.from('project_comments').insert(comment).select().single()
  must(error, 'addProjectComment')
  return data
}
