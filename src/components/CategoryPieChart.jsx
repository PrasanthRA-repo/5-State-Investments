import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CATEGORY_COLORS } from '../constants'
import { formatCurrency } from '../utils/calculations'

export default function CategoryPieChart({ byCategory }) {
  const data = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value: Number(value) || 0 }))
    .filter((d) => d.value > 0)

  if (data.length === 0) {
    return <div className="text-sm text-gray-400 text-center py-10">No portfolio value yet — add some transactions.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={CATEGORY_COLORS[d.name] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
