import { useData } from '../context/DataContext'

export default function MemberSelector({ value, onChange }) {
  const { members } = useData()

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input w-full sm:w-56">
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  )
}
