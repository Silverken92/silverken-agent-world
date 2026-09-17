import test from 'node:test'
import assert from 'node:assert/strict'

import { requestGovernedAction } from '../server/harnesses/agency-agent.mjs'
import { ALLOWED_ACTIONS, isLoopbackPage } from '../server/governed-actions.mjs'
import {
  ACTIONS,
  actionForStatus,
  clearGovernedActionStates,
  governedActionModel,
  governedActionState,
  setGovernedActionState,
  submitGovernedAction,
} from '../src/ui/governed-actions.js'
import { devApiMiddleware } from '../vite.config.js'

test('governed action is contextual and remains a request, never a direct mutation verb', () => {
  assert.equal(actionForStatus('BACKLOG'), ACTIONS.HUMAN)
  assert.equal(actionForStatus('RISK_ACCEPTANCE_REQUIRED'), ACTIONS.RISK)
  assert.equal(actionForStatus('FAILED_VERIFICATION'), ACTIONS.VERIFY)
  assert.deepEqual(
    new Set(ALLOWED_ACTIONS),
    new Set([
      'REQUEST_HUMAN_REVIEW',
      'REQUEST_RISK_REVIEW',
      'REQUEST_VERIFICATION_RETRY',
    ])
  )
  for (const action of ALLOWED_ACTIONS) {
    assert.match(action, /^REQUEST_/)
    assert.equal(/MERGE|WRITE|APPROVE|DENY|EXECUTE/.test(action), false)
  }
})

test('browser action model carries only canonical thread identity and display state', () => {
  const model = governedActionModel(
    {
      x: {
        i: 'agency-agent:prj_123:task_456',
        s: 'RISK_ACCEPTANCE_REQUIRED',
        o: 'http://127.0.0.1:8787/ui?project=prj_123&task=task_456',
      },
    },
    'fr'
  )
  assert.equal(model.threadId, 'agency-agent:prj_123:task_456')
  assert.equal(model.action, 'REQUEST_RISK_REVIEW')
  assert.equal(model.label, 'Demander revue risque')
  assert.equal(JSON.stringify(model).includes('aa_'), false)
})

test('recorded request state survives card rerenders for the same contextual action', () => {
  clearGovernedActionStates()
  const data = {
    x: {
      i: 'agency-agent:prj_1:task_1',
      s: 'BACKLOG',
    },
  }
  const first = governedActionModel(data, 'fr')
  assert.equal(governedActionState(first), '')

  setGovernedActionState(first, 'pending')
  const duringRerender = governedActionModel(data, 'fr')
  assert.equal(governedActionState(duringRerender), 'pending')

  setGovernedActionState(first, 'recorded')
  const afterRerender = governedActionModel(data, 'fr')
  assert.equal(governedActionState(afterRerender), 'recorded')

  const changedAction = governedActionModel(
    { x: { i: 'agency-agent:prj_1:task_1', s: 'FAILED_VERIFICATION' } },
    'fr'
  )
  assert.equal(changedAction.action, ACTIONS.VERIFY)
  assert.equal(governedActionState(changedAction), '')
  clearGovernedActionStates()
})

test('browser submits governed intent only to same-origin Agent World gateway', async () => {
  let seen
  const fakeFetch = async (url, options) => {
    seen = { url, options }
    return new Response(
      JSON.stringify({
        ok: true,
        request: {
          requestId: 'audit_1',
          status: 'RECORDED',
          action: 'REQUEST_HUMAN_REVIEW',
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  }

  const model = {
    threadId: 'agency-agent:prj_1:task_1',
    action: 'REQUEST_HUMAN_REVIEW',
  }
  const result = await submitGovernedAction(model, 'Please review this task', fakeFetch)
  assert.equal(result.status, 'RECORDED')
  assert.equal(seen.url, '/api/governed-action')
  assert.equal(seen.options.method, 'POST')
  const body = JSON.parse(seen.options.body)
  assert.deepEqual(body, {
    threadId: 'agency-agent:prj_1:task_1',
    action: 'REQUEST_HUMAN_REVIEW',
    rationale: 'Please review this task',
  })
  assert.equal(JSON.stringify(seen).includes('Authorization'), false)
  assert.equal(JSON.stringify(seen).includes('aa_'), false)
})

test('Vite dev server wires the governed-action gateway before the generic API router', async () => {
  const req = {
    url: '/api/governed-action',
    method: 'GET',
    headers: {
      host: 'localhost:5274',
      origin: 'http://localhost:5274',
    },
  }
  const observed = { status: 0, body: '' }
  const res = {
    writeHead(status) {
      observed.status = status
      return this
    },
    end(body = '') {
      observed.body = String(body)
      return this
    },
  }

  let fellThrough = false
  await devApiMiddleware(req, res, () => {
    fellThrough = true
  })

  assert.equal(fellThrough, false)
  assert.equal(observed.status, 405)
  assert.deepEqual(JSON.parse(observed.body), {
    ok: false,
    error: 'Method not allowed',
  })
})

test('governed action gateway is loopback-origin only', () => {
  assert.equal(
    isLoopbackPage({ headers: { host: 'localhost:5274', origin: 'http://localhost:5274' } }),
    true
  )
  assert.equal(
    isLoopbackPage({ headers: { host: '127.0.0.1:5274', origin: 'http://127.0.0.1:5274' } }),
    true
  )
  assert.equal(
    isLoopbackPage({ headers: { host: '192.168.1.20:5274', origin: 'http://192.168.1.20:5274' } }),
    false
  )
  assert.equal(isLoopbackPage({ headers: { host: 'localhost:5274' } }), false)
})

test('Agency Agent bearer token stays server-side when an action request is forwarded', async (t) => {
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

  process.env.AGENCY_AGENT_TOKEN = 'aa_server_only_secret'
  process.env.AGENCY_AGENT_URL = 'http://127.0.0.1:8787'
  let seen
  globalThis.fetch = async (url, options) => {
    seen = { url: String(url), options }
    return new Response(
      JSON.stringify({
        request_id: 'audit_1',
        status: 'RECORDED',
        action: 'REQUEST_VERIFICATION_RETRY',
        task_id: 'task_1',
        created_at: '2026-09-17T18:00:00Z',
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  }

  const result = await requestGovernedAction(
    'prj_1',
    'task_1',
    'REQUEST_VERIFICATION_RETRY',
    'Retry the failed verification'
  )
  assert.equal(result.status, 'RECORDED')
  assert.equal(
    seen.url,
    'http://127.0.0.1:8787/api/v1/projects/prj_1/tasks/task_1/agent-world-actions'
  )
  assert.equal(seen.options.method, 'POST')
  assert.equal(seen.options.headers.Authorization, 'Bearer aa_server_only_secret')
  assert.equal(JSON.stringify(result).includes('aa_server_only_secret'), false)
})
