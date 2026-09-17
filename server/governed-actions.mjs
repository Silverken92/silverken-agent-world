import { requestGovernedAction } from './harnesses/agency-agent.mjs'
import { scanThreads } from './scan.mjs'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])
const ALLOWED_ACTIONS = new Set([
  'REQUEST_HUMAN_REVIEW',
  'REQUEST_RISK_REVIEW',
  'REQUEST_VERIFICATION_RETRY',
])

function hostnameOf(value) {
  if (!value) return ''
  const raw = String(value).includes('://') ? value : `http://${value}`
  try {
    return new URL(raw).hostname.replace(/^\[|\]$/g, '').toLowerCase()
  } catch {
    return ''
  }
}

function isLoopbackPage(req) {
  if (!LOOPBACK_HOSTS.has(hostnameOf(req.headers.host))) return false
  const origin = req.headers.origin
  if (!origin || origin === 'null') return false
  return LOOPBACK_HOSTS.has(hostnameOf(origin))
}

function send(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function readJsonBody(req, limit = 8 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('Body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function safeText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function governedActionHandler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' })
  if (!isLoopbackPage(req)) {
    return send(res, 403, {
      ok: false,
      error: 'Governed actions are accepted only from the local Agent World page',
    })
  }

  try {
    const body = await readJsonBody(req)
    const threadId = safeText(body.threadId, 320)
    const action = safeText(body.action, 64)
    const rationale = safeText(body.rationale, 1000)
    if (!threadId || !ALLOWED_ACTIONS.has(action) || rationale.length < 3) {
      return send(res, 400, { ok: false, error: 'Invalid governed action request' })
    }

    const threads = await scanThreads()
    const thread = threads.find(
      (item) => item.id === threadId && item.harness === 'agency-agent'
    )
    if (!thread) {
      return send(res, 404, { ok: false, error: 'Agency Agent task is no longer available' })
    }

    const projectId = safeText(thread.ref?.projectId, 160)
    const taskId = safeText(thread.ref?.taskId, 160)
    if (!projectId || !taskId) {
      return send(res, 409, { ok: false, error: 'Agency Agent task reference is incomplete' })
    }

    const recorded = await requestGovernedAction(projectId, taskId, action, rationale)
    return send(res, 200, {
      ok: true,
      request: {
        requestId: safeText(recorded?.request_id, 160),
        status: safeText(recorded?.status, 32),
        action: safeText(recorded?.action, 64),
        taskId: safeText(recorded?.task_id, 160),
        createdAt: safeText(recorded?.created_at, 64),
      },
    })
  } catch (error) {
    const upstream = Number(error?.status) || 0
    const status = upstream === 401 || upstream === 403 ? upstream : 502
    const message = upstream === 401
      ? 'Agency Agent rejected the Agent World token'
      : upstream === 403
        ? 'Agency Agent denied this governed action request'
        : 'Agency Agent could not record the governed action request'
    return send(res, status, { ok: false, error: message })
  }
}

export { ALLOWED_ACTIONS, hostnameOf, isLoopbackPage }
