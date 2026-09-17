import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LOCALE_STORAGE_KEY,
  getLocale,
  setLocale,
  t,
  translateLiteral,
  translateRelativeTime,
} from '../src/ui/i18n.js'
import { operationalBadges } from '../src/ui/operational.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
  }
}

test('locale follows the browser on first use and stored preference wins afterwards', () => {
  const storage = memoryStorage()
  assert.equal(getLocale({ storage, navigatorLanguage: 'fr-FR' }), 'fr')
  assert.equal(getLocale({ storage, navigatorLanguage: 'en-US' }), 'en')

  assert.equal(setLocale('fr', { storage }), 'fr')
  assert.equal(storage.getItem(LOCALE_STORAGE_KEY), 'fr')
  assert.equal(getLocale({ storage, navigatorLanguage: 'en-US' }), 'fr')
})

test('known HUD literals switch reversibly between English and French', () => {
  assert.equal(translateLiteral('Settings', 'fr'), 'Paramètres')
  assert.equal(translateLiteral('Paramètres', 'en'), 'Settings')
  assert.equal(translateLiteral('Quality preset', 'fr'), 'Préréglage qualité')
  assert.equal(translateLiteral('Unknown project title', 'fr'), 'Unknown project title')
})

test('relative activity times switch reversibly between English and French', () => {
  assert.equal(translateRelativeTime('just now', 'fr'), 'à l’instant')
  assert.equal(translateRelativeTime('9m ago', 'fr'), 'il y a 9 min')
  assert.equal(translateRelativeTime('il y a 2 h', 'en'), '2h ago')
  assert.equal(translateRelativeTime('jamais', 'en'), 'never')
})

test('French catalog covers the SilverKen governed-view vocabulary', () => {
  assert.equal(t('governedView', 'fr'), 'Vue gouvernée')
  assert.equal(t('readOnly', 'fr'), 'Lecture seule')
  assert.equal(t('owner', 'fr'), 'Responsable')
  assert.equal(t('release', 'fr'), 'Livraison')
})

test('Agency Agent operational badges can be rendered in French without changing evidence semantics', () => {
  const badges = operationalBadges(
    {
      m: 'SINGLE_AGENT',
      o: 'Orchestrator',
      a: 'Reviewer',
      v: [3, 4, 1, 0, 0],
      e: 'PASS',
      g: 'BLOCKED',
      b: 1,
      r: false,
      d: 'NOT READY',
      t: 12400,
      c: { usd: 0.043 },
    },
    'fr'
  )

  const labels = badges.map((badge) => badge.label)
  assert.ok(labels.includes('Responsable · Orchestrator'))
  assert.ok(labels.includes('Actif · Reviewer'))
  assert.ok(labels.includes('Vérif. · 3/4'))
  assert.ok(labels.includes('Éval. · RÉUSSI'))
  assert.ok(labels.includes('SilverGuard · BLOQUÉ · 1 blocage'))
  assert.ok(labels.includes('Livraison · NON PRÊT'))
  assert.ok(labels.includes('12k jet.'))
  assert.ok(labels.includes('USD 0.043'))
})
