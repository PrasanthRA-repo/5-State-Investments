import { useState, useEffect } from 'react'
import {
  TRANSACTION_TYPES,
  CATEGORIES,
  STATUSES,
  TYPE_TO_DEFAULT_CATEGORY,
  TRANSFER_TYPE,
  EVERYONE_VALUE,
  OUTFLOW_TYPES,
  OUTFLOW_TO_INVESTMENT_TYPES,
} from '../constants'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { memberIdleCash, splitByWeights } from '../utils/calculations'

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  member_id: '',
  to_member_id: '',
  type: 'Contribution',
  category: 'Cash',
  amount: '',
  status: 'Active',
  notes: '',
  linked_asset: '',
}

// Types where money is leaving a member's hand (investing/withdrawing/
// spending). For these, "Everyone" splits proportional to who's currently
// holding idle cash -- otherwise someone with more cash on hand ends up with
// leftover while someone with less goes negative, even though the group
// total is correct. Money coming IN (Contribution, dividends, repayments)
// still splits flat equal -- that's new/returned money, unrelated to who
// currently holds what.
const OUTFLOW_ALL_TYPES = [...OUTFLOW_TYPES, ...OUTFLOW_TO_INVESTMENT_TYPES]

function splitEqually(total, count) {
  const base = Math.floor(total / count)
  const remainder = total - base * count
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export default function TransactionForm({ editingTx, onDoneEditing }) {
  const { members, transactions, addTransaction, updateTransaction } = useData()
  const { currentMemberId } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editingTx) {
      setForm({ ...emptyForm, ...editingTx })
    } else {
      setForm({ ...emptyForm, member_id: currentMemberId || '' })
    }
  }, [editingTx, currentMemberId])

  const isTransfer = form.type === TRANSFER_TYPE
  const isEveryone = form.member_id === EVERYONE_VALUE
  const isOutflow = OUTFLOW_ALL_TYPES.includes(form.type)

  function handleTypeChange(type) {
    setForm((f) => ({
      ...f,
      type,
      category: TYPE_TO_DEFAULT_CATEGORY[type] || f.category,
      // Transfer needs a real single "from" member -- clear Everyone if it was selected
      member_id: type === TRANSFER_TYPE && f.member_id === EVERYONE_VALUE ? '' : f.member_id,
    }))
  }

  function everyoneShares(total) {
    if (isOutflow) {
      const weights = members.map((m) => memberIdleCash(transactions, m.id))
      return splitByWeights(total, weights)
    }
    return splitEqually(total, members.length)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.member_id) return setError(isTransfer ? 'Select who the transfer is from.' : 'Select a member.')
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter an amount greater than 0.')
    if (!form.date) return setError('Select a date.')
    if (isTransfer) {
      if (!form.to_member_id) return setError('Select who the transfer is going to.')
      if (form.to_member_id === form.member_id) return setError('From and To must be different members.')
    }

    setSubmitting(true)
    try {
      if (isEveryone && !editingTx) {
        const shares = everyoneShares(Number(form.amount))
        const batchId = uid()
        await Promise.all(
          members.map((m, i) =>
            addTransaction({
              ...form,
              member_id: m.id,
              to_member_id: '',
              amount: shares[i],
              batch_id: batchId,
              batch_total: Number(form.amount),
              batch_count: members.length,
              batch_split: isOutflow ? 'idle_cash_weighted' : 'equal',
            })
          )
        )
        setForm({ ...emptyForm, member_id: currentMemberId || '' })
        return
      }

      const payload = {
        ...form,
        amount: Number(form.amount),
        to_member_id: isTransfer ? form.to_member_id : '',
      }

      if (editingTx) {
        await updateTransaction(editingTx.id, payload)
        onDoneEditing?.()
      } else {
        await addTransaction(payload)
        setForm({ ...emptyForm, member_id: currentMemberId || '' })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong saving this transaction.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    setForm({ ...emptyForm, member_id: currentMemberId || '' })
    onDoneEditing?.()
  }

  const previewShares = isEveryone && !editingTx && form.amount ? everyoneShares(Number(form.amount)) : null

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        {editingTx ? 'Edit transaction' : 'Add transaction'}
      </h2>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {previewShares && (
        <div className="mb-4 text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
          <p className="font-medium">
            Will create {members.length} transactions ({isOutflow ? 'split by current idle cash held' : 'split equally'}):
          </p>
          <p className="text-xs mt-1">
            {members.map((m, i) => `${m.name}: ₹${previewShares[i].toLocaleString('en-IN')}`).join('  ·  ')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="input"
          />
        </Field>

        <Field label="Type">
          <select
            value={form.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="input"
          >
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label={isTransfer ? 'From member' : 'Member'}>
          <select
            value={form.member_id}
            onChange={(e) => setForm((f) => ({ ...f, member_id: e.target.value }))}
            className="input"
          >
            <option value="">Select member</option>
            {!isTransfer && (
              <option value={EVERYONE_VALUE}>Everyone (split equally)</option>
            )}
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>

        {isTransfer && (
          <Field label="To member">
            <select
              value={form.to_member_id}
              onChange={(e) => setForm((f) => ({ ...f, to_member_id: e.target.value }))}
              className="input"
            >
              <option value="">Select member</option>
              {members
                .filter((m) => m.id !== form.member_id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </Field>
        )}

        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label={isEveryone ? 'Total amount (₹)' : 'Amount (₹)'}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="input"
            placeholder="0"
          />
        </Field>

        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="input"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Linked asset (optional)">
          <input
            type="text"
            value={form.linked_asset}
            onChange={(e) => setForm((f) => ({ ...f, linked_asset: e.target.value }))}
            className="input"
            placeholder="e.g. INFY, Flat 3B, loan to Kumar"
          />
        </Field>

        <Field label="Notes (optional)" full>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="input"
            placeholder="Any extra detail"
          />
        </Field>
      </div>

      <div className="flex gap-2 mt-5">
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {submitting
            ? 'Saving…'
            : editingTx
            ? 'Save changes'
            : isEveryone
            ? `Add ${members.length} transactions`
            : 'Add transaction'}
        </button>
        {editingTx && (
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function Field({ label, children, full }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
