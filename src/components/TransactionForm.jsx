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
  INFLOW_COLLECTIBLE_TYPES,
} from '../constants'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useSnackbar } from '../context/SnackbarContext'
import { memberIdleCash, splitByWeights } from '../utils/calculations'
import Card from './ui/Card'
import Button from './ui/Button'
import TextField from './ui/TextField'
import Select from './ui/Select'
import Icon from './ui/Icon'

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
  collected_by: '',
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
  const { showSnackbar } = useSnackbar()
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
  const isCollectible = INFLOW_COLLECTIBLE_TYPES.includes(form.type)
  const showCollectedBy = isEveryone && isCollectible

  function handleTypeChange(type) {
    setForm((f) => ({
      ...f,
      type,
      category: TYPE_TO_DEFAULT_CATEGORY[type] || f.category,
      // Transfer needs a real single "from" member -- clear Everyone if it was selected
      member_id: type === TRANSFER_TYPE && f.member_id === EVERYONE_VALUE ? '' : f.member_id,
      // "Collected by" only makes sense for Dividend/Return and Loan Repayment
      // Received -- clear it if the type changes to something else.
      collected_by: INFLOW_COLLECTIBLE_TYPES.includes(type) ? f.collected_by : '',
    }))
  }

  function handleMemberChange(memberId) {
    setForm((f) => ({
      ...f,
      member_id: memberId,
      // Only relevant while "Everyone" is selected.
      collected_by: memberId === EVERYONE_VALUE ? f.collected_by : '',
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
      // `collected_by` is a form-only field used to decide whether to
      // auto-generate consolidating transfers below -- it isn't a column in
      // the `transactions` table, so it must never be spread into anything
      // sent to addTransaction/updateTransaction.
      const { collected_by, ...formForTx } = form

      if (isEveryone && !editingTx) {
        const shares = everyoneShares(Number(form.amount))
        const batchId = uid()
        await Promise.all(
          members.map((m, i) =>
            addTransaction({
              ...formForTx,
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

        // If this is a Dividend/Return or Loan Repayment Received and the
        // user told us who actually collected the cash, auto-generate
        // Transfer transactions moving everyone else's equal share to that
        // person. Without this, every member's idle cash goes up even
        // though only one of them actually has the money -- which is
        // exactly the manual cleanup this option is meant to replace.
        if (isCollectible && collected_by) {
          const shareByMemberId = Object.fromEntries(members.map((m, i) => [m.id, shares[i]]))
          const others = members.filter((m) => m.id !== collected_by)
          if (others.length > 0) {
            await Promise.all(
              others.map((m) =>
                addTransaction({
                  date: form.date,
                  member_id: m.id,
                  to_member_id: collected_by,
                  type: TRANSFER_TYPE,
                  category: form.category,
                  amount: shareByMemberId[m.id],
                  status: 'Active',
                  notes: `Auto-transfer: consolidating ${form.type} to whoever actually collected it`,
                  linked_asset: form.linked_asset,
                })
              )
            )
          }
        }

        setForm({ ...emptyForm, member_id: currentMemberId || '' })
        showSnackbar(`Added ${members.length} transactions.`, { type: 'success' })
        return
      }

      const payload = {
        ...formForTx,
        amount: Number(form.amount),
        to_member_id: isTransfer ? form.to_member_id : '',
      }

      if (editingTx) {
        await updateTransaction(editingTx.id, payload)
        onDoneEditing?.()
        showSnackbar('Transaction updated.', { type: 'success' })
      } else {
        await addTransaction(payload)
        setForm({ ...emptyForm, member_id: currentMemberId || '' })
        showSnackbar('Transaction added.', { type: 'success' })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong saving this transaction.')
      showSnackbar(err.message || 'Something went wrong saving this transaction.', { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    setForm({ ...emptyForm, member_id: currentMemberId || '' })
    onDoneEditing?.()
  }

  const previewShares = isEveryone && !editingTx && form.amount ? everyoneShares(Number(form.amount)) : null
  const collectorName = form.collected_by ? members.find((m) => m.id === form.collected_by)?.name : null

  return (
    <Card as="form" onSubmit={handleSubmit}>
      <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
        {editingTx ? 'Edit transaction' : 'Add transaction'}
      </h2>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <Icon name="error" className="mt-0.5 text-[18px]" />
          <span>{error}</span>
        </div>
      )}

      {previewShares && (
        <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-sm text-primary-700 dark:border-primary-900/40 dark:bg-primary-900/20 dark:text-primary-200">
          <p className="font-medium">
            Will create {members.length} transactions ({isOutflow ? 'split by current idle cash held' : 'split equally'}):
          </p>
          <p className="mt-1 text-xs">
            {members.map((m, i) => `${m.name}: ₹${previewShares[i].toLocaleString('en-IN')}`).join('  ·  ')}
          </p>
          {collectorName && (
            <p className="mt-2 text-xs text-primary-800 dark:text-primary-200">
              Then auto-transferring everyone else's share to <strong>{collectorName}</strong>, since they're the one
              who actually collected the cash -- everyone still gets credit for their equal share, but only{' '}
              {collectorName}'s idle cash actually goes up.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />

        <Select label="Type" value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
          {TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        <Select
          label={isTransfer ? 'From member' : 'Member'}
          value={form.member_id}
          onChange={(e) => handleMemberChange(e.target.value)}
        >
          <option value="">Select member</option>
          {!isTransfer && <option value={EVERYONE_VALUE}>Everyone (split equally)</option>}
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>

        {isTransfer && (
          <Select
            label="To member"
            value={form.to_member_id}
            onChange={(e) => setForm((f) => ({ ...f, to_member_id: e.target.value }))}
          >
            <option value="">Select member</option>
            {members
              .filter((m) => m.id !== form.member_id)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </Select>
        )}

        {showCollectedBy && (
          <Select
            label="Collected by (optional)"
            value={form.collected_by}
            onChange={(e) => setForm((f) => ({ ...f, collected_by: e.target.value }))}
          >
            <option value="">— leave split across everyone —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        )}

        <Select label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <TextField
          label={isEveryone ? 'Total amount (₹)' : 'Amount (₹)'}
          type="number"
          min="0"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          placeholder="0"
        />

        <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        <TextField
          label="Linked asset (optional)"
          type="text"
          value={form.linked_asset}
          onChange={(e) => setForm((f) => ({ ...f, linked_asset: e.target.value }))}
          placeholder="e.g. INFY, Flat 3B, loan to Kumar"
        />

        <TextField
          label="Notes (optional)"
          full
          type="text"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Any extra detail"
        />
      </div>

      <div className="mt-5 flex gap-2">
        <Button type="submit" variant="filled" loading={submitting}>
          {submitting
            ? 'Saving…'
            : editingTx
            ? 'Save changes'
            : isEveryone
            ? `Add ${members.length} transactions`
            : 'Add transaction'}
        </Button>
        {editingTx && (
          <Button type="button" variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  )
}
