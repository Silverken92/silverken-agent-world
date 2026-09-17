import test from 'node:test'
import assert from 'node:assert/strict'

import agencyAgent from '../server/harnesses/agency-agent.mjs'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

test('live scan renders persistent profile and mission from one bounded snapshot', async (t) => {
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

  process.env.AGENCY_AGENT_URL = 'http://localhost:9999/'
  process.env.AGENCY_AGENT_TOKEN = 'aa_fixture_secret'
  const project = { project_id: 'proj-1', name: 'Tuce', slug: 'tuce' }
  const profile = {
    agent_id: 'agt-1',
    name: 'Frontend-01',
    slug: 'frontend-01',
    role: 'FRONTEND',
    description: 'Persistent governed frontend agent',
    model: null,
    enabled: true,
    tools_allowed: [],
    allowed_changes: [],
    created_at: '2026-09-17T20:00:00Z',
    updated_at: '2026-09-17T20:01:00Z',
  }
  const record = {
    task: {
      id: 'task-1',
      objective: 'AW10 mission',
      owner_agent: 'Frontend-01',
      status: 'IN_PROGRESS',
      risk: 'LOW',
      execution_model: 'SINGLE_AGENT',
      workspace_isolation: null,
      created_at: '2026-09-17T20:02:00Z',
      updated_at: '2026-09-17T20:03:00Z',
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

  globalThis.fetch = async (url, options = {}) => {
    const value = String(url)
    if (value.endsWith('/api/v1/projects')) {
      assert.equal(options.headers?.Authorization, 'Bearer aa_fixture_secret')
      return jsonResponse([project])
    }
    if (value.endsWith('/api/v1/projects/proj-1/agent-world')) {
      assert.equal(options.headers?.Authorization, 'Bearer aa_fixture_secret')
      return jsonResponse({ schema_version: '1.1', project, agents: [profile], tasks: [record] })
    }
    return jsonResponse({ detail: 'not found' }, 404)
  }

  const threads = await agencyAgent.scanThreads()
  assert.equal(threads.length, 2)
  const identity = threads.find((item) => item.ref?.profile === true)
  const mission = threads.find((item) => item.ref?.taskId === 'task-1')
  assert.ok(identity)
  assert.ok(mission)
  assert.equal(identity.project, 'Tuce')
  assert.equal(identity.title, 'Frontend-01')
  assert.equal(identity.running, true)
  assert.equal(mission.running, true)
  assert.equal(JSON.stringify(threads).includes('aa_fixture_secret'), false)
})
