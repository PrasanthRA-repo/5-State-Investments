import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import MemberSelector from '../components/MemberSelector'
import MemberTransactionHistory from '../components/MemberTransactionHistory'
import StatCard from '../components/StatCard'
import CategoryPieChart from '../components/CategoryPieChart'
import IdleCashCards from '../components/IdleCashCards'
import {
  memberContribution,
  memberOwnershipPct,
  memberHoldingsShare,
  formatCurrency,
} from '../utils/calculations'

export default function IndividualDashboard() {
  const { members, transactions, holdings } = useData()
  const { currentMemberId } = useAuth()
  const [selectedId, setSelectedId] = useState(currentMemberId || members[0]?.id || '')

  const memberId = selectedId || currentMemberId
  const member = members.find((m) => m.id === memberId)

  if (!member) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-gray-500">
        No members yet.
      </div>
    )
  }

  const contribution = memberContribution(transactions, memberId)
  const ownershipPct = memberOwnershipPct(transactions, memberId)
  const holdingsShare = memberHoldingsShare(transactions, holdings, memberId)
  const totalShareValue = Object.values(holdingsShare).reduce((sum, v) => sum + v, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Viewing: {member.name}</h2>
        <MemberSelector value={memberId} onChange={setSelectedId} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total contribution (all-time)" value={formatCurrency(contribution)} />
        <StatCard label="Ownership % of group" value={`${ownershipPct.toFixed(1)}%`} sub="Contribution ÷ total pool" />
        <StatCard label="Share of current holdings" value={formatCurrency(totalShareValue)} sub="At their ownership %" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Their holdings share by category</h2>
          <CategoryPieChart byCategory={holdingsShare} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Personal transaction history</h2>
          <MemberTransactionHistory memberId={memberId} />
        </div>
      </div>

      <IdleCashCards />
    </div>
  )
}
