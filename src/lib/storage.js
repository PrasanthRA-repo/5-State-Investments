// Supabase-backed persistence layer. All 5 members share the same Postgres
// tables (see schema.sql), so any change here is visible to everyone via
// DataContext's Realtime subscription. `settings` (the Twelve Data API key)
// is the one exception -- that stays in this browser's localStorage since
// it's a per-device convenience, not shared group data.

import { supabase } from './supabaseClient'

const SETTINGS_KEY = '5sg_settings'

function readSettingsLocal() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : { twelveDataApiKey: '' }
  } catch (e) {
    console.error('Failed to read settings from localStorage', e)
    return { twelveDataApiKey: '' }
  }
}

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

// --- Settings (API keys etc, local to this browser only) ---
export function getSettings() {
  return readSettingsLocal()
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
