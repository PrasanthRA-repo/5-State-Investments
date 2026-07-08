import { useState } from 'react'

// One project = a name + a running comment thread, rendered as a card.
// Standalone -- doesn't touch transactions/holdings/dashboards at all.
export default function ProjectCard({ project, comments, members, onAddComment, onDelete }) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const memberName = (id) => members.find((m) => m.id === id)?.name || 'Someone'

  async function handleAdd(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await onAddComment(project.id, text.trim())
      setText('')
    } catch (err) {
      alert(`Failed to add comment: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  function handleDelete() {
    if (confirm(`Delete project "${project.name}"? This also removes its comments.`)) {
      onDelete(project.id).catch((err) => alert(`Failed to delete: ${err.message}`))
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold text-gray-900 break-words">{project.name}</h3>
        <button onClick={handleDelete} className="text-xs text-red-600 hover:underline whitespace-nowrap">
          Delete
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">
        Added {project.created_at ? new Date(project.created_at).toLocaleDateString('en-IN') : '—'}
        {project.created_by ? ` · ${memberName(project.created_by)}` : ''}
      </p>

      <div className="flex-1 space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-400">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="bg-gray-50 rounded-lg px-2 py-1.5">
              <p className="text-xs text-gray-800 break-words">{c.comment}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {memberName(c.member_id)} ·{' '}
                {c.created_at
                  ? new Date(c.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                  : ''}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mt-auto">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="input text-xs"
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="text-xs font-medium px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 whitespace-nowrap"
        >
          {submitting ? '…' : 'Add'}
        </button>
      </form>
    </div>
  )
}
