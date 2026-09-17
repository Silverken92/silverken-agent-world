import test from 'node:test'
import assert from 'node:assert/strict'

import { operatorTaskUrl } from '../server/harnesses/agency-agent.mjs'
import { governedNavigation, githubRepoUrl, safeHttpUrl } from '../src/ui/navigation.js'

function preserveUrl(t) {
  const previous = process.env.AGENCY_AGENT_URL
  t.after(() => {
    if (previous === undefined) delete process.env.AGENCY_AGENT_URL
    else process.env.AGENCY_AGENT_URL = previous
  })
}

test('Agency Agent Operator deep link contains task context but no credential', (t) => {
  preserveUrl(t)
  process.env.AGENCY_AGENT_URL = 'http://127.0.0.1:8787'
  process.env.AGENCY_AGENT_TOKEN = 'aa_secret_that_must_not_appear'

  const url = operatorTaskUrl('prj one', 'task/one')
  assert.equal(
    url,
    'http://127.0.0.1:8787/ui?project=prj+one&task=task%2Fone&view=tasks',
  )
  assert.equal(url.includes('aa_secret'), false)
})

test('Operator navigation rejects credential-bearing base URLs', (t) => {
  preserveUrl(t)
  process.env.AGENCY_AGENT_URL = 'http://user:pass@127.0.0.1:8787'
  assert.equal(operatorTaskUrl('project', 'task'), '')
})

test('governed navigation builds bilingual read-only Operator and GitHub links', () => {
  const data = {
    x: { o: 'http://127.0.0.1:8787/ui?project=p&task=t&view=tasks' },
    h: { q: 'Silverken92/silverken-agent-world', n: 12 },
  }

  const fr = governedNavigation(data, 'fr')
  assert.deepEqual(fr.map((item) => item.kind), ['operator', 'pr', 'repo'])
  assert.equal(fr[0].label, 'Ouvrir dans Operator')
  assert.equal(fr[1].label, 'Ouvrir la PR #12')
  assert.equal(fr[2].label, 'Ouvrir le dépôt')
  assert.equal(fr[1].url, 'https://github.com/Silverken92/silverken-agent-world/pull/12')

  const en = governedNavigation(data, 'en')
  assert.equal(en[0].label, 'Open in Operator')
  assert.equal(en[1].label, 'Open PR #12')
})

test('navigation URL guards reject executable schemes and malformed repositories', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), '')
  assert.equal(safeHttpUrl('https://evil.example/repo', { githubOnly: true }), '')
  assert.equal(githubRepoUrl('../escape'), '')
  assert.equal(githubRepoUrl('Silverken92/silverken-agent-world'), 'https://github.com/Silverken92/silverken-agent-world')

  const actions = governedNavigation({
    x: { o: 'javascript:alert(1)' },
    h: { q: '../escape', n: 99 },
  }, 'fr')
  assert.deepEqual(actions, [])
})
