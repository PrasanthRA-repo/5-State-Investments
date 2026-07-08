import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import ProjectCard from '../components/ProjectCard'

// A simple shared board for jotting down project ideas and leaving comments.
// Deliberately standalone -- no link to transactions, holdings, or the other
// dashboards. Just: add a project, leave comments, see everything as cards.
export default function ProjectsPage() {
  const {
    members,
    projects,
    projectComments,
    addProject,
    updateProject,
    deleteProject,
    addProjectComment,
    updateProjectComment,
    deleteProjectComment,
  } = useData()
  const { currentMemberId } = useAuth()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setSubmitting(true)
    try {
      await addProject({ name: name.trim(), created_by: currentMemberId || null, status: 'Active' })
      setName('')
    } catch (err) {
      setError(err.message || 'Failed to add project.')
    } finally {
      setSubmitting(false)
    }
  }

  // `date` is a plain "YYYY-MM-DD" string from the date input -- pass it as
  // noon UTC (not midnight) so timezone conversion never shifts it to the
  // previous/next day when displayed back.
  async function handleAddComment(projectId, text, date) {
    const created_at = date ? new Date(`${date}T12:00:00`).toISOString() : new Date().toISOString()
    await addProjectComment({
      project_id: projectId,
      member_id: currentMemberId || null,
      comment: text,
      created_at,
    })
  }

  const commentsByProject = (projectId) =>
    projectComments
      .filter((c) => c.project_id === projectId)
      .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Projects</h2>
        <p className="text-xs text-gray-500 mb-4">
          A simple shared space to jot down project ideas and leave comments — not linked to transactions or
          dashboards.
        </p>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name…"
            className="input text-sm flex-1"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 whitespace-nowrap"
          >
            {submitting ? 'Adding…' : '+ Add project'}
          </button>
        </form>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No projects yet — add one above.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              comments={commentsByProject(p.id)}
              members={members}
              onAddComment={handleAddComment}
              onEditComment={updateProjectComment}
              onDeleteComment={deleteProjectComment}
              onUpdateStatus={updateProject}
              onDelete={deleteProject}
            />
          ))}
        </div>
      )}
    </div>
  )
}
