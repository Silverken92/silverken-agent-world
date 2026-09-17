import assert from 'node:assert/strict'
import test from 'node:test'

import {
  enrichThreadsWithGitHub,
  githubConfig,
  parseGitHubRemote,
  resetGithubEnrichmentCache,
  resolveGitHubTarget,
  summarizeChecks,
} from '../server/github-enrichment.mjs'
import { decodeOperationalModel, operationalBadges } from '../src/ui/operational.js'

function response(payload, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() {
      return payload
    },
  }
}

function skops(payload) {
  return `SKOPS:${encodeURIComponent(JSON.stringify(payload))}`
}

test('GitHub remote parser accepts common HTTPS and SSH origin forms', () => {
  assert.equal(parseGitHubRemote('https://github.com/Silverken92/agency-agent.git'), 'Silverken92/agency-agent')
  assert.equal(parseGitHubRemote('git@github.com:Silverken92/agency-agent.git'), 'Silverken92/agency-agent')
  assert.equal(parseGitHubRemote('ssh://git@github.com/Silverken92/agency-agent.git'), 'Silverken92/agency-agent')
  assert.equal(parseGitHubRemote('https://example.com/Silverken92/agency-agent.git'), '')
})

test('GitHub check aggregation keeps pass, fail and pending evidence distinct', () => {
  assert.deepEqual(
    summarizeChecks(
      [
        { status: 'completed', conclusion: 'success' },
        { status: 'completed', conclusion: 'failure' },
        { status: 'in_progress', conclusion: null },
      ],
      [{ state: 'success' }]
    ),
    { state: 'FAIL', passed: 2, failed: 1, pending: 1, total: 4 }
  )
  assert.deepEqual(summarizeChecks([{ status: 'completed', conclusion: 'success' }], []), {
    state: 'PASS',
    passed: 1,
    failed: 0,
    pending: 0,
    total: 1,
  })
})

test('Agency Agent projects can resolve GitHub repository from explicit project mapping', async () => {
  const target = await resolveGitHubTarget(
    { project: 'Tuce', gitBranch: 'feat/world', projectPath: '', cwd: '' },
    { projectMap: { Tuce: 'Silverken92/tuce' }, gitInfo: async () => null }
  )
  assert.deepEqual(target, { repo: 'Silverken92/tuce', branch: 'feat/world' })
})

test('local harnesses can resolve repository and branch from their checkout', async () => {
  const target = await resolveGitHubTarget(
    { project: 'agent-world', gitBranch: '', projectPath: 'C:/dev/agent-world' },
    {
      projectMap: {},
      gitInfo: async (dir) => {
        assert.equal(dir, 'C:/dev/agent-world')
        return { repo: 'Silverken92/silverken-agent-world', branch: 'main' }
      },
    }
  )
  assert.deepEqual(target, { repo: 'Silverken92/silverken-agent-world', branch: 'main' })
})

test('GitHub enrichment is disabled by default and makes no network request', async () => {
  let calls = 0
  const threads = [{ id: 'x', project: 'Tuce', gitBranch: 'main' }]
  const result = await enrichThreadsWithGitHub(threads, {
    config: githubConfig({}),
    fetchImpl: async () => {
      calls += 1
      throw new Error('must not run')
    },
  })
  assert.equal(calls, 0)
  assert.equal(result, threads)
})

test('read-only enrichment adds real PR and CI evidence without leaking the GitHub token', async () => {
  resetGithubEnrichmentCache()
  const token = 'github-secret-never-send-to-browser'
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    assert.equal(options.method, undefined)
    assert.equal(options.headers.Authorization, `Bearer ${token}`)

    if (String(url).includes('/pulls?')) {
      return response([
        {
          number: 42,
          state: 'open',
          merged_at: null,
          html_url: 'https://github.com/Silverken92/tuce/pull/42',
          head: { ref: 'feat/world', sha: 'abc123' },
          base: { repo: { html_url: 'https://github.com/Silverken92/tuce' } },
        },
      ])
    }
    if (String(url).includes('/check-runs')) {
      return response({
        check_runs: [
          { name: 'quality', status: 'completed', conclusion: 'success' },
          { name: 'security', status: 'completed', conclusion: 'success' },
        ],
      })
    }
    if (String(url).endsWith('/status')) {
      return response({ statuses: [{ context: 'legacy', state: 'success' }] })
    }
    throw new Error(`unexpected GitHub URL: ${url}`)
  }

  const source = {
    id: 'agency-agent:project:task',
    project: 'Tuce',
    gitBranch: 'feat/world',
    projectPath: '',
    cwd: '',
    prState: '',
    model: skops({ m: 'SINGLE_AGENT', o: 'Orchestrator', r: false, c: {} }),
  }
  const config = {
    enabled: true,
    token,
    projectMap: { Tuce: 'Silverken92/tuce' },
    apiBase: 'https://api.github.test',
    cacheMs: 30_000,
    maxContexts: 20,
  }

  const [thread] = await enrichThreadsWithGitHub([source], { config, fetchImpl, gitInfo: async () => null })
  assert.equal(thread.github.repo, 'Silverken92/tuce')
  assert.equal(thread.github.prNumber, 42)
  assert.equal(thread.github.prState, 'OPEN')
  assert.deepEqual(thread.github.ci, { state: 'PASS', passed: 3, failed: 0, pending: 0, total: 3 })
  assert.equal(thread.prState, 'OPEN')
  assert.equal(calls.length, 3)

  const operational = decodeOperationalModel(thread.model)
  assert.deepEqual(operational.h, {
    q: 'Silverken92/tuce',
    b: 'feat/world',
    n: 42,
    s: 'OPEN',
    u: 'https://github.com/Silverken92/tuce/pull/42',
    c: 'PASS',
    p: 3,
    f: 0,
    w: 0,
    t: 3,
  })

  const serialized = JSON.stringify(thread)
  assert.equal(serialized.includes(token), false)
  assert.equal(serialized.includes('Authorization'), false)

  const fr = operationalBadges(operational, 'fr').map((badge) => badge.label)
  assert.ok(fr.includes('GitHub · Silverken92/tuce'))
  assert.ok(fr.includes('PR #42 · OUVERTE'))
  assert.ok(fr.includes('CI · OK · 3/3'))
})

test('merged GitHub PR is the only GitHub evidence that drives the merged celebration state', async () => {
  resetGithubEnrichmentCache()
  const fetchImpl = async (url) => {
    if (String(url).includes('/pulls?')) {
      return response([
        {
          number: 7,
          state: 'closed',
          merged_at: '2026-09-17T12:00:00Z',
          html_url: 'https://github.com/Silverken92/tuce/pull/7',
          head: { ref: 'feat/merged', sha: 'def456' },
          base: { repo: { html_url: 'https://github.com/Silverken92/tuce' } },
        },
      ])
    }
    if (String(url).includes('/check-runs')) return response({ check_runs: [] })
    if (String(url).endsWith('/status')) return response({ statuses: [] })
    throw new Error(`unexpected GitHub URL: ${url}`)
  }

  const [thread] = await enrichThreadsWithGitHub(
    [{ id: 'a', project: 'Tuce', gitBranch: 'feat/merged', model: skops({ r: false }) }],
    {
      config: {
        enabled: true,
        token: '',
        projectMap: { Tuce: 'Silverken92/tuce' },
        apiBase: 'https://api.github.test',
        cacheMs: 1,
        maxContexts: 20,
      },
      fetchImpl,
      gitInfo: async () => null,
    }
  )

  assert.equal(thread.prState, 'MERGED')
  assert.equal(thread.github.prState, 'MERGED')
  assert.equal(decodeOperationalModel(thread.model).r, false)
})
