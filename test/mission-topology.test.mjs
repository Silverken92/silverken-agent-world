import test from 'node:test'
import assert from 'node:assert/strict'

import { missionTopology, orderProjectThreads } from '../src/game/mission-topology.js'
import { toThread } from '../server/harnesses/agency-agent.mjs'
import { decodeOperationalModel, operationalBadges } from '../src/ui/operational.js'

const project = { project_id: 'proj-1', name: 'Tuce', slug: 'tuce' }
const profile = {
  agent_id: 'agt-1',
  name: 'Tuce-Frontend',
  role: 'FRONTEND',
}
const identity = {
  id: 'agency-agent-profile:proj-1:agt-1',
  title: 'Tuce-Frontend',
  project: 'Tuce',
  createdAt: 10,
  ref: { projectId: 'proj-1', agentId: 'agt-1', agentName: 'Tuce-Frontend', profile: true },
}
const mission = {
  id: 'agency-agent:proj-1:task-1',
  title: 'Build the UI',
  project: 'Tuce',
  createdAt: 20,
  ref: { projectId: 'proj-1', taskId: 'task-1', agentId: 'agt-1', agentName: 'Tuce-Frontend' },
}

test('AW11 resolves only explicit AgentProfile mission relations', () => {
  assert.deepEqual(missionTopology([mission, identity]), [{
    project: 'Tuce',
    agentId: 'agt-1',
    agentName: 'Tuce-Frontend',
    agentThreadId: identity.id,
    missionThreadId: mission.id,
  }])

  const legacy = { ...mission, id: 'legacy', ref: { projectId: 'proj-1', taskId: 'legacy', ownerAgent: 'Orchestrator' } }
  assert.deepEqual(missionTopology([identity, legacy]), [])
})

test('AW11 orders a persistent profile immediately before its missions', () => {
  const other = { id: 'other', project: 'Tuce', createdAt: 1, ref: {} }
  const ordered = orderProjectThreads([mission, other, identity])
  assert.deepEqual(ordered.map((thread) => thread.id), [identity.id, mission.id, other.id])
})

test('Agency Agent normalized mission carries stable agent id and UI relation metadata', () => {
  const record = {
    task: {
      id: 'task-1',
      objective: 'Smoke AW11',
      owner_agent: 'Tuce-Frontend',
      status: 'BACKLOG',
      risk: 'LOW',
      execution_model: 'SINGLE_AGENT',
      workspace_isolation: null,
      created_at: '2026-09-18T08:00:00Z',
      updated_at: '2026-09-18T08:01:00Z',
    },
    verification: { total: 0, pass: 0, fail: 0, unknown: 0, not_run: 0 },
    activity: { event_count: 0, token_usage: 0, cost_by_currency: {} },
    evaluator: null,
    silverguard: null,
    release: null,
    governed_requests: [],
  }
  const thread = toThread(project, record, profile)
  assert.equal(thread.ref.agentId, 'agt-1')
  assert.equal(thread.ref.agentName, 'Tuce-Frontend')

  const data = decodeOperationalModel(thread.model)
  assert.deepEqual(data.p, ['Tuce-Frontend', 'agt-1'])
  assert.ok(operationalBadges(data, 'fr').some((badge) => badge.label === 'Mission · Tuce-Frontend'))
  assert.equal(JSON.stringify(thread).includes('token'), false)
})
