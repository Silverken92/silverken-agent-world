import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const OPS_PREFIX = 'SKOPS:'
const DEFAULT_CACHE_MS = 30_000
const DEFAULT_MAX_CONTEXTS = 20
const SUCCESS_CONCLUSIONS = new Set(['success', 'neutral', 'skipped'])
const FAILURE_CONCLUSIONS = new Set([
  'failure',
  'cancelled',
  'timed_out',
  'action_required',
  'startup_failure',
  'stale',
])

const cache = new Map()
const inflight = new Map()

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseProjectMap(raw) {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, value]) => [clean(key), clean(value)])
        .filter(([key, value]) => key && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value))
    )
  } catch {
    return {}
  }
}

export function githubConfig(env = process.env) {
  const token = clean(env.AGENT_WORLD_GITHUB_TOKEN || env.GITHUB_TOKEN || env.GH_TOKEN)
  const projectMap = parseProjectMap(env.AGENT_WORLD_GITHUB_PROJECTS)
  const explicit = clean(env.AGENT_WORLD_GITHUB).toLowerCase()
  const enabled = explicit === '1' || explicit === 'true' || Boolean(token) || Object.keys(projectMap).length > 0
  return {
    enabled,
    token,
    projectMap,
    apiBase: clean(env.AGENT_WORLD_GITHUB_API) || 'https://api.github.com',
    cacheMs: parsePositiveInt(env.AGENT_WORLD_GITHUB_CACHE_MS, DEFAULT_CACHE_MS),
    maxContexts: parsePositiveInt(env.AGENT_WORLD_GITHUB_MAX_CONTEXTS, DEFAULT_MAX_CONTEXTS),
  }
}

export function parseGitHubRemote(remote) {
  const value = clean(remote).replace(/\.git$/i, '')
  if (!value) return ''

  let match = value.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)$/i)
  if (match) return `${match[1]}/${match[2]}`

  match = value.match(/^git@github\.com:([^/]+)\/([^/]+)$/i)
  if (match) return `${match[1]}/${match[2]}`

  match = value.match(/^ssh:\/\/git@github\.com\/([^/]+)\/([^/]+)$/i)
  if (match) return `${match[1]}/${match[2]}`

  return ''
}

async function localGitInfo(dir) {
  const cwd = clean(dir)
  if (!cwd) return null
  try {
    const [{ stdout: remote }, { stdout: branch }] = await Promise.all([
      execFileAsync('git', ['-C', cwd, 'remote', 'get-url', 'origin'], { windowsHide: true }),
      execFileAsync('git', ['-C', cwd, 'branch', '--show-current'], { windowsHide: true }),
    ])
    const repo = parseGitHubRemote(remote)
    if (!repo) return null
    return { repo, branch: clean(branch) }
  } catch {
    return null
  }
}

function mappedRepo(project, projectMap) {
  const name = clean(project)
  if (!name) return ''
  if (projectMap[name]) return projectMap[name]
  const lower = name.toLowerCase()
  const found = Object.entries(projectMap).find(([key]) => key.toLowerCase() === lower)
  return found?.[1] || ''
}

export async function resolveGitHubTarget(thread, { projectMap = {}, gitInfo = localGitInfo } = {}) {
  const branchHint = clean(thread?.gitBranch)
  const mapped = mappedRepo(thread?.project, projectMap)
  if (mapped && branchHint) return { repo: mapped, branch: branchHint }

  const dir = clean(thread?.projectPath || thread?.cwd)
  const local = dir ? await gitInfo(dir) : null
  const repo = mapped || clean(local?.repo)
  const branch = branchHint || clean(local?.branch)
  if (!repo) return null
  return { repo, branch }
}

function headers(token) {
  const out = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'SilverKen-Agent-World',
  }
  if (token) out.Authorization = `Bearer ${token}`
  return out
}

async function getJson(url, { token, fetchImpl }) {
  const response = await fetchImpl(url, { headers: headers(token), signal: AbortSignal.timeout(4_000) })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`GitHub API HTTP ${response.status}`)
  return response.json()
}

function prState(pr) {
  if (!pr) return ''
  if (pr.merged_at) return 'MERGED'
  return String(pr.state || '').toUpperCase()
}

export function summarizeChecks(checkRuns = [], statuses = []) {
  let passed = 0
  let failed = 0
  let pending = 0

  for (const check of Array.isArray(checkRuns) ? checkRuns : []) {
    const status = clean(check?.status).toLowerCase()
    const conclusion = clean(check?.conclusion).toLowerCase()
    if (status !== 'completed' || !conclusion) pending += 1
    else if (SUCCESS_CONCLUSIONS.has(conclusion)) passed += 1
    else if (FAILURE_CONCLUSIONS.has(conclusion)) failed += 1
    else pending += 1
  }

  for (const statusItem of Array.isArray(statuses) ? statuses : []) {
    const state = clean(statusItem?.state).toLowerCase()
    if (state === 'success') passed += 1
    else if (state === 'failure' || state === 'error') failed += 1
    else pending += 1
  }

  const total = passed + failed + pending
  const state = failed > 0 ? 'FAIL' : pending > 0 ? 'PENDING' : total > 0 ? 'PASS' : 'NONE'
  return { state, passed, failed, pending, total }
}

async function fetchContext(target, config, fetchImpl) {
  const [owner, repoName] = target.repo.split('/')
  if (!owner || !repoName) return null

  if (!target.branch) {
    return {
      repo: target.repo,
      repoUrl: `https://github.com/${target.repo}`,
      branch: '',
      prNumber: null,
      prState: '',
      prUrl: '',
      ci: summarizeChecks(),
    }
  }

  const query = new URLSearchParams({ state: 'all', head: `${owner}:${target.branch}`, per_page: '5' })
  const pulls = await getJson(`${config.apiBase}/repos/${target.repo}/pulls?${query}`, {
    token: config.token,
    fetchImpl,
  })
  const pr = Array.isArray(pulls) ? pulls.find((item) => item?.head?.ref === target.branch) || pulls[0] : null

  if (!pr) {
    return {
      repo: target.repo,
      repoUrl: `https://github.com/${target.repo}`,
      branch: target.branch,
      prNumber: null,
      prState: '',
      prUrl: '',
      ci: summarizeChecks(),
    }
  }

  const sha = clean(pr?.head?.sha)
  let checkRuns = []
  let statuses = []
  if (sha) {
    const [checksPayload, statusPayload] = await Promise.all([
      getJson(`${config.apiBase}/repos/${target.repo}/commits/${sha}/check-runs?per_page=100`, {
        token: config.token,
        fetchImpl,
      }).catch(() => null),
      getJson(`${config.apiBase}/repos/${target.repo}/commits/${sha}/status`, {
        token: config.token,
        fetchImpl,
      }).catch(() => null),
    ])
    checkRuns = checksPayload?.check_runs || []
    statuses = statusPayload?.statuses || []
  }

  return {
    repo: target.repo,
    repoUrl: clean(pr?.base?.repo?.html_url) || `https://github.com/${target.repo}`,
    branch: target.branch,
    sha,
    prNumber: Number(pr?.number) || null,
    prState: prState(pr),
    prUrl: clean(pr?.html_url),
    ci: summarizeChecks(checkRuns, statuses),
  }
}

function cacheKey(target) {
  return `${target.repo}\u0000${target.branch || ''}`
}

async function cachedContext(target, config, fetchImpl) {
  const key = cacheKey(target)
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expiresAt > now) return hit.value
  if (inflight.has(key)) return inflight.get(key)

  const request = fetchContext(target, config, fetchImpl)
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + config.cacheMs })
      return value
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, request)
  return request
}

function injectOperationalGithub(model, context) {
  const value = clean(model)
  if (!value.startsWith(OPS_PREFIX) || !context) return model
  try {
    const data = JSON.parse(decodeURIComponent(value.slice(OPS_PREFIX.length)))
    if (!data || typeof data !== 'object' || Array.isArray(data)) return model
    data.h = {
      q: context.repo,
      b: context.branch || '',
      n: context.prNumber,
      s: context.prState || '',
      u: context.prUrl || '',
      c: context.ci?.state || 'NONE',
      p: context.ci?.passed || 0,
      f: context.ci?.failed || 0,
      w: context.ci?.pending || 0,
      t: context.ci?.total || 0,
    }
    return `${OPS_PREFIX}${encodeURIComponent(JSON.stringify(data))}`
  } catch {
    return model
  }
}

export async function enrichThreadsWithGitHub(
  threads,
  { config = githubConfig(), fetchImpl = globalThis.fetch, gitInfo = localGitInfo } = {}
) {
  if (!config.enabled || typeof fetchImpl !== 'function') return threads

  let contexts = 0
  return Promise.all(
    threads.map(async (thread) => {
      if (contexts >= config.maxContexts) return thread
      const target = await resolveGitHubTarget(thread, { projectMap: config.projectMap, gitInfo })
      if (!target) return thread
      contexts += 1

      try {
        const context = await cachedContext(target, config, fetchImpl)
        if (!context) return thread
        return {
          ...thread,
          github: context,
          prState: context.prState || thread.prState,
          model: injectOperationalGithub(thread.model, context),
        }
      } catch (error) {
        console.warn(`agent-world: GitHub enrichment skipped for ${target.repo} —`, error?.message || error)
        return thread
      }
    })
  )
}

export function resetGithubEnrichmentCache() {
  cache.clear()
  inflight.clear()
}
