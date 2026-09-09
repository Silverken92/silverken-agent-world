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
      workspace_id: 'aw2-worktree',
      integration_target: 'aw2/bootstrap-agency-agent',
    },
    created_at: '2026-09-09T20:00:00Z',
    updated_at: '2026-09-09T20:05:00Z',
    ...overrides,
  }
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
  assert.equal(thread.gitBranch, 'aw2/bootstrap-agency-agent')
  assert.equal(thread.worktree, 'aw2-worktree')
  assert.deepEqual(Object.keys(thread.ref).sort(), ['ownerAgent', 'projectId', 'status', 'taskId'])
  assert.equal(JSON.stringify(thread.ref).includes('token'), false)
})

test('Agency Agent bridge is read-only', () => {
  assert.equal(agencyAgent.openThread({}).ok, false)
  assert.equal(agencyAgent.newSession('/tmp').ok, false)
  assert.equal(agencyAgent.setArchived, undefined)
})

test('Agency Agent is not detected without an explicit API token', async () => {
  const previous = process.env.AGENCY_AGENT_TOKEN
  delete process.env.AGENCY_AGENT_TOKEN
  try {
    assert.equal(await agencyAgent.detect(), false)
  } finally {
    if (previous === undefined) delete process.env.AGENCY_AGENT_TOKEN
    else process.env.AGENCY_AGENT_TOKEN = previous
  }
})
