import test from 'node:test'
import assert from 'node:assert/strict'

import agencyAgent, { toThread } from '../server/harnesses/agency-agent.mjs'

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
      workspace_id: 'aw3-worktree',
      integration_target: 'aw3/live-agency-agent',
    },
    created_at: '2026-09-09T20:00:00Z',
    updated_at: '2026-09-09T20:05:00Z',
    ...overrides,
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
  assert.equal(thread.gitBranch, 'aw3/live-agency-agent')
  assert.equal(thread.worktree, 'aw3-worktree')
  assert.deepEqual(Object.keys(thread.ref).sort(), ['ownerAgent', 'projectId', 'status', 'taskId'])
  assert.equal(JSON.stringify(thread.ref).includes('token'), false)
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

test('Agency Agent live scan reads projects and tasks with server-side bearer auth', async (t) => {
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
    if (String(url).endsWith('/api/v1/projects/proj-1/tasks')) {
      return jsonResponse([task('NEEDS_USER_DECISION')])
    }
    return jsonResponse({ detail: 'not found' }, 404)
  }

  assert.equal(await agencyAgent.detect(), true)
  assert.equal(await agencyAgent.diagnostic(), '')
  const threads = await agencyAgent.scanThreads()
  assert.equal(threads.length, 1)
  assert.equal(threads[0].unread, true)
  assert.equal(threads[0].project, 'Agency Agent')
  assert.equal(JSON.stringify(threads[0]).includes('aa_fixture_secret'), false)
  assert.ok(calls.some((call) => call.url === 'http://localhost:9999/api/v1/projects'))
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
