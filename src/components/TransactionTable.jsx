import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { useSnackbar } from '../context/SnackbarContext'
import { TRANSACTION_TYPES, CATEGORIES, TRANSFER_TYPE } from '../constants'
import { runningBalance, formatCurrency } from '../utils/calculations'
import Card from './ui/Card'
import Select from './ui/Select'
import TextField from './ui/TextField'
import Chip from './ui/Chip'
import EmptyState from './ui/EmptyState'
import Icon from './ui/Icon'
import IconButton from './ui/IconButton'
import { ConfirmDialog } from './ui/Dialog'

export default function TransactionTable({ onEdit }) {
  const { members, transactions, deleteTransaction } = useData()
  const { showSnackbar } = useSnackbar()

  const [memberFilter, setMemberFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const memberName = (id) => members.find((m) => m.id === id)?.name || '—'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions.filter((t) => {
      if (memberFilter && t.member_id !== memberFilter && t.to_member_id !== memberFilter) return false
      if (typeFilter && t.type !== typeFilter) return false
      if (categoryFilter && t.category !== categoryFilter) return false
      if (fromDate && t.date < fromDate) return false
      if (toDate && t.date > toDate) return false
      if (q) {
        const haystack = `${t.linked_asset || ''} ${t.notes || ''} ${t.type} ${t.category}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [transactions, memberFilter, typeFilter, categoryFilter, fromDate, toDate, search])

  // Running balance is computed on chronological (ascending) order across
  // the filtered set, then displayed in whichever order the user picked.
  const withBalance = useMemo(() => {
    const ascending = [...filtered].sort(
      (a, b) => a.date.localeCompare(b.date) || a.created_at?.localeCompare(b.created_at || '')
    )
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

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteTransaction(pendingDelete.id)
      showSnackbar('Transaction deleted.', { type: 'success' })
      setPendingDelete(null)
    } catch (e) {
      showSnackbar(`Failed to delete: ${e.message}`, { type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Transactions</h2>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Pool balance (filtered):{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(finalBalance)}</span>
        </div>
      </div>

      <div className="mb-3">
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes / linked asset / type / category…"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} className="text-xs">
          <option value="">All members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-xs">
          <option value="">All types</option>
          {TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-xs">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <TextField type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="text-xs" />
        <TextField type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="text-xs" />
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon="search_off" title="No transactions match these filters" />
      ) : (
        <>
          {/* Mobile: stacked cards (below sm). Desktop/tablet: full table (sm and up). */}
          <div className="space-y-2 sm:hidden">
            {sorted.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {t.type} <span className="font-normal text-slate-400 dark:text-slate-500">· {t.category}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {t.date} · {memberName(t.member_id)}
                      {t.type === TRANSFER_TYPE && <span> → {memberName(t.to_member_id)}</span>}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(t.amount)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <Chip tone="neutral">{t.status}</Chip>
                  {t.linked_asset && <span>{t.linked_asset}</span>}
                  <span>Balance: {formatCurrency(t.balance)}</span>
                  {t.batch_id && (
                    <Chip tone="primary">split 1/{t.batch_count}</Chip>
                  )}
                </div>
                <div className="mt-2 flex gap-3 text-xs">
                  <button onClick={() => onEdit(t)} className="text-primary-600 hover:underline dark:text-primary-400">
                    Edit
                  </button>
                  <button
                    onClick={() => setPendingDelete(t)}
                    className="text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-800">
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="cursor-pointer select-none py-2 px-2" onClick={() => toggleSort('date')}>
                    <span className="inline-flex items-center gap-0.5">
                      Date {sortBy === 'date' && <Icon name={sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'} className="text-[14px]" />}
                    </span>
                  </th>
                  <th className="py-2 px-2">Member</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Category</th>
                  <th className="cursor-pointer select-none py-2 px-2 text-right" onClick={() => toggleSort('amount')}>
                    <span className="inline-flex items-center gap-0.5">
                      Amount {sortBy === 'amount' && <Icon name={sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'} className="text-[14px]" />}
                    </span>
                  </th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Linked asset</th>
                  <th className="py-2 px-2 text-right">Balance</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-700/40"
                  >
                    <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{t.date}</td>
                    <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {memberName(t.member_id)}
                      {t.type === TRANSFER_TYPE && (
                        <span className="text-slate-400 dark:text-slate-500"> → {memberName(t.to_member_id)}</span>
                      )}
                      {t.batch_id && (
                        <span
                          className="ml-1 align-middle text-[10px] text-primary-600 dark:text-primary-400"
                          title={`Part of an equal split of ${formatCurrency(t.batch_total)} across ${t.batch_count} members`}
                        >
                          1/{t.batch_count}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{t.type}</td>
                    <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{t.category}</td>
                    <td className="py-2 px-2 text-right whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{t.status}</td>
                    <td className="py-2 px-2 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {t.linked_asset || '—'}
                    </td>
                    <td className="py-2 px-2 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {formatCurrency(t.balance)}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap text-right">
                      <IconButton icon="edit" label="Edit transaction" onClick={() => onEdit(t)} className="mr-1" />
                      <IconButton icon="delete" label="Delete transaction" variant="danger" onClick={() => setPendingDelete(t)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete transaction?"
        message={
          pendingDelete
            ? `Delete this ${pendingDelete.type} transaction for ${formatCurrency(pendingDelete.amount)}? This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Card>
  )
}
