import { useState } from 'react'
import { PROJECT_STATUSES, PROJECT_STATUS_COLORS } from '../constants'
import { useSnackbar } from '../context/SnackbarContext'
import Card from './ui/Card'
import Button from './ui/Button'
import IconButton from './ui/IconButton'
import { ConfirmDialog } from './ui/Dialog'
import Icon from './ui/Icon'

// One project = a name + status + a running comment thread, rendered as a
// card. Standalone -- doesn't touch transactions/holdings/dashboards at all.
export default function ProjectCard({
  project,
  comments,
  members,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onUpdateStatus,
  onDelete,
}) {
  const { showSnackbar } = useSnackbar()
  const [text, setText] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editText, setEditText] = useState('')
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false)
  const [deletingProject, setDeletingProject] = useState(false)

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
      showSnackbar(`Failed to add comment: ${err.message}`, { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  function startEditComment(c) {
    setEditingCommentId(c.id)
    setEditText(c.comment)
  }

  function cancelEditComment() {
    setEditingCommentId(null)
    setEditText('')
  }

  async function saveEditComment(commentId) {
    if (!editText.trim()) return
    try {
      await onEditComment(commentId, { comment: editText.trim() })
      cancelEditComment()
    } catch (err) {
      showSnackbar(`Failed to save comment: ${err.message}`, { type: 'error' })
    }
  }

  function handleDeleteComment(commentId) {
    onDeleteComment(commentId).catch((err) => showSnackbar(`Failed to delete comment: ${err.message}`, { type: 'error' }))
  }

  function handleStatusChange(e) {
    onUpdateStatus(project.id, { status: e.target.value }).catch((err) =>
      showSnackbar(`Failed to update status: ${err.message}`, { type: 'error' })
    )
  }

  async function confirmDelete() {
    setDeletingProject(true)
    try {
      await onDelete(project.id)
      setConfirmDeleteProject(false)
    } catch (err) {
      showSnackbar(`Failed to delete: ${err.message}`, { type: 'error' })
    } finally {
      setDeletingProject(false)
    }
  }

  const statusColor = PROJECT_STATUS_COLORS[project.status] || '#6b7280'

  return (
    <Card accentColor={statusColor} hoverable className="flex flex-col" padding="p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{project.name}</h3>
        <IconButton icon="delete" label="Delete project" variant="danger" onClick={() => setConfirmDeleteProject(true)} />
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Added {project.created_at ? new Date(project.created_at).toLocaleDateString('en-IN') : '—'}
          {project.created_by ? ` · ${memberName(project.created_by)}` : ''}
        </p>
        <select
          value={project.status || 'Active'}
          onChange={handleStatusChange}
          className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[11px] font-medium dark:border-slate-600 dark:bg-slate-800"
          style={{ color: statusColor }}
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 max-h-48 flex-1 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">No comments yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {comments.map((c) =>
              editingCommentId === c.id ? (
                <li key={c.id} className="flex items-center gap-1 border-b border-slate-50 pb-1.5 last:border-0 last:pb-0 dark:border-slate-700/60">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="input text-xs flex-1 !py-1.5"
                    autoFocus
                  />
                  <button
                    onClick={() => saveEditComment(c.id)}
                    className="whitespace-nowrap text-xs text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditComment}
                    className="whitespace-nowrap text-xs text-slate-400 hover:underline dark:text-slate-500"
                  >
                    Cancel
                  </button>
                </li>
              ) : (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 border-b border-slate-50 pb-1.5 text-xs text-slate-700 last:border-0 last:pb-0 dark:border-slate-700/60 dark:text-slate-300"
                >
                  <span className="flex-1 break-words">{c.comment}</span>
                  <span className="whitespace-nowrap text-slate-400 dark:text-slate-500">{commentDateLabel(c.created_at)}</span>
                  <button
                    onClick={() => startEditComment(c)}
                    className="whitespace-nowrap text-[11px] leading-none text-slate-300 hover:text-primary-600 dark:text-slate-600 dark:hover:text-primary-400"
                    title="Edit comment"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="px-0.5 text-sm leading-none text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400"
                    title="Delete comment"
                  >
                    <Icon name="close" className="text-[15px]" />
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-auto space-y-2">
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-36 shrink-0 text-xs !py-1.5"
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            className="input flex-1 text-xs !py-1.5"
          />
        </div>
        <Button type="submit" fullWidth size="sm" loading={submitting} disabled={!text.trim()}>
          Add comment
        </Button>
      </form>

      <ConfirmDialog
        open={confirmDeleteProject}
        title="Delete project?"
        message={`Delete project "${project.name}"? This also removes its comments.`}
        loading={deletingProject}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteProject(false)}
      />
    </Card>
  )
}
