const DEFAULT_BASE_URL = 'http://127.0.0.1:8787'
const REQUEST_TIMEOUT_MS = 1500
const OPS_MODEL_PREFIX = 'SKOPS:'

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

async function requestJson(path, { auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (auth) {
    const authToken = token()
    if (!authToken) {
      const error = new Error('AGENCY_AGENT_TOKEN is not configured')
      error.code = 'TOKEN_MISSING'
      throw error
    }
    headers.Authorization = `Bearer ${authToken}`
  }

  const response = await fetch(`${baseUrl()}${path}`, {
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    const error = new Error(`Agency Agent API ${response.status} for ${path}`)
    error.status = response.status
    throw error
  }

  return response.json()
}

async function healthAvailable() {
  try {
    const health = await requestJson('/health', { auth: false })
    return health?.status === 'ok' && health?.service === 'agency-agent-operator'
  } catch {
    return false
  }
}

function epochMs(value) {
  const parsed = Date.parse(value || '')
  return Number.isFinite(parsed) ? parsed : 0
}

function textBytes(value) {
  return new TextEncoder().encode(value || '').length
}

function safeText(value, max = 96) {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

function safeCount(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0
}

function safeCosts(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out = {}
  for (const [currency, amount] of Object.entries(value).slice(0, 4)) {
    const number = Number(amount)
    if (!Number.isFinite(number) || number < 0) continue
    const code = safeText(currency, 12).toUpperCase()
    if (code) out[code] = number
  }
  return out
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

function compactOperational(record, task) {
  if (!record || typeof record !== 'object' || !record.task) return null

  const verification = record.verification || {}
  const activity = record.activity || {}
  const evaluator = record.evaluator || null
  const silverguard = record.silverguard || null
  const release = record.release || null

  return {
    executionModel: safeText(task.execution_model, 48),
    ownerAgent: safeText(task.owner_agent, 96),
    risk: safeText(task.risk, 24),
    verification: {
      total: safeCount(verification.total),
      pass: safeCount(verification.pass),
      fail: safeCount(verification.fail),
      unknown: safeCount(verification.unknown),
      notRun: safeCount(verification.not_run),
    },
    activity: {
      eventCount: safeCount(activity.event_count),
      latestEventType: safeText(activity.latest_event_type, 64),
      latestEventAt: safeText(activity.latest_event_at, 64),
      latestAgentId: safeText(activity.latest_agent_id, 96),
      tokenUsage: safeCount(activity.token_usage),
      costByCurrency: safeCosts(activity.cost_by_currency),
    },
    evaluator: evaluator
      ? {
          verdict: safeText(evaluator.verdict, 24),
          evaluatorId: safeText(evaluator.evaluator_id, 96),
          securityRequired: evaluator.security_required === true,
        }
      : null,
    silverguard: silverguard
      ? {
          disposition: safeText(silverguard.disposition, 24),
          reviewerId: safeText(silverguard.reviewer_id, 96),
          blockingFindingCount: safeCount(silverguard.blocking_finding_count),
          residualFindingCount: safeCount(silverguard.residual_finding_count),
          approvalUsed: silverguard.approval_used === true,
        }
      : null,
    release: release
      ? {
          disposition: safeText(release.disposition, 24),
          releaseReady: release.release_ready === true,
        }
      : null,
  }
}

function encodeOperationalModel(ops) {
  if (!ops) return ''
  const display = {
    m: ops.executionModel,
    o: ops.ownerAgent,
    a: ops.activity.latestAgentId,
    v: [
      ops.verification.pass,
      ops.verification.total,
      ops.verification.fail,
      ops.verification.unknown,
      ops.verification.notRun,
    ],
    e: ops.evaluator?.verdict || '',
    g: ops.silverguard?.disposition || '',
    b: ops.silverguard?.blockingFindingCount || 0,
    r: ops.release ? ops.release.releaseReady : null,
    d: ops.release?.disposition || '',
    t: ops.activity.tokenUsage,
    c: ops.activity.costByCurrency,
  }
  return `${OPS_MODEL_PREFIX}${encodeURIComponent(JSON.stringify(display))}`
}

function toThread(project, record) {
  const task = record?.task && typeof record.task === 'object' ? record.task : record
  const ops = compactOperational(record, task)
  const objective = task.objective || 'Untitled Agency Agent task'
  const createdAt = epochMs(task.created_at)
  const taskUpdatedAt = epochMs(task.updated_at) || createdAt
  const activityAt = epochMs(ops?.activity.latestEventAt)
  const updatedAt = Math.max(taskUpdatedAt, activityAt)
  const status = task.status || 'BACKLOG'
  const serializedSize = textBytes(JSON.stringify(record))

  return {
    id: `agency-agent:${project.project_id}:${task.id}`,
    title: objective.length > 120 ? `${objective.slice(0, 117)}...` : objective,
    preview: objective.length > 280 ? `${objective.slice(0, 277)}...` : objective,
    project: project.name || project.slug || 'Agency Agent',
    projectPath: '',
    worktree: worktreeFor(task),
    cwd: '',
    gitBranch: branchFor(task),
    model: encodeOperationalModel(ops) || task.execution_model || 'AGENCY_AGENT',
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
    operational: ops,
    ref: {
      projectId: project.project_id,
      taskId: task.id,
      status,
      ownerAgent: task.owner_agent || '',
    },
  }
}

async function detect() {
  return healthAvailable()
}

async function diagnostic() {
  if (!(await healthAvailable())) return ''
  if (!token()) {
    return 'Agency Agent is running, but AGENCY_AGENT_TOKEN is not configured.'
  }

  try {
    await requestJson('/api/v1/projects')
    return ''
  } catch (error) {
    if (error.status === 401) {
      return 'Agency Agent rejected AGENCY_AGENT_TOKEN. Create a new Operator API token.'
    }
    if (error.status === 403) {
      return 'Agency Agent accepted the token, but it does not have permission to read projects.'
    }
    return `Agency Agent API is reachable but project discovery failed: ${error.message}`
  }
}

async function scanProject(project) {
  const projectId = encodeURIComponent(project.project_id)
  try {
    const snapshot = await requestJson(`/api/v1/projects/${projectId}/agent-world`)
    const snapshotProject = snapshot?.project || project
    const tasks = Array.isArray(snapshot?.tasks) ? snapshot.tasks : []
    return tasks.map((record) => toThread(snapshotProject, record))
  } catch (error) {
    // AW5 snapshot landed after the original bridge. Keep older local Agency Agent checkouts
    // usable during upgrades, but only fall back for an endpoint that genuinely does not exist.
    if (error.status !== 404) throw error
    const tasks = await requestJson(`/api/v1/projects/${projectId}/tasks`)
    return Array.isArray(tasks) ? tasks.map((task) => toThread(project, task)) : []
  }
}

async function scanThreads() {
  if (!token()) return []

  let projects
  try {
    projects = await requestJson('/api/v1/projects')
  } catch (error) {
    if (error.status === 401 || error.status === 403) return []
    throw error
  }

  const threads = []

  for (const project of projects) {
    try {
      threads.push(...(await scanProject(project)))
    } catch (error) {
      console.warn(`[agency-agent] skipping project ${project.project_id}: ${error.message}`)
    }
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
  diagnostic,
  scanThreads,
  openThread,
  newSession,
}

export { OPS_MODEL_PREFIX, compactOperational, encodeOperationalModel, toThread }
