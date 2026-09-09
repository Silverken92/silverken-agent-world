const DEFAULT_BASE_URL = 'http://127.0.0.1:8787'

const ACTIVE_STATUSES = new Set([
  'IN_PROGRESS',
  'IMPLEMENTED',
  'QA_REVIEW',
  'SECURITY_REVIEW',
  'FINAL_REVIEW',
])

const UNREAD_STATUSES = new Set([
  'BLOCKED',
  'NEEDS_USER_DECISION',
  'RISK_ACCEPTANCE_REQUIRED',
])

const ERROR_STATUSES = new Set(['FAILED_VERIFICATION'])

function baseUrl() {
  return (process.env.AGENCY_AGENT_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
}

function token() {
  return (process.env.AGENCY_AGENT_TOKEN || '').trim()
}

async function apiGet(path) {
  const authToken = token()
  if (!authToken) throw new Error('AGENCY_AGENT_TOKEN is not configured')

  const response = await fetch(`${baseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Agency Agent API ${response.status} for ${path}`)
  }

  return response.json()
}

function epochMs(value) {
  const parsed = Date.parse(value || '')
  return Number.isFinite(parsed) ? parsed : 0
}

function textBytes(value) {
  return new TextEncoder().encode(value || '').length
}

function branchFor(task) {
  const workspace = task.workspace_isolation
  if (!workspace) return ''
  return workspace.integration_target || ''
}

function worktreeFor(task) {
  const workspace = task.workspace_isolation
  if (!workspace || workspace.mode !== 'WORKTREE') return ''
  return workspace.workspace_id || ''
}

function toThread(project, task) {
  const objective = task.objective || 'Untitled Agency Agent task'
  const createdAt = epochMs(task.created_at)
  const updatedAt = epochMs(task.updated_at) || createdAt
  const status = task.status || 'BACKLOG'
  const serializedSize = textBytes(JSON.stringify(task))

  return {
    id: `agency-agent:${project.project_id}:${task.id}`,
    title: objective.length > 120 ? `${objective.slice(0, 117)}...` : objective,
    preview: objective.length > 280 ? `${objective.slice(0, 277)}...` : objective,
    project: project.name || project.slug || 'Agency Agent',
    projectPath: '',
    worktree: worktreeFor(task),
    cwd: '',
    gitBranch: branchFor(task),
    model: task.execution_model || 'AGENCY_AGENT',
    effort: (task.risk || '').toLowerCase(),
    createdAt,
    lastActivityAt: updatedAt,
    lastFocusedAt: 0,
    running: ACTIVE_STATUSES.has(status),
    unread: UNREAD_STATUSES.has(status),
    hasError: ERROR_STATUSES.has(status),
    starred: false,
    routine: false,
    archived: status === 'DONE',
    sizeBytes: Math.max(serializedSize, 1),
    source: 'agency-agent',
    canOpen: false,
    ref: {
      projectId: project.project_id,
      taskId: task.id,
      status,
      ownerAgent: task.owner_agent || '',
    },
  }
}

async function detect() {
  if (!token()) return false
  try {
    await apiGet('/api/v1/projects')
    return true
  } catch {
    return false
  }
}

async function scanThreads() {
  const projects = await apiGet('/api/v1/projects')
  const threads = []

  for (const project of projects) {
    let tasks
    try {
      tasks = await apiGet(`/api/v1/projects/${encodeURIComponent(project.project_id)}/tasks`)
    } catch (error) {
      console.warn(`[agency-agent] skipping project ${project.project_id}: ${error.message}`)
      continue
    }

    for (const task of tasks) threads.push(toThread(project, task))
  }

  return threads
}

function openThread() {
  return {
    ok: false,
    error: 'Opening Agency Agent tasks from Agent World is not enabled in the read-only bridge.',
  }
}

function newSession() {
  return {
    ok: false,
    error: 'Create Agency Agent work from the Operator Product or CLI.',
  }
}

export default {
  id: 'agency-agent',
  name: 'Agency Agent',
  detect,
  scanThreads,
  openThread,
  newSession,
}

export { toThread }
