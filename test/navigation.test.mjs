import test from 'node:test'
import assert from 'node:assert/strict'

import { operatorTaskUrl } from '../server/harnesses/agency-agent.mjs'
import { governedNavigation, githubRepoUrl, operatorProjectOverviewUrl, safeHttpUrl } from '../src/ui/navigation.js'

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

test('governed navigation labels Agency Agent task drilldown as Evidence and trace', () => {
  const data = {
    x: {
      o: 'http://127.0.0.1:8787/ui?project=p&task=t&view=tasks',
      i: 'agency-agent:p:t',
    },
    h: { q: 'Silverken92/silverken-agent-world', n: 12 },
  }

  const fr = governedNavigation(data, 'fr')
  assert.deepEqual(fr.map((item) => item.kind), ['operator', 'pr', 'repo'])
  assert.equal(fr[0].label, 'Preuves & trace')
  assert.match(fr[0].title, /Preuves & trace/)
  assert.equal(fr[1].label, 'Ouvrir la PR #12')
  assert.equal(fr[2].label, 'Ouvrir le dépôt')
  assert.equal(fr[1].url, 'https://github.com/Silverken92/silverken-agent-world/pull/12')

  const en = governedNavigation(data, 'en')
  assert.equal(en[0].label, 'Evidence & trace')
  assert.match(en[0].title, /Evidence & trace/)
  assert.equal(en[1].label, 'Open PR #12')
})

test('profile navigation keeps the generic Operator label', () => {
  const data = {
    x: {
      o: 'http://127.0.0.1:8787/ui?project=p&view=agents',
      i: 'agency-agent-profile:p:agent',
    },
  }

  assert.equal(governedNavigation(data, 'fr')[0].label, 'Ouvrir dans Operator')
  assert.equal(governedNavigation(data, 'en')[0].label, 'Open in Operator')
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


test('project Operator navigation drops task context and targets overview', () => {
  const url = operatorProjectOverviewUrl(
    'http://127.0.0.1:8787/ui?project=prj+one&task=task%2Fone&view=tasks',
  )
  assert.equal(
    url,
    'http://127.0.0.1:8787/ui?project=prj+one&view=overview',
  )
})

test('project Operator navigation keeps URL guards', () => {
  assert.equal(operatorProjectOverviewUrl('javascript:alert(1)'), '')
  assert.equal(operatorProjectOverviewUrl('http://user:pass@127.0.0.1:8787/ui?project=p'), '')
})
