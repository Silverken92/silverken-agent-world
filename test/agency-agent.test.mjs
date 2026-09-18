import test from 'node:test'
import assert from 'node:assert/strict'

import agencyAgent, {
  compactCapabilities,
  compactExecution,
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
        schema_version: '1.4',
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
