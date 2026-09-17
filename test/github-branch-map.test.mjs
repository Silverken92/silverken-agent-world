import assert from 'node:assert/strict'
import test from 'node:test'

import { githubConfig, resolveGitHubTarget } from '../server/github-enrichment.mjs'

test('GitHub branch mappings are parsed from environment without changing repository mappings', () => {
  const config = githubConfig({
    AGENT_WORLD_GITHUB_PROJECTS: '{"Tuce":"Silverken92/silverken-agent-world"}',
    AGENT_WORLD_GITHUB_BRANCHES: '{"Tuce":"smoke/aw5b-live"}',
  })

  assert.equal(config.enabled, true)
  assert.deepEqual(config.projectMap, { Tuce: 'Silverken92/silverken-agent-world' })
  assert.deepEqual(config.branchMap, { Tuce: 'smoke/aw5b-live' })
})

test('Agency Agent project without local branch can use an explicit GitHub branch mapping', async () => {
  const target = await resolveGitHubTarget(
    { project: 'Tuce', gitBranch: '', projectPath: '', cwd: '' },
    {
      projectMap: { Tuce: 'Silverken92/silverken-agent-world' },
      branchMap: { Tuce: 'smoke/aw5b-live' },
      gitInfo: async () => null,
    }
  )

  assert.deepEqual(target, {
    repo: 'Silverken92/silverken-agent-world',
    branch: 'smoke/aw5b-live',
  })
})

test('thread branch evidence takes precedence over the explicit branch mapping', async () => {
  const target = await resolveGitHubTarget(
    { project: 'tuce', gitBranch: 'feat/real-work', projectPath: '', cwd: '' },
    {
      projectMap: { Tuce: 'Silverken92/silverken-agent-world' },
      branchMap: { Tuce: 'smoke/aw5b-live' },
      gitInfo: async () => null,
    }
  )

  assert.deepEqual(target, {
    repo: 'Silverken92/silverken-agent-world',
    branch: 'feat/real-work',
  })
})
