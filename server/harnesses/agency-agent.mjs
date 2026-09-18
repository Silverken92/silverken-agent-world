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
const GOVERNED_ACTIONS = new Set([
  'REQUEST_HUMAN_REVIEW',
  'REQUEST_RISK_REVIEW',
  'REQUEST_VERIFICATION_RETRY',
])
const GOVERNED_REQUEST_STATUSES = new Set(['RECORDED', 'ACKNOWLEDGED', 'RESOLVED'])

function baseUrl() {
  return (process.env.AGENCY_AGENT_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
}

function token() {
  return (process.env.AGENCY_AGENT_TOKEN || '').trim()
}

async function requestJson(path, { auth = true, method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
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
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
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

function compactWorkspace(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return {
    bound: value.bound === true,
    repository: safeText(value.repository, 255),
    branch: safeText(value.branch, 255),
    head: safeText(value.head, 64),
    clean: typeof value.clean === 'boolean' ? value.clean : null,
    valid: value.valid === true,
  }
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

function operatorUrl(projectId, { taskId = '', view = 'tasks' } = {}) {
  try {
    const url = new URL('/ui', `${baseUrl()}/`)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return ''
    const safeProjectId = safeText(projectId, 160)
    if (!safeProjectId) return ''
    url.searchParams.set('project', safeProjectId)
    if (taskId) url.searchParams.set('task', safeText(taskId, 160))
    url.searchParams.set('view', safeText(view, 32) || 'tasks')
    return url.toString()
  } catch {
    return ''
  }
}

function operatorTaskUrl(projectId, taskId) {
  return operatorUrl(projectId, { taskId, view: 'tasks' })
}

function operatorAgentsUrl(projectId) {
  return operatorUrl(projectId, { view: 'agents' })
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

function compactCapabilities(profile) {
  const value = profile?.capabilities
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { read: false, write: false, commands: false, policyValid: true, toolCount: 0 }
  }
  return {
    read: value.read === true,
    write: value.write === true,
    commands: value.commands === true,
    policyValid: value.policy_valid !== false,
    toolCount: safeCount(value.tool_count),
  }
}

function compactExecution(record) {
  const run = record?.execution
  if (!run || typeof run !== 'object' || Array.isArray(run)) return null
  const status = safeText(run.status, 24).toUpperCase()
  if (!['RUNNING', 'SUCCEEDED', 'FAILED'].includes(status)) return null
  return {
    runId: safeText(run.run_id, 160),
    status,
    agentId: safeText(run.agent_id, 160),
    agentName: safeText(run.agent_name, 128),
    model: safeText(run.model, 160),
    startedAt: safeText(run.started_at, 64),
    completedAt: safeText(run.completed_at, 64),
    summary: safeText(run.summary, 500),
    errorKind: safeText(run.error_kind, 80),
    steps: safeCount(run.steps),
    toolCalls: safeCount(run.tool_calls),
    inputTokens: safeCount(run.input_tokens),
    outputTokens: safeCount(run.output_tokens),
    artifacts: Array.isArray(run.artifacts)
      ? run.artifacts.slice(0, 20).map((item) => safeText(item, 240)).filter(Boolean)
      : [],
  }
}

function compactGovernedRequest(record) {
  const requests = Array.isArray(record?.governed_requests) ? record.governed_requests : []
  const item = requests[0]
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null
  const action = safeText(item.requested_action, 64)
  const status = safeText(item.status, 32).toUpperCase()
  if (!GOVERNED_ACTIONS.has(action) || !GOVERNED_REQUEST_STATUSES.has(status)) return null
  return {
    requestId: safeText(item.request_id, 160),
    action,
    status,
    createdAt: safeText(item.created_at, 64),
  }
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
    execution: compactExecution(record),
    governedRequest: compactGovernedRequest(record),
  }
}

function encodeOperationalModel(ops, navigation = {}) {
  if (!ops) return ''
  const extension = {}
  if (navigation.operatorUrl) extension.o = navigation.operatorUrl
  if (navigation.threadId) extension.i = safeText(navigation.threadId, 320)
  if (navigation.status) extension.s = safeText(navigation.status, 48)
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
    q: ops.governedRequest
      ? [ops.governedRequest.status, ops.governedRequest.action]
      : undefined,
    u: ops.execution
      ? [
          ops.execution.status,
          ops.execution.runId,
          ops.execution.steps,
          ops.execution.toolCalls,
          ops.execution.errorKind,
          ops.execution.model,
        ]
      : undefined,
    p: navigation.agentName
      ? [safeText(navigation.agentName, 128), safeText(navigation.agentId, 160)]
      : undefined,
    w: navigation.workspace?.bound
      ? [
          safeText(navigation.workspace.repository, 255),
          safeText(navigation.workspace.branch, 255),
          navigation.workspace.clean,
          navigation.workspace.valid === true,
          safeText(navigation.workspace.head, 64),
        ]
      : undefined,
    k: navigation.capabilities
      ? [
          navigation.capabilities.read === true,
          navigation.capabilities.write === true,
          navigation.capabilities.commands === true,
          navigation.capabilities.policyValid !== false,
          safeCount(navigation.capabilities.toolCount),
        ]
      : undefined,
    t: ops.activity.tokenUsage,
    c: ops.activity.costByCurrency,
    x: Object.keys(extension).length ? extension : undefined,
  }
  return `${OPS_MODEL_PREFIX}${encodeURIComponent(JSON.stringify(display))}`
}

function toThread(project, record, agentProfile = null, workspace = null) {
  const task = record?.task && typeof record.task === 'object' ? record.task : record
  const ops = compactOperational(record, task)
  const objective = task.objective || 'Untitled Agency Agent task'
  const createdAt = epochMs(task.created_at)
  const taskUpdatedAt = epochMs(task.updated_at) || createdAt
  const activityAt = epochMs(ops?.activity.latestEventAt)
  const executionAt = Math.max(
    epochMs(ops?.execution?.startedAt),
    epochMs(ops?.execution?.completedAt)
  )
  const updatedAt = Math.max(taskUpdatedAt, activityAt, executionAt)
  const status = task.status || 'BACKLOG'
  const executionRunning = ops?.execution?.status === 'RUNNING'
  const executionFailed = ops?.execution?.status === 'FAILED'
  const serializedSize = textBytes(JSON.stringify(record))
  const operatorTask = operatorTaskUrl(project.project_id, task.id)
  const threadId = `agency-agent:${project.project_id}:${task.id}`
  const agentId = safeText(agentProfile?.agent_id, 160)
  const agentName = safeText(agentProfile?.name, 128)
  const workspaceInfo = compactWorkspace(workspace)

  return {
    id: threadId,
    title: objective.length > 120 ? `${objective.slice(0, 117)}...` : objective,
    preview: objective.length > 280 ? `${objective.slice(0, 277)}...` : objective,
    project: project.name || project.slug || 'Agency Agent',
    projectPath: '',
    worktree: worktreeFor(task),
    cwd: '',
    gitBranch: branchFor(task),
    model: encodeOperationalModel(ops, {
      operatorUrl: operatorTask,
      threadId,
      status,
      agentId,
      agentName,
      workspace: workspaceInfo,
    }) || task.execution_model || 'AGENCY_AGENT',
    effort: (task.risk || '').toLowerCase(),
    createdAt,
    lastActivityAt: updatedAt,
    lastFocusedAt: 0,
    running: !executionFailed && (ACTIVE_STATUSES.has(status) || executionRunning),
    unread: UNREAD_STATUSES.has(status),
    hasError: ERROR_STATUSES.has(status) || executionFailed,
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
      ...(agentId ? { agentId, agentName: agentName || task.owner_agent || '' } : {}),
      ...(workspaceInfo?.bound ? { workspace: workspaceInfo } : {}),
    },
  }
}

function toAgentThread(project, profile, taskRecords = [], workspace = null) {
  const agentName = safeText(profile?.name, 128) || 'Agency Agent'
  const agentId = safeText(profile?.agent_id, 160)
  const owned = taskRecords.filter((record) => {
    const task = record?.task && typeof record.task === 'object' ? record.task : record
    return task?.owner_agent === agentName && task?.status !== 'DONE'
  })
  const ownedTasks = owned.map((record) => record?.task || record)
  const running = owned.some((record) => {
    const task = record?.task || record
    const execution = compactOperational(record, task)?.execution
    if (execution?.status === 'FAILED') return false
    return ACTIVE_STATUSES.has(task.status || '') || execution?.status === 'RUNNING'
  })
  const unread = ownedTasks.some((task) => UNREAD_STATUSES.has(task.status || ''))
  const hasError = owned.some((record) => {
    const task = record?.task || record
    const execution = compactOperational(record, task)?.execution
    return ERROR_STATUSES.has(task.status || '') || execution?.status === 'FAILED'
  })
  const createdAt = epochMs(profile?.created_at)
  const profileUpdated = epochMs(profile?.updated_at) || createdAt
  const taskActivity = owned.reduce((latest, record) => {
    const task = record?.task || record
    const ops = compactOperational(record, task)
    return Math.max(
      latest,
      epochMs(task?.updated_at),
      epochMs(ops?.activity.latestEventAt),
      epochMs(ops?.execution?.startedAt),
      epochMs(ops?.execution?.completedAt)
    )
  }, 0)
  const lastActivityAt = Math.max(profileUpdated, taskActivity)
  const threadId = `agency-agent-profile:${project.project_id}:${agentId}`
  const role = safeText(profile?.role, 80) || 'AGENT'
  const description = safeText(profile?.description, 280)
  const ops = {
    executionModel: `AGENT · ${role}`,
    ownerAgent: agentName,
    risk: '',
    verification: { total: 0, pass: 0, fail: 0, unknown: 0, notRun: 0 },
    activity: {
      eventCount: 0,
      latestEventType: running ? 'ASSIGNED_WORK_ACTIVE' : '',
      latestEventAt: '',
      latestAgentId: '',
      tokenUsage: 0,
      costByCurrency: {},
    },
    evaluator: null,
    silverguard: null,
    release: null,
    execution: null,
    governedRequest: null,
  }
  const registryUrl = operatorAgentsUrl(project.project_id)
  const workspaceInfo = compactWorkspace(workspace)
  const capabilities = compactCapabilities(profile)

  return {
    id: threadId,
    title: agentName,
    preview: description || `Registered ${role} agent`,
    project: project.name || project.slug || 'Agency Agent',
    projectPath: '',
    worktree: '',
    cwd: '',
    gitBranch: '',
    model: encodeOperationalModel(ops, {
      operatorUrl: registryUrl,
      threadId,
      status: profile?.enabled === false ? 'DISABLED' : 'REGISTERED',
      workspace: workspaceInfo,
      capabilities,
    }),
    effort: '',
    createdAt,
    lastActivityAt,
    lastFocusedAt: 0,
    running,
    unread,
    hasError,
    starred: false,
    routine: false,
    archived: profile?.enabled === false,
    sizeBytes: Math.max(textBytes(JSON.stringify(profile || {})), 1),
    source: 'agency-agent',
    canOpen: false,
    operational: ops,
    ref: {
      projectId: project.project_id,
      agentId,
      agentName,
      role,
      profile: true,
      capabilities,
      ...(workspaceInfo?.bound ? { workspace: workspaceInfo } : {}),
    },
  }
}

async function requestGovernedAction(projectId, taskId, action, rationale) {
  const safeProject = safeText(projectId, 160)
  const safeTask = safeText(taskId, 160)
  const safeRationale = safeText(rationale, 1000).trim()
  if (!safeProject || !safeTask) throw new Error('Agency Agent task reference is missing')
  if (!GOVERNED_ACTIONS.has(action)) throw new Error('Governed action is not allowed')
  if (safeRationale.length < 3) throw new Error('Governed action rationale is required')
  return requestJson(
    `/api/v1/projects/${encodeURIComponent(safeProject)}/tasks/${encodeURIComponent(safeTask)}/agent-world-actions`,
    {
      method: 'POST',
      body: { action, rationale: safeRationale },
    }
  )
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
    const agents = Array.isArray(snapshot?.agents) ? snapshot.agents : []
    const workspace = compactWorkspace(snapshot?.workspace)
    const profilesByName = new Map(
      agents
        .filter((profile) => profile?.name && profile?.agent_id)
        .map((profile) => [profile.name, profile])
    )
    return [
      ...agents.map((profile) => toAgentThread(snapshotProject, profile, tasks, workspace)),
      ...tasks.map((record) => {
        const task = record?.task && typeof record.task === 'object' ? record.task : record
        return toThread(
          snapshotProject,
          record,
          profilesByName.get(task?.owner_agent) || null,
          workspace
        )
      }),
    ]
  } catch (error) {
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
    error: 'Use the governed navigation link to open this task in the Agency Agent Operator UI.',
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

export {
  GOVERNED_ACTIONS,
  OPS_MODEL_PREFIX,
  compactCapabilities,
  compactExecution,
  compactOperational,
  compactWorkspace,
  encodeOperationalModel,
  operatorAgentsUrl,
  operatorTaskUrl,
  requestGovernedAction,
  toAgentThread,
  toThread,
}
