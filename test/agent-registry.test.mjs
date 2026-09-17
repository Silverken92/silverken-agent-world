import test from 'node:test'
import assert from 'node:assert/strict'

import { toAgentThread } from '../server/harnesses/agency-agent.mjs'

const project = {
  project_id: 'proj-1',
  name: 'Agency Agent',
  slug: 'agency-agent',
}

function profile(overrides = {}) {
  return {
    agent_id: 'agt-frontend-01',
    name: 'Frontend-01',
    slug: 'frontend-01',
    role: 'FRONTEND',
    description: 'Build governed user interfaces',
    model: 'fixture-model',
    enabled: true,
    tools_allowed: ['read_file', 'write_file'],
    allowed_changes: ['src/frontend/**'],
    created_at: '2026-09-09T19:00:00Z',
    updated_at: '2026-09-09T19:05:00Z',
    ...overrides,
  }
}

function record(status, overrides = {}) {
  return {
    task: {
      id: `task-${status.toLowerCase()}`,
      objective: `Exercise ${status}`,
      owner_agent: 'Frontend-01',
      status,
      risk: 'LOW',
      execution_model: 'SINGLE_AGENT',
      workspace_isolation: null,
      created_at: '2026-09-09T20:00:00Z',
      updated_at: '2026-09-09T20:05:00Z',
      ...overrides,
    },
    verification: { total: 0, pass: 0, fail: 0, unknown: 0, not_run: 0 },
    activity: {
      event_count: 0,
      latest_event_type: null,
      latest_event_at: null,
      latest_agent_id: null,
      token_usage: 0,
      cost_by_currency: {},
    },
    evaluator: null,
    silverguard: null,
    release: null,
    governed_requests: [],
  }
}

test('persistent Agency Agent profile becomes an idle registered astronaut', () => {
  const thread = toAgentThread(project, profile(), [])
  assert.equal(thread.id, 'agency-agent-profile:proj-1:agt-frontend-01')
  assert.equal(thread.title, 'Frontend-01')
  assert.equal(thread.preview, 'Build governed user interfaces')
  assert.equal(thread.running, false)
  assert.equal(thread.unread, false)
  assert.equal(thread.hasError, false)
  assert.equal(thread.archived, false)
  assert.equal(thread.operational.ownerAgent, 'Frontend-01')
  assert.equal(thread.operational.executionModel, 'AGENT · FRONTEND')
  assert.deepEqual(Object.keys(thread.ref).sort(), ['agentId', 'agentName', 'profile', 'projectId', 'role'])
})

test('persistent profile reflects owned mission health without becoming that mission', () => {
  const thread = toAgentThread(project, profile(), [
    record('IN_PROGRESS'),
    record('NEEDS_USER_DECISION', { id: 'task-attention' }),
  ])
  assert.equal(thread.running, true)
  assert.equal(thread.unread, true)
  assert.equal(thread.hasError, false)
  assert.equal(thread.ref.profile, true)
  assert.equal(thread.ref.agentId, 'agt-frontend-01')
})

test('verification failure is summarized on the persistent profile', () => {
  const thread = toAgentThread(project, profile(), [record('FAILED_VERIFICATION')])
  assert.equal(thread.running, false)
  assert.equal(thread.hasError, true)
})

test('disabled persistent profile is removed from the live colony', () => {
  const thread = toAgentThread(project, profile({ enabled: false }), [])
  assert.equal(thread.archived, true)
  assert.equal(thread.running, false)
})

test('profile projection contains no credential or creator identity', () => {
  const raw = profile({ created_by: 'usr-private', secret: 'do-not-project' })
  const thread = toAgentThread(project, raw, [])
  const serialized = JSON.stringify(thread)
  assert.equal(serialized.includes('usr-private'), false)
  assert.equal(serialized.includes('do-not-project'), false)
  assert.equal(serialized.includes('token'), false)
})
