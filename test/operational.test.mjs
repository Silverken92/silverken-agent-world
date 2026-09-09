import test from 'node:test'
import assert from 'node:assert/strict'

import { decodeOperationalModel, operationalBadges } from '../src/ui/operational.js'

function encoded(value) {
  return `SKOPS:${encodeURIComponent(JSON.stringify(value))}`
}

test('operational model decoder accepts only valid SilverKen payloads', () => {
  const value = { m: 'ORCHESTRATED', o: 'Orchestrator', t: 1200 }
  assert.deepEqual(decodeOperationalModel(encoded(value)), value)
  assert.equal(decodeOperationalModel('claude-sonnet'), null)
  assert.equal(decodeOperationalModel('SKOPS:%7Bbroken'), null)
})

test('operational badges summarize governed evidence without implying GitHub merge', () => {
  const badges = operationalBadges({
    m: 'ORCHESTRATED',
    o: 'Orchestrator',
    a: 'SilverGuard',
    v: [3, 4, 0, 1, 0],
    e: 'PASS',
    g: 'PASS',
    b: 0,
    r: true,
    d: 'READY',
    t: 12345,
    c: { USD: 0.0425 },
  })

  assert.deepEqual(
    badges.map((item) => item.label),
    [
      'ORCHESTRATED',
      'Owner · Orchestrator',
      'Live · SilverGuard',
      'Verify · 3/4',
      'Eval · PASS',
      'SilverGuard · PASS',
      'Release · READY',
      '12k tok',
      'USD 0.043',
    ]
  )
  assert.equal(badges.find((item) => item.label === 'Release · READY').title.includes('not GitHub merge'), true)
})

test('operational badges make failures visually explicit', () => {
  const badges = operationalBadges({
    v: [1, 3, 1, 1, 0],
    e: 'FAIL',
    g: 'FAIL',
    b: 2,
    r: false,
    d: 'BLOCKED',
  })

  assert.equal(badges.find((item) => item.label === 'Verify · 1/3').tone, 'danger')
  assert.equal(badges.find((item) => item.label === 'Eval · FAIL').tone, 'danger')
  assert.equal(badges.find((item) => item.label === 'SilverGuard · FAIL · 2 block').tone, 'danger')
  assert.equal(badges.find((item) => item.label === 'Release · BLOCKED').tone, 'danger')
})
