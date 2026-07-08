import { useData } from '../context/DataContext'
import Select from './ui/Select'

export default function MemberSelector({ value, onChange }) {
  const { members } = useData()

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="w-full sm:w-56">
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </Select>
  )
}
