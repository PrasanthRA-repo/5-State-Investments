import { useState } from 'react'
import { useData } from '../context/DataContext'
import { STATUSES, INVESTMENT_CATEGORIES } from '../constants'
import { formatCurrency } from '../utils/calculations'

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
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyHolding)
  const [editingId, setEditingId] = useState(null)

  const isStock = form.category === 'Stock Market'
  const computedInvested =
    isStock && form.quantity && form.average_price
      ? Number(form.quantity) * Number(form.average_price)
      : null

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
      } else {
        await addHolding(payload)
      }
      resetForm()
    } catch (e) {
      alert(`Failed to save holding: ${e.message}`)
    }
  }

  function handleDelete(id) {
    if (confirm('Remove this holding? Its category total will fall back to the raw transaction amount.')) {
      deleteHolding(id).catch((e) => alert(`Failed to delete: ${e.message}`))
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">Holdings (manual value updates)</h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          {open ? 'Close' : editingId ? 'Editing…' : '+ Add holding'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-4 items-end">
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="input text-xs col-span-1"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder={isStock ? 'Company name (e.g. Reliance Industries)' : 'Description (e.g. Flat 3B)'}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="input text-xs col-span-2 sm:col-span-2"
          />

          {isStock && (
            <input
              type="text"
              placeholder="Ticker (e.g. RELIANCE)"
              value={form.ticker}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
              className="input text-xs"
            />
          )}

          {isStock ? (
            <>
              <input
                type="number"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="input text-xs"
              />
              <input
                type="number"
                placeholder="Average price"
                value={form.average_price}
                onChange={(e) => setForm((f) => ({ ...f, average_price: e.target.value }))}
                className="input text-xs"
              />
            </>
          ) : (
            <input
              type="number"
              placeholder="Invested"
              value={form.amount_invested}
              onChange={(e) => setForm((f) => ({ ...f, amount_invested: e.target.value }))}
              className="input text-xs"
            />
          )}

          <input
            type="number"
            placeholder="Current value"
            value={form.current_value}
            onChange={(e) => setForm((f) => ({ ...f, current_value: e.target.value }))}
            className="input text-xs"
          />
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="input text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {isStock && computedInvested !== null && (
            <p className="col-span-2 sm:col-span-6 text-xs text-gray-500">
              Invested (auto = qty × avg price): {formatCurrency(computedInvested)}
            </p>
          )}

          <div className="col-span-2 sm:col-span-6 flex gap-2">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-3 py-2 rounded-lg">
              {editingId ? 'Save' : 'Add'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {holdings.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          No manual holdings yet — category totals use raw transaction amounts.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
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
                <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 whitespace-nowrap">{h.category}</td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    {h.description}
                    {h.category === 'Stock Market' && h.ticker && (
                      <span className="block text-[11px] text-gray-400">
                        {h.ticker} · {h.quantity || 0} @ {formatCurrency(h.average_price)}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">{formatCurrency(h.amount_invested)}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">{formatCurrency(h.current_value)}</td>
                  <td className="py-2 px-2 whitespace-nowrap">{h.status}</td>
                  <td className="py-2 px-2 whitespace-nowrap text-right">
                    <button onClick={() => startEdit(h)} className="text-brand-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(h.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
