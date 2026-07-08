import { useState } from 'react'

// One project = a name + a running comment thread, rendered as a card.
// Standalone -- doesn't touch transactions/holdings/dashboards at all.
export default function ProjectCard({ project, comments, members, onAddComment, onDeleteComment, onDelete }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)

  const memberName = (id) => members.find((m) => m.id === id)?.name || 'Someone'

  function commentDateLabel(createdAt) {
    if (!createdAt) return ''
    return new Date(createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await onAddComment(project.id, text.trim(), date)
      setText('')
    } catch (err) {
      alert(`Failed to add comment: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  function handleDeleteComment(commentId) {
    onDeleteComment(commentId).catch((err) => alert(`Failed to delete comment: ${err.message}`))
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

      <div className="flex-1 mb-3 max-h-48 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-400">No comments yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {comments.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 text-xs text-gray-700 border-b border-gray-50 pb-1.5 last:border-0 last:pb-0"
              >
                <span className="flex-1 break-words">{c.comment}</span>
                <span className="text-gray-400 whitespace-nowrap">{commentDateLabel(c.created_at)}</span>
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="text-gray-300 hover:text-red-500 leading-none text-sm px-0.5"
                  title="Delete comment"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleAdd} className="space-y-2 mt-auto">
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input text-xs w-36 shrink-0"
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            className="input text-xs flex-1"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add comment'}
        </button>
      </form>
    </div>
  )
}
