import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useSnackbar } from '../context/SnackbarContext'
import { STATUSES, INVESTMENT_CATEGORIES } from '../constants'
import { formatCurrency } from '../utils/calculations'
import Card from './ui/Card'
import Button from './ui/Button'
import TextField from './ui/TextField'
import Select from './ui/Select'
import IconButton from './ui/IconButton'
import EmptyState from './ui/EmptyState'
import { ConfirmDialog } from './ui/Dialog'

const CATEGORY_OPTIONS = INVESTMENT_CATEGORIES

const emptyHolding = {
  category: 'Lending',
  description: '',
  amount_invested: '',
  current_value: '',
  date_acquired: '',
  status: 'Active',
  ticker: '',
  quantity: '',
  average_price: '',
}

// Manual holdings let the group record a real current value for a specific
// stock/property/loan (since there's no live price feed for most categories
// in v1). Any category with at least one holding here overrides that
// category's transaction-based total on the Overall Dashboard.
//
// Stock Market holdings additionally support ticker/quantity/average price --
// invested amount is computed as quantity x average price. Current value is
// updated manually here (no live sync -- Twelve Data's free tier doesn't
// cover NSE/India, so that experiment was removed).
export default function HoldingsEditor() {
  const { holdings, addHolding, updateHolding, deleteHolding } = useData()
  const { showSnackbar } = useSnackbar()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyHolding)
  const [editingId, setEditingId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const isStock = form.category === 'Stock Market'
  const computedInvested =
    isStock && form.quantity && form.average_price ? Number(form.quantity) * Number(form.average_price) : null

  function startEdit(h) {
    setEditingId(h.id)
    setForm({ ...emptyHolding, ...h })
    setOpen(true)
  }

  function resetForm() {
    setForm(emptyHolding)
    setEditingId(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.description || form.current_value === '') return

    const payload = {
      ...form,
      amount_invested: computedInvested !== null ? computedInvested : Number(form.amount_invested) || 0,
      current_value: Number(form.current_value) || 0,
      date_acquired: form.date_acquired || null,
      ticker: form.ticker || null,
      quantity: form.quantity === '' ? null : Number(form.quantity),
      average_price: form.average_price === '' ? null : Number(form.average_price),
    }

    try {
      if (editingId) {
        await updateHolding(editingId, payload)
        showSnackbar('Holding updated.', { type: 'success' })
      } else {
        await addHolding(payload)
        showSnackbar('Holding added.', { type: 'success' })
      }
      resetForm()
    } catch (e) {
      showSnackbar(`Failed to save holding: ${e.message}`, { type: 'error' })
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteHolding(pendingDelete.id)
      showSnackbar('Holding removed.', { type: 'success' })
      setPendingDelete(null)
    } catch (e) {
      showSnackbar(`Failed to delete: ${e.message}`, { type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Holdings (manual value updates)</h2>
        <Button variant="text" size="sm" icon={open ? undefined : 'add'} onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : editingId ? 'Editing…' : 'Add holding'}
        </Button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-2 items-end gap-2 sm:grid-cols-6">
          <Select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="col-span-1 text-xs"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <TextField
            placeholder={isStock ? 'Company name (e.g. Reliance Industries)' : 'Description (e.g. Flat 3B)'}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="col-span-2 text-xs sm:col-span-2"
          />

          {isStock && (
            <TextField
              placeholder="Ticker (e.g. RELIANCE)"
              value={form.ticker}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
              className="text-xs"
            />
          )}

          {isStock ? (
            <>
              <TextField
                type="number"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="text-xs"
              />
              <TextField
                type="number"
                placeholder="Average price"
                value={form.average_price}
                onChange={(e) => setForm((f) => ({ ...f, average_price: e.target.value }))}
                className="text-xs"
              />
            </>
          ) : (
            <TextField
              type="number"
              placeholder="Invested"
              value={form.amount_invested}
              onChange={(e) => setForm((f) => ({ ...f, amount_invested: e.target.value }))}
              className="text-xs"
            />
          )}

          <TextField
            type="number"
            placeholder="Current value"
            value={form.current_value}
            onChange={(e) => setForm((f) => ({ ...f, current_value: e.target.value }))}
            className="text-xs"
          />
          <Select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          {isStock && computedInvested !== null && (
            <p className="col-span-2 text-xs text-slate-500 dark:text-slate-400 sm:col-span-6">
              Invested (auto = qty × avg price): {formatCurrency(computedInvested)}
            </p>
          )}

          <div className="col-span-2 flex gap-2 sm:col-span-6">
            <Button type="submit" size="sm">
              {editingId ? 'Save' : 'Add'}
            </Button>
            {editingId && (
              <Button type="button" variant="outlined" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}

      {holdings.length === 0 ? (
        <EmptyState
          icon="account_balance"
          title="No manual holdings yet"
          subtitle="Category totals use raw transaction amounts."
        />
      ) : (
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="py-2 px-2">Category</th>
                <th className="py-2 px-2">Description</th>
                <th className="py-2 px-2 text-right">Invested</th>
                <th className="py-2 px-2 text-right">Current value</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr
                  key={h.id}
                  className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-700/40"
                >
                  <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{h.category}</td>
                  <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {h.description}
                    {h.category === 'Stock Market' && h.ticker && (
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                        {h.ticker} · {h.quantity || 0} @ {formatCurrency(h.average_price)}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {formatCurrency(h.amount_invested)}
                  </td>
                  <td className="py-2 px-2 text-right whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(h.current_value)}
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{h.status}</td>
                  <td className="py-2 px-2 whitespace-nowrap text-right">
                    <IconButton icon="edit" label="Edit holding" onClick={() => startEdit(h)} className="mr-1" />
                    <IconButton icon="delete" label="Delete holding" variant="danger" onClick={() => setPendingDelete(h)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove holding?"
        message="Remove this holding? Its category total will fall back to the raw transaction amount."
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Card>
  )
}
