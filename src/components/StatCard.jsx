export default function StatCard({ label, value, sub, tone, className = '' }) {
  const toneClass =
    tone === 'positive' ? 'text-green-600' : tone === 'negative' ? 'text-red-600' : 'text-gray-900'

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-4 ${className}`}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-lg sm:text-xl font-semibold break-words ${toneClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5 break-words">{sub}</p>}
    </div>
  )
}
