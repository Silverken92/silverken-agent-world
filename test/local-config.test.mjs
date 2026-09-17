import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { applyLocalConfig, loadLocalConfig } from '../server/local-config.mjs'
import { resolveAgencyRepo } from '../tools/agent-world-launcher.mjs'

test('local config maps machine settings to the existing server-side env contract without leaking secrets', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-world-config-'))
  t.after(() => fs.rm(dir, { recursive: true, force: true }))
  const configPath = path.join(dir, 'agent-world.local.json')
  const secret = 'aa_local_secret_value'
  await fs.writeFile(
    configPath,
    JSON.stringify({
      agencyAgent: {
        url: 'http://127.0.0.1:8787/',
        token: secret,
        repoPath: '../agency-agent',
        autoStart: true,
      },
      github: {
        token: 'gh_local_secret_value',
        projects: { Tuce: 'Silverken92/silverken-agent-world' },
        branches: { Tuce: 'main' },
      },
    })
  )

  const env = {}
  const result = await loadLocalConfig({ env, configPath })
  assert.equal(result.loaded, true)
  assert.equal(env.AGENCY_AGENT_URL, 'http://127.0.0.1:8787')
  assert.equal(env.AGENCY_AGENT_TOKEN, secret)
  assert.equal(env.AGENT_WORLD_AGENCY_AGENT_REPO, '../agency-agent')
  assert.equal(env.AGENT_WORLD_AGENCY_AGENT_AUTOSTART, '1')
  assert.equal(env.AGENT_WORLD_GITHUB_PROJECTS, '{"Tuce":"Silverken92/silverken-agent-world"}')
  assert.equal(env.AGENT_WORLD_GITHUB_BRANCHES, '{"Tuce":"main"}')
  assert.equal(result.summary.agencyAgent.tokenConfigured, true)
  assert.equal(result.summary.github.tokenConfigured, true)
  assert.equal(JSON.stringify(result).includes(secret), false)
  assert.equal(JSON.stringify(result).includes('gh_local_secret_value'), false)
})

test('explicit environment variables override machine-local config', () => {
  const env = {
    AGENCY_AGENT_URL: 'http://127.0.0.1:9999',
    AGENCY_AGENT_TOKEN: 'aa_from_env',
    AGENT_WORLD_GITHUB_PROJECTS: '{"Existing":"owner/repo"}',
  }
  applyLocalConfig(
    {
      agencyAgent: {
        url: 'http://127.0.0.1:8787',
        token: 'aa_from_file',
        autoStart: true,
      },
      github: {
        projects: { Tuce: 'Silverken92/silverken-agent-world' },
      },
    },
    env
  )
  assert.equal(env.AGENCY_AGENT_URL, 'http://127.0.0.1:9999')
  assert.equal(env.AGENCY_AGENT_TOKEN, 'aa_from_env')
  assert.equal(env.AGENT_WORLD_GITHUB_PROJECTS, '{"Existing":"owner/repo"}')
})

test('local config rejects embedded credentials and non-http Agency Agent URLs', () => {
  assert.throws(
    () => applyLocalConfig({ agencyAgent: { url: 'http://user:pass@127.0.0.1:8787' } }, {}),
    /http\(s\) URL without embedded credentials/
  )
  assert.throws(
    () => applyLocalConfig({ agencyAgent: { url: 'file:///tmp/operator' } }, {}),
    /http\(s\) URL without embedded credentials/
  )
})

test('launcher resolves relative Agency Agent repo paths from the Agent World repository root', () => {
  const resolved = resolveAgencyRepo('../agency-agent')
  assert.equal(path.basename(resolved), 'agency-agent')
  assert.equal(path.isAbsolute(resolved), true)
})
