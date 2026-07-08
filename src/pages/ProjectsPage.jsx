import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useSnackbar } from '../context/SnackbarContext'
import ProjectCard from '../components/ProjectCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import EmptyState from '../components/ui/EmptyState'
import Icon from '../components/ui/Icon'

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
  const { showSnackbar } = useSnackbar()
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
      showSnackbar('Project added.', { type: 'success' })
    } catch (err) {
      setError(err.message || 'Failed to add project.')
      showSnackbar(err.message || 'Failed to add project.', { type: 'error' })
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
    projectComments.filter((c) => c.project_id === projectId).sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">Projects</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          A simple shared space to jot down project ideas and leave comments — not linked to transactions or
          dashboards.
        </p>
        <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
          <TextField
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name…"
            className="flex-1"
          />
          <Button type="submit" icon="add" loading={submitting} disabled={!name.trim()} className="sm:self-start">
            Add project
          </Button>
        </form>
        {error && (
          <p className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <Icon name="error" className="text-[15px]" />
            {error}
          </p>
        )}
      </Card>

      {projects.length === 0 ? (
        <EmptyState icon="folder_open" title="No projects yet" subtitle="Add one above to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
