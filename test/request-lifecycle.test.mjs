import test from 'node:test'
import assert from 'node:assert/strict'

import {
  compactOperational,
  encodeOperationalModel,
} from '../server/harnesses/agency-agent.mjs'
import {
  clearGovernedActionStates,
  governedActionModel,
  governedActionState,
} from '../src/ui/governed-actions.js'
import {
  decodeOperationalModel,
  operationalBadges,
} from '../src/ui/operational.js'

function record(status = 'ACKNOWLEDGED') {
  return {
    task: {
      id: 'task-aw9',
      objective: 'AW9 lifecycle',
      owner_agent: 'Orchestrator',
      status: 'BACKLOG',
      risk: 'LOW',
      execution_model: 'SINGLE_AGENT',
      created_at: '2026-09-17T19:00:00Z',
      updated_at: '2026-09-17T19:00:00Z',
    },
    verification: {},
    activity: {},
    evaluator: null,
    silverguard: null,
    release: null,
    governed_requests: [
      {
        request_id: 'audit-aw9',
        requested_action: 'REQUEST_HUMAN_REVIEW',
        status,
        created_at: '2026-09-17T19:10:00Z',
      },
    ],
  }
}

test('Agency Agent lifecycle snapshot is compact and rationale-free', () => {
  const source = record('ACKNOWLEDGED')
  const ops = compactOperational(source, source.task)

  assert.deepEqual(ops.governedRequest, {
    requestId: 'audit-aw9',
    action: 'REQUEST_HUMAN_REVIEW',
    status: 'ACKNOWLEDGED',
    createdAt: '2026-09-17T19:10:00Z',
  })
  assert.equal(JSON.stringify(ops).includes('rationale'), false)
})

test('AW9 lifecycle survives the compact SKOPS browser contract', () => {
  const source = record('ACKNOWLEDGED')
  const ops = compactOperational(source, source.task)
  const encoded = encodeOperationalModel(ops, {
    threadId: 'agency-agent:project-aw9:task-aw9',
    status: 'BACKLOG',
  })
  const decoded = decodeOperationalModel(encoded)

  assert.deepEqual(decoded.q, ['ACKNOWLEDGED', 'REQUEST_HUMAN_REVIEW'])

  const badges = operationalBadges(decoded, 'fr')
  assert.ok(badges.some((badge) => badge.label === 'Demande · PRISE EN COMPTE'))
})

test('an outstanding server request disables duplicate contextual requests', () => {
  clearGovernedActionStates()
  const source = record('ACKNOWLEDGED')
  const ops = compactOperational(source, source.task)
  const decoded = decodeOperationalModel(
    encodeOperationalModel(ops, {
      threadId: 'agency-agent:project-aw9:task-aw9',
      status: 'BACKLOG',
    })
  )
  const model = governedActionModel(decoded, 'fr')

  assert.equal(model.action, 'REQUEST_HUMAN_REVIEW')
  assert.equal(model.serverState, 'acknowledged')
  assert.equal(governedActionState(model), 'acknowledged')
})

test('resolved requests remain visible but allow a future new request', () => {
  clearGovernedActionStates()
  const source = record('RESOLVED')
  const ops = compactOperational(source, source.task)
  const decoded = decodeOperationalModel(
    encodeOperationalModel(ops, {
      threadId: 'agency-agent:project-aw9:task-aw9',
      status: 'BACKLOG',
    })
  )
  const model = governedActionModel(decoded, 'fr')

  assert.equal(model.serverState, '')
  assert.equal(governedActionState(model), '')
  assert.ok(
    operationalBadges(decoded, 'fr').some(
      (badge) => badge.label === 'Demande · RÉSOLUE'
    )
  )
})
