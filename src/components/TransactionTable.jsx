import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { TRANSACTION_TYPES, CATEGORIES, TRANSFER_TYPE } from '../constants'
import { runningBalance, formatCurrency } from '../utils/calculations'

export default function TransactionTable({ onEdit }) {
  const { members, transactions, deleteTransaction } = useData()

  const [memberFilter, setMemberFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  const memberName = (id) => members.find((m) => m.id === id)?.name || '—'

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (memberFilter && t.member_id !== memberFilter && t.to_member_id !== memberFilter) return false
      if (typeFilter && t.type !== typeFilter) return false
      if (categoryFilter && t.category !== categoryFilter) return false
      if (fromDate && t.date < fromDate) return false
      if (toDate && t.date > toDate) return false
      return true
    })
  }, [transactions, memberFilter, typeFilter, categoryFilter, fromDate, toDate])

  // Running balance is computed on chronological (ascending) order across
  // the filtered set, then displayed in whichever order the user picked.
  const withBalance = useMemo(() => {
    const ascending = [...filtered].sort((a, b) => a.date.localeCompare(b.date) || a.created_at?.localeCompare(b.created_at || ''))
    return runningBalance(ascending)
  }, [filtered])

  const sorted = useMemo(() => {
    const rows = [...withBalance]
    rows.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'date') cmp = a.date.localeCompare(b.date)
      if (sortBy === 'amount') cmp = Number(a.amount) - Number(b.amount)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [withBalance, sortBy, sortDir])

  function toggleSort(col) {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  const finalBalance = withBalance.length ? withBalance[withBalance.length - 1].balance : 0

  function handleDelete(tx) {
    if (confirm(`Delete this ${tx.type} transaction for ${formatCurrency(tx.amount)}?`)) {
      deleteTransaction(tx.id).catch((e) => alert(`Failed to delete: ${e.message}`))
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-gray-900">Transactions</h2>
        <div className="text-sm text-gray-600">
          Pool balance (filtered): <span className="font-semibold text-gray-900">{formatCurrency(finalBalance)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} className="input text-xs">
          <option value="">All members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input text-xs">
          <option value="">All types</option>
          {TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input text-xs">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input text-xs" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input text-xs" />
      </div>

      {/* Mobile: stacked cards (below sm). Desktop/tablet: full table (sm and up). */}
      <div className="sm:hidden space-y-2">
        {sorted.length === 0 && (
          <p className="py-6 text-center text-gray-400 text-sm">No transactions match these filters.</p>
        )}
        {sorted.map((t) => (
          <div key={t.id} className="border border-gray-200 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {t.type} <span className="text-gray-400 font-normal">· {t.category}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.date} · {memberName(t.member_id)}
                  {t.type === TRANSFER_TYPE && <span> → {memberName(t.to_member_id)}</span>}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(t.amount)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
              <span>Status: {t.status}</span>
              {t.linked_asset && <span>{t.linked_asset}</span>}
              <span>Balance: {formatCurrency(t.balance)}</span>
              {t.batch_id && (
                <span className="text-brand-600 bg-brand-50 rounded px-1 py-0.5">
                  split 1/{t.batch_count}
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-2 text-xs">
              <button onClick={() => onEdit(t)} className="text-brand-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete(t)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm min-w-[780px]">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
              <th className="py-2 px-2 cursor-pointer select-none" onClick={() => toggleSort('date')}>
                Date {sortBy === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="py-2 px-2">Member</th>
              <th className="py-2 px-2">Type</th>
              <th className="py-2 px-2">Category</th>
              <th className="py-2 px-2 text-right cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                Amount {sortBy === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Linked asset</th>
              <th className="py-2 px-2 text-right">Balance</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-2 whitespace-nowrap">{t.date}</td>
                <td className="py-2 px-2 whitespace-nowrap">
                  {memberName(t.member_id)}
                  {t.type === TRANSFER_TYPE && (
                    <span className="text-gray-400"> → {memberName(t.to_member_id)}</span>
                  )}
                  {t.batch_id && (
                    <span
                      className="ml-1 text-[10px] text-brand-600 bg-brand-50 rounded px-1 py-0.5 align-middle"
                      title={`Part of an equal split of ${formatCurrency(t.batch_total)} across ${t.batch_count} members`}
                    >
                      1/{t.batch_count}
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 whitespace-nowrap">{t.type}</td>
                <td className="py-2 px-2 whitespace-nowrap">{t.category}</td>
                <td className="py-2 px-2 text-right whitespace-nowrap">{formatCurrency(t.amount)}</td>
                <td className="py-2 px-2 whitespace-nowrap">{t.status}</td>
                <td className="py-2 px-2 whitespace-nowrap text-gray-500">{t.linked_asset || '—'}</td>
                <td className="py-2 px-2 text-right whitespace-nowrap">{formatCurrency(t.balance)}</td>
                <td className="py-2 px-2 whitespace-nowrap text-right">
                  <button onClick={() => onEdit(t)} className="text-brand-600 hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(t)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-gray-400">No transactions match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
