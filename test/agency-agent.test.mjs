import test from 'node:test'
import assert from 'node:assert/strict'

import agencyAgent, {
  compactAssignment,
  compactCapabilities,
  compactExecution,
  compactOrchestration,
  compactWorkspace,
  toAgentThread,
  toThread,
} from '../server/harnesses/agency-agent.mjs'
import { decodeOperationalModel, operationalBadges } from '../src/ui/operational.js'

const project = {
  project_id: 'proj-1',
  name: 'Agency Agent',
  slug: 'agency-agent',
}

function task(status, overrides = {}) {
  return {
    id: `task-${status.toLowerCase()}`,
    objective: `Exercise ${status}`,
    owner_agent: 'Orchestrator',
    status,
    risk: 'MEDIUM',
    execution_model: 'ORCHESTRATED',
    workspace_isolation: {
      mode: 'WORKTREE',
      workspace_id: 'aw5-worktree',
      integration_target: 'aw5/operational-enrichment',
    },
    created_at: '2026-09-09T20:00:00Z',
    updated_at: '2026-09-09T20:05:00Z',
    ...overrides,
  }
}

function snapshotRecord(status = 'FINAL_REVIEW') {
  return {
    task: task(status),
    verification: { total: 4, pass: 3, fail: 0, unknown: 1, not_run: 0 },
    activity: {
      event_count: 12,
      latest_event_type: 'AGENT_COMPLETED',
      latest_event_at: '2026-09-09T20:06:00Z',
      latest_agent_id: 'SilverGuard',
      token_usage: 12345,
      cost_by_currency: { USD: 0.0425 },
    },
    evaluator: {
      evaluation_id: 'eval-1',
      evaluator_id: 'independent-evaluator',
      verdict: 'PASS',
      security_required: true,
      created_at: '2026-09-09T20:05:10Z',
    },
    silverguard: {
      review_id: 'security-1',
      reviewer_id: 'SilverGuard',
      disposition: 'PASS',
      blocking_finding_count: 0,
      residual_finding_count: 1,
      approval_used: false,
      created_at: '2026-09-09T20:05:30Z',
    },
    release: {
      decision_id: 'release-1',
      disposition: 'READY',
      release_ready: true,
      created_at: '2026-09-09T20:05:50Z',
    },
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function preserveProcessState(t) {
  const previousToken = process.env.AGENCY_AGENT_TOKEN
  const previousUrl = process.env.AGENCY_AGENT_URL
  const previousFetch = globalThis.fetch
  t.after(() => {
    if (previousToken === undefined) delete process.env.AGENCY_AGENT_TOKEN
    else process.env.AGENCY_AGENT_TOKEN = previousToken
    if (previousUrl === undefined) delete process.env.AGENCY_AGENT_URL
    else process.env.AGENCY_AGENT_URL = previousUrl
    globalThis.fetch = previousFetch
  })
}

test('Agency Agent maps active governed states to working astronauts', () => {
  for (const status of ['IN_PROGRESS', 'IMPLEMENTED', 'QA_REVIEW', 'SECURITY_REVIEW', 'FINAL_REVIEW']) {
    const thread = toThread(project, task(status))
    assert.equal(thread.running, true, status)
    assert.equal(thread.unread, false, status)
    assert.equal(thread.hasError, false, status)
  }
})

test('Agency Agent maps human-decision states to attention badges', () => {
  for (const status of ['BLOCKED', 'NEEDS_USER_DECISION', 'RISK_ACCEPTANCE_REQUIRED']) {
    const thread = toThread(project, task(status))
    assert.equal(thread.running, false, status)
    assert.equal(thread.unread, true, status)
    assert.equal(thread.hasError, false, status)
  }
})

test('Agency Agent maps verification failure and completion safely', () => {
  const failed = toThread(project, task('FAILED_VERIFICATION'))
  assert.equal(failed.hasError, true)
  assert.equal(failed.archived, false)

  const done = toThread(project, task('DONE'))
  assert.equal(done.archived, true)
  assert.equal(done.running, false)
})

test('Agency Agent thread ids are prefixed and refs contain no credentials', () => {
  const thread = toThread(project, task('IN_PROGRESS'))
  assert.equal(thread.id, 'agency-agent:proj-1:task-in_progress')
  assert.equal(thread.source, 'agency-agent')
  assert.equal(thread.gitBranch, 'aw5/operational-enrichment')
  assert.equal(thread.worktree, 'aw5-worktree')
  assert.deepEqual(Object.keys(thread.ref).sort(), ['ownerAgent', 'projectId', 'status', 'taskId'])
  assert.equal(JSON.stringify(thread.ref).includes('token'), false)
  assert.equal(thread.operational, null)
})

test('Agency Agent operational snapshot stays compact and does not fake PR merge evidence', () => {
  const thread = toThread(project, snapshotRecord())
  assert.equal(thread.operational.ownerAgent, 'Orchestrator')
  assert.equal(thread.operational.activity.latestAgentId, 'SilverGuard')
  assert.equal(thread.operational.activity.tokenUsage, 12345)
  assert.deepEqual(thread.operational.activity.costByCurrency, { USD: 0.0425 })
  assert.deepEqual(thread.operational.verification, {
    total: 4,
    pass: 3,
    fail: 0,
    unknown: 1,
    notRun: 0,
  })
  assert.equal(thread.operational.evaluator.verdict, 'PASS')
  assert.equal(thread.operational.silverguard.disposition, 'PASS')
  assert.equal(thread.operational.release.releaseReady, true)
  assert.equal(thread.prState, undefined)
  assert.match(thread.model, /^SKOPS:/)
  assert.equal(thread.lastActivityAt, Date.parse('2026-09-09T20:06:00Z'))
})



test('AW13 execution projection drives live state without leaking execution authority', () => {
  const record = snapshotRecord('BACKLOG')
  record.execution = {
    run_id: 'run-aw13',
    status: 'RUNNING',
    agent_id: 'agt-platform',
    agent_name: 'Platform-Engineer',
    model: 'gpt-test',
    started_at: '2026-09-18T12:00:00Z',
    completed_at: null,
    summary: '',
    error_kind: null,
    steps: 1,
    tool_calls: 2,
    input_tokens: 10,
    output_tokens: 5,
    artifacts: [],
    idempotency_key: 'secret-key',
    started_by: 'usr-private',
    repository_path: 'F:\\SilverKen\\projects\\silverken-platform',
  }

  assert.deepEqual(compactExecution(record), {
    runId: 'run-aw13',
    status: 'RUNNING',
    agentId: 'agt-platform',
    agentName: 'Platform-Engineer',
    model: 'gpt-test',
    startedAt: '2026-09-18T12:00:00Z',
    completedAt: '',
    summary: '',
    errorKind: '',
    steps: 1,
    toolCalls: 2,
    inputTokens: 10,
    outputTokens: 5,
    artifacts: [],
  })

  const profile = {
    agent_id: 'agt-platform',
    name: 'Platform-Engineer',
    role: 'PLATFORM_ENGINEER',
    description: 'Governed platform engineer',
    enabled: true,
    created_at: '2026-09-18T11:00:00Z',
    updated_at: '2026-09-18T11:00:00Z',
  }
  record.task.owner_agent = 'Platform-Engineer'
  const taskThread = toThread(project, record, profile)
  const agentThread = toAgentThread(project, profile, [record])

  assert.equal(taskThread.running, true)
  assert.equal(agentThread.running, true)
  assert.equal(taskThread.hasError, false)
  assert.equal(JSON.stringify(taskThread).includes('secret-key'), false)
  assert.equal(JSON.stringify(taskThread).includes('usr-private'), false)
  assert.equal(JSON.stringify(taskThread).includes('F:\\\\SilverKen'), false)

  const decoded = decodeOperationalModel(taskThread.model)
  assert.deepEqual(decoded.u, ['RUNNING', 'run-aw13', 1, 2, '', 'gpt-test'])
  assert.ok(
    operationalBadges(decoded, 'fr').some(
      (badge) => badge.label === 'Run · EN COURS' && badge.tone === 'pending'
    )
  )
})

test('AW13 failed execution stops the active animation and surfaces an error', () => {
  const record = snapshotRecord('IN_PROGRESS')
  record.execution = {
    run_id: 'run-failed',
    status: 'FAILED',
    agent_id: 'agt-platform',
    agent_name: 'Platform-Engineer',
    model: 'gpt-test',
    started_at: '2026-09-18T12:00:00Z',
    completed_at: '2026-09-18T12:01:00Z',
    error_kind: 'PROVIDER',
  }
  const profile = {
    agent_id: 'agt-platform',
    name: 'Platform-Engineer',
    role: 'PLATFORM_ENGINEER',
    enabled: true,
    created_at: '2026-09-18T11:00:00Z',
    updated_at: '2026-09-18T11:00:00Z',
  }
  record.task.owner_agent = 'Platform-Engineer'

  const taskThread = toThread(project, record, profile)
  const agentThread = toAgentThread(project, profile, [record])
  assert.equal(taskThread.running, false)
  assert.equal(taskThread.hasError, true)
  assert.equal(agentThread.running, false)
  assert.equal(agentThread.hasError, true)
  assert.ok(
    operationalBadges(decodeOperationalModel(taskThread.model), 'en').some(
      (badge) => badge.label === 'Run · FAILED' && badge.tone === 'danger'
    )
  )
})


test('AW15C projects live SilverFlow mission and specialist state without authority', () => {
  const mission = {
    orchestration_id: 'orch-live-team',
    parent_task_id: 'task-backlog',
    status: 'RUNNING',
    team_size: 3,
    max_parallel: 3,
    started_at: '2026-09-18T18:00:00Z',
    completed_at: null,
    integrated_artifact_count: 0,
    handoff_count: 1,
    blocked: false,
    integration_target: 'F:\\SilverKen\\projects\\silverken-platform',
    assignments: [
      {
        assignment_id: 'a01-architect',
        agent_id: 'agt-architect',
        agent_name: 'SilverKen-Architect',
        role: 'ARCHITECT',
        status: 'COMPLETED',
        dependencies: [],
        child_task_id: 'child-architect',
        child_status: 'ANALYZED',
        artifact_count: 0,
        allowed_write_globs: [],
      },
      {
        assignment_id: 'a02-platform',
        agent_id: 'agt-platform',
        agent_name: 'SilverKen-Platform-Engineer',
        role: 'PLATFORM_ENGINEER',
        status: 'RUNNING',
        dependencies: ['a01-architect'],
        child_task_id: 'child-platform',
        child_status: 'IN_PROGRESS',
        artifact_count: 0,
        allowed_write_globs: ['docs/**'],
        allowed_command_prefixes: [['pnpm', 'test']],
      },
      {
        assignment_id: 'a03-qa',
        agent_id: 'agt-qa',
        agent_name: 'SilverKen-QA',
        role: 'QA',
        status: 'WAITING',
        dependencies: ['a02-platform'],
        child_task_id: '',
        child_status: '',
        artifact_count: 0,
      },
    ],
  }

  assert.deepEqual(compactAssignment(mission.assignments[1]), {
    assignmentId: 'a02-platform',
    agentId: 'agt-platform',
    agentName: 'SilverKen-Platform-Engineer',
    role: 'PLATFORM_ENGINEER',
    status: 'RUNNING',
    dependencies: ['a01-architect'],
    childTaskId: 'child-platform',
    childStatus: 'IN_PROGRESS',
    artifactCount: 0,
  })

  const compactMission = compactOrchestration(mission)
  assert.equal(compactMission.status, 'RUNNING')
  assert.equal(compactMission.assignments.length, 3)
  const serializedMission = JSON.stringify(compactMission)
  assert.equal(serializedMission.includes('F:\\\\SilverKen'), false)
  assert.equal(serializedMission.includes('docs/**'), false)
  assert.equal(serializedMission.includes('pnpm'), false)
  assert.equal(serializedMission.includes('integration_target'), false)
  assert.equal(serializedMission.includes('allowed_write_globs'), false)

  const parent = snapshotRecord('BACKLOG')
  parent.task.id = 'task-backlog'
  const platformProfile = {
    agent_id: 'agt-platform',
    name: 'SilverKen-Platform-Engineer',
    role: 'PLATFORM_ENGINEER',
    enabled: true,
    capabilities: {
      read: true,
      write: true,
      commands: false,
      policy_valid: true,
      tool_count: 5,
    },
    created_at: '2026-09-18T17:00:00Z',
    updated_at: '2026-09-18T17:00:00Z',
  }
  const architectProfile = {
    agent_id: 'agt-architect',
    name: 'SilverKen-Architect',
    role: 'ARCHITECT',
    enabled: true,
    capabilities: {
      read: true,
      write: false,
      commands: false,
      policy_valid: true,
      tool_count: 4,
    },
    created_at: '2026-09-18T17:00:00Z',
    updated_at: '2026-09-18T17:00:00Z',
  }
  const qaProfile = {
    agent_id: 'agt-qa',
    name: 'SilverKen-QA',
    role: 'QA',
    enabled: true,
    capabilities: {
      read: true,
      write: false,
      commands: false,
      policy_valid: true,
      tool_count: 4,
    },
    created_at: '2026-09-18T17:00:00Z',
    updated_at: '2026-09-18T17:00:00Z',
  }

  const missionThread = toThread(project, parent, platformProfile, null, mission)
  assert.equal(missionThread.running, true)
  assert.equal(missionThread.ref.orchestrationId, 'orch-live-team')
  assert.ok(
    operationalBadges(decodeOperationalModel(missionThread.model), 'fr').some(
      (badge) =>
        badge.label === 'Mission · EN COURS · 1/3'
        && badge.tone === 'pending'
    )
  )

  const platformThread = toAgentThread(
    project,
    platformProfile,
    [],
    null,
    [mission]
  )
  assert.equal(platformThread.running, true)
  assert.equal(platformThread.ref.assignmentStatus, 'RUNNING')
  assert.ok(
    operationalBadges(decodeOperationalModel(platformThread.model), 'fr').some(
      (badge) => badge.label === 'SilverFlow · EN COURS'
    )
  )

  const architectThread = toAgentThread(
    project,
    architectProfile,
    [],
    null,
    [mission]
  )
  assert.equal(architectThread.running, false)
  assert.equal(architectThread.ref.assignmentStatus, 'COMPLETED')
  assert.ok(
    operationalBadges(decodeOperationalModel(architectThread.model), 'en').some(
      (badge) => badge.label === 'SilverFlow · COMPLETED'
    )
  )

  const qaThread = toAgentThread(project, qaProfile, [], null, [mission])
  assert.equal(qaThread.running, false)
  assert.equal(qaThread.ref.assignmentStatus, 'WAITING')
  assert.ok(
    operationalBadges(decodeOperationalModel(qaThread.model), 'fr').some(
      (badge) => badge.label === 'SilverFlow · EN ATTENTE'
    )
  )

  const completedMission = {
    ...mission,
    status: 'COMPLETED',
    completed_at: '2026-09-18T18:05:00Z',
    integrated_artifact_count: 1,
    handoff_count: 4,
    assignments: mission.assignments.map((assignment) => ({
      ...assignment,
      status: 'COMPLETED',
      child_status: assignment.role === 'PLATFORM_ENGINEER' ? 'IMPLEMENTED' : 'ANALYZED',
      artifact_count: assignment.role === 'PLATFORM_ENGINEER' ? 1 : 0,
    })),
  }
  const implementedParent = snapshotRecord('IMPLEMENTED')
  implementedParent.task.id = 'task-backlog'
  const completedThread = toThread(project, implementedParent, platformProfile, null, completedMission)
  assert.equal(completedThread.running, false)
  assert.equal(completedThread.hasError, false)
  assert.ok(
    operationalBadges(decodeOperationalModel(completedThread.model), 'fr').some(
      (badge) => badge.label === 'Mission · TERMINÉE · 3/3'
    )
  )

  const olderCompleted = {
    ...completedMission,
    orchestration_id: 'orch-older',
    started_at: '2026-09-17T18:00:00Z',
    assignments: completedMission.assignments.map((assignment) => ({
      ...assignment,
      assignment_id: `old-${assignment.assignment_id}`,
    })),
  }
  const latestPlatform = toAgentThread(
    project,
    platformProfile,
    [],
    null,
    [completedMission, olderCompleted]
  )
  assert.equal(latestPlatform.ref.orchestrationId, 'orch-live-team')
  assert.equal(latestPlatform.ref.assignmentStatus, 'COMPLETED')
})


test('AW14B capability projection is descriptive and strips raw authority', () => {
  const profile = {
    agent_id: 'agt-platform',
    name: 'Platform-Engineer',
    role: 'PLATFORM_ENGINEER',
    description: 'Governed platform engineer',
    enabled: true,
    capabilities: {
      read: true,
      write: true,
      commands: false,
      policy_valid: true,
      tool_count: 5,
    },
    tools_allowed: ['list_files', 'read_file', 'write_file', 'run_command'],
    allowed_commands: ['pnpm test'],
    allowed_changes: ['docs/**'],
    repository_path: 'F:\\SilverKen\\projects\\silverken-platform',
    created_at: '2026-09-18T11:00:00Z',
    updated_at: '2026-09-18T11:00:00Z',
  }

  assert.deepEqual(compactCapabilities(profile), {
    read: true,
    write: true,
    commands: false,
    policyValid: true,
    toolCount: 5,
  })

  const thread = toAgentThread(project, profile, [])
  assert.deepEqual(thread.ref.capabilities, {
    read: true,
    write: true,
    commands: false,
    policyValid: true,
    toolCount: 5,
  })
  const serialized = JSON.stringify(thread)
  assert.equal(serialized.includes('pnpm test'), false)
  assert.equal(serialized.includes('docs/**'), false)
  assert.equal(serialized.includes('F:\\\\SilverKen'), false)
  assert.equal(serialized.includes('tools_allowed'), false)
  assert.equal(serialized.includes('allowed_commands'), false)
  assert.equal(serialized.includes('allowed_changes'), false)

  const decoded = decodeOperationalModel(thread.model)
  assert.deepEqual(decoded.k, [true, true, false, true, 5])
  assert.ok(
    operationalBadges(decoded, 'fr').some(
      (badge) => badge.label === 'Capacités · L✓ É✓ Cmd—' && badge.tone === 'agent'
    )
  )
  assert.ok(
    operationalBadges(decoded, 'en').some(
      (badge) => badge.label === 'Capabilities · R✓ W✓ Cmd—' && badge.tone === 'agent'
    )
  )
})

test('AW12 workspace projection stays compact and excludes local paths', () => {
  const workspace = {
    bound: true,
    repository: 'silverken-platform',
    branch: 'main',
    head: '1234567890abcdef1234567890abcdef12345678',
    clean: true,
    valid: true,
    repository_path: 'F:\\SilverKen\\projects\\silverken-platform',
  }
  assert.deepEqual(compactWorkspace(workspace), {
    bound: true,
    repository: 'silverken-platform',
    branch: 'main',
    head: '1234567890abcdef1234567890abcdef12345678',
    clean: true,
    valid: true,
  })

  const thread = toThread(project, snapshotRecord(), null, workspace)
  assert.equal(thread.ref.workspace.repository, 'silverken-platform')
  assert.equal(JSON.stringify(thread).includes('F:\\\\SilverKen'), false)

  const decoded = decodeOperationalModel(thread.model)
  assert.deepEqual(decoded.w, [
    'silverken-platform',
    'main',
    true,
    true,
    '1234567890abcdef1234567890abcdef12345678',
  ])
  assert.ok(
    operationalBadges(decoded, 'fr').some(
      (badge) => badge.label === 'Workspace · silverken-platform' && badge.tone === 'success'
    )
  )
})

test('Agency Agent bridge is read-only', () => {
  assert.equal(agencyAgent.openThread({}).ok, false)
  assert.equal(agencyAgent.newSession('/tmp').ok, false)
  assert.equal(agencyAgent.setArchived, undefined)
})

test('Agency Agent is detected from public health even when the token is missing', async (t) => {
  preserveProcessState(t)
  delete process.env.AGENCY_AGENT_TOKEN
  globalThis.fetch = async (url) => {
    assert.equal(String(url), 'http://127.0.0.1:8787/health')
    return jsonResponse({ status: 'ok', service: 'agency-agent-operator' })
  }

  assert.equal(await agencyAgent.detect(), true)
  assert.match(await agencyAgent.diagnostic(), /TOKEN is not configured/)
  assert.deepEqual(await agencyAgent.scanThreads(), [])
})

test('Agency Agent reports an invalid token without throwing the colony scan', async (t) => {
  preserveProcessState(t)
  process.env.AGENCY_AGENT_TOKEN = 'aa_invalid'
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/health')) {
      return jsonResponse({ status: 'ok', service: 'agency-agent-operator' })
    }
    return jsonResponse({ detail: 'authentication required' }, 401)
  }

  assert.equal(await agencyAgent.detect(), true)
  assert.match(await agencyAgent.diagnostic(), /rejected AGENCY_AGENT_TOKEN/)
  assert.deepEqual(await agencyAgent.scanThreads(), [])
})

test('Agency Agent live scan consumes one bounded operational snapshot per project', async (t) => {
  preserveProcessState(t)
  process.env.AGENCY_AGENT_URL = 'http://localhost:9999/'
  process.env.AGENCY_AGENT_TOKEN = 'aa_fixture_secret'
  const calls = []

  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), headers: options.headers || {} })
    if (String(url).endsWith('/health')) {
      assert.equal(options.headers?.Authorization, undefined)
      return jsonResponse({ status: 'ok', service: 'agency-agent-operator' })
    }
    assert.equal(options.headers?.Authorization, 'Bearer aa_fixture_secret')
    if (String(url).endsWith('/api/v1/projects')) return jsonResponse([project])
    if (String(url).endsWith('/api/v1/projects/proj-1/agent-world')) {
      return jsonResponse({
        schema_version: '1.5',
        project,
        workspace: {
          bound: true,
          repository: 'silverken-platform',
          branch: 'main',
          head: '1234567890abcdef1234567890abcdef12345678',
          clean: true,
          valid: true,
        },
        tasks: [snapshotRecord('NEEDS_USER_DECISION')],
      })
    }
    return jsonResponse({ detail: 'not found' }, 404)
  }

  assert.equal(await agencyAgent.detect(), true)
  assert.equal(await agencyAgent.diagnostic(), '')
  const threads = await agencyAgent.scanThreads()
  assert.equal(threads.length, 1)
  assert.equal(threads[0].unread, true)
  assert.equal(threads[0].project, 'Agency Agent')
  assert.equal(threads[0].operational.silverguard.disposition, 'PASS')
  assert.equal(threads[0].operational.activity.tokenUsage, 12345)
  assert.equal(threads[0].ref.workspace.repository, 'silverken-platform')
  assert.equal(JSON.stringify(threads[0]).includes('aa_fixture_secret'), false)
  assert.ok(calls.some((call) => call.url === 'http://localhost:9999/api/v1/projects/proj-1/agent-world'))
  assert.equal(calls.some((call) => call.url.endsWith('/tasks')), false)
})

test('Agency Agent falls back to the AW3 task endpoint only when snapshot endpoint is absent', async (t) => {
  preserveProcessState(t)
  process.env.AGENCY_AGENT_TOKEN = 'aa_fixture_secret'

  globalThis.fetch = async (url) => {
    const value = String(url)
    if (value.endsWith('/api/v1/projects')) return jsonResponse([project])
    if (value.endsWith('/api/v1/projects/proj-1/agent-world')) return jsonResponse({ detail: 'not found' }, 404)
    if (value.endsWith('/api/v1/projects/proj-1/tasks')) return jsonResponse([task('IN_PROGRESS')])
    return jsonResponse({ detail: 'not found' }, 404)
  }

  const threads = await agencyAgent.scanThreads()
  assert.equal(threads.length, 1)
  assert.equal(threads[0].running, true)
  assert.equal(threads[0].operational, null)
})

test('Agency Agent stays absent when the Operator API health endpoint is unavailable', async (t) => {
  preserveProcessState(t)
  process.env.AGENCY_AGENT_TOKEN = 'aa_fixture'
  globalThis.fetch = async () => {
    throw new TypeError('connect ECONNREFUSED')
  }

  assert.equal(await agencyAgent.detect(), false)
  assert.equal(await agencyAgent.diagnostic(), '')
})
