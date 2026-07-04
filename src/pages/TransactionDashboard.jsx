import { useState } from 'react'
import TransactionForm from '../components/TransactionForm'
import TransactionTable from '../components/TransactionTable'

export default function TransactionDashboard() {
  const [editingTx, setEditingTx] = useState(null)

  return (
    <div className="space-y-6">
      <TransactionForm editingTx={editingTx} onDoneEditing={() => setEditingTx(null)} />
      <TransactionTable onEdit={setEditingTx} />
    </div>
  )
}
