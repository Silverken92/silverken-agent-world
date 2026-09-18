import { normalizeLocale, t } from './i18n.js'

export const OPS_MODEL_PREFIX = 'SKOPS:'

export function decodeOperationalModel(value) {
  if (typeof value !== 'string' || !value.startsWith(OPS_MODEL_PREFIX)) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(value.slice(OPS_MODEL_PREFIX.length)))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function compactNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return ''
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(number >= 10_000_000 ? 0 : 1)}m`
  if (number >= 1_000) return `${(number / 1_000).toFixed(number >= 10_000 ? 0 : 1)}k`
  return String(Math.round(number))
}

function verdictTone(value) {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'PASS' || normalized === 'READY' || normalized === 'APPROVED') return 'success'
  if (normalized === 'FAIL' || normalized === 'BLOCKED' || normalized === 'REJECTED') return 'danger'
  return 'pending'
}

function verdictLabel(value, locale) {
  const normalized = String(value || '').toUpperCase()
  if (normalizeLocale(locale) !== 'fr') return String(value || '')
  const labels = {
    PASS: 'RÉUSSI',
    FAIL: 'ÉCHEC',
    READY: 'PRÊT',
    APPROVED: 'APPROUVÉ',
    BLOCKED: 'BLOQUÉ',
    REJECTED: 'REJETÉ',
    'NOT READY': 'NON PRÊT',
  }
  return labels[normalized] || String(value || '')
}

function governedRequestLabel(value, locale) {
  const normalized = String(value || '').toUpperCase()
  if (normalizeLocale(locale) !== 'fr') {
    const labels = { RECORDED: 'RECORDED', ACKNOWLEDGED: 'ACKNOWLEDGED', RESOLVED: 'RESOLVED' }
    return labels[normalized] || normalized
  }
  const labels = {
    RECORDED: 'ENREGISTRÉE',
    ACKNOWLEDGED: 'PRISE EN COMPTE',
    RESOLVED: 'RÉSOLUE',
  }
  return labels[normalized] || normalized
}

function governedRequestTone(value) {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'RESOLVED') return 'success'
  if (normalized === 'ACKNOWLEDGED') return 'agent'
  return 'pending'
}

function githubPrLabel(value, locale) {
  const normalized = String(value || '').toUpperCase()
  if (normalizeLocale(locale) !== 'fr') return normalized
  const labels = { OPEN: 'OUVERTE', CLOSED: 'FERMÉE', MERGED: 'FUSIONNÉE' }
  return labels[normalized] || normalized
}

function githubPrTone(value) {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'MERGED') return 'success'
  if (normalized === 'CLOSED') return 'danger'
  return 'pending'
}

function githubCiLabel(value, locale) {
  const normalized = String(value || '').toUpperCase()
  if (normalizeLocale(locale) !== 'fr') return normalized
  const labels = { PASS: 'OK', FAIL: 'ÉCHEC', PENDING: 'EN COURS', NONE: 'AUCUN' }
  return labels[normalized] || normalized
}

function githubCiTone(value) {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'PASS') return 'success'
  if (normalized === 'FAIL') return 'danger'
  return normalized === 'NONE' ? 'neutral' : 'pending'
}

function githubBadges(data, locale) {
  const github = data?.h
  if (!github || typeof github !== 'object' || Array.isArray(github)) return []
  const fr = normalizeLocale(locale) === 'fr'
  const badges = []
  const repo = String(github.q || '').trim()
  const number = Number(github.n) || 0
  const prState = String(github.s || '').trim().toUpperCase()
  const ciState = String(github.c || 'NONE').trim().toUpperCase()
  const passed = Math.max(0, Number(github.p) || 0)
  const failed = Math.max(0, Number(github.f) || 0)
  const pending = Math.max(0, Number(github.w) || 0)
  const total = Math.max(0, Number(github.t) || 0)

  if (repo) {
    badges.push({
      label: `GitHub · ${repo}`,
      tone: 'neutral',
      title: fr ? 'Dépôt GitHub observé en lecture seule' : 'Read-only observed GitHub repository',
    })
  }
  if (number && prState) {
    badges.push({
      label: `PR #${number} · ${githubPrLabel(prState, locale)}`,
      tone: githubPrTone(prState),
      title: fr
        ? 'État réel de la pull request GitHub ; distinct de la porte de livraison Agency Agent'
        : 'Actual GitHub pull request state; separate from the Agency Agent release gate',
    })
  }
  if (ciState !== 'NONE' || total > 0) {
    const ratio = total > 0 ? ` · ${passed}/${total}` : ''
    const detail = fr
      ? `${passed} réussi · ${failed} échec · ${pending} en cours`
      : `${passed} passed · ${failed} failed · ${pending} pending`
    badges.push({
      label: `CI · ${githubCiLabel(ciState, locale)}${ratio}`,
      tone: githubCiTone(ciState),
      title: detail,
    })
  }
  return badges
}

export function operationalBadges(data, locale = 'en') {
  if (!data || typeof data !== 'object') return []
  const lang = normalizeLocale(locale)
  const fr = lang === 'fr'
  const badges = []
  const add = (label, tone = 'neutral', title = '') => {
    if (!label) return
    badges.push({ label, tone, title })
  }

  if (data.m) add(String(data.m), 'model', fr ? 'Modèle d’exécution Agency Agent' : 'Agency Agent execution model')
  const missionAgent = Array.isArray(data.p) ? String(data.p[0] || '').trim() : ''
  if (missionAgent) {
    add(
      `Mission · ${missionAgent}`,
      'agent',
      fr
        ? 'Mission explicitement rattachée à cet agent persistant'
        : 'Mission explicitly assigned to this persistent agent'
    )
  } else if (data.o) {
    add(`${t('owner', lang)} · ${String(data.o)}`, 'agent', fr ? 'Agent responsable de la tâche' : 'Task owner agent')
  }
  if (data.a && data.a !== data.o) add(`${t('live', lang)} · ${String(data.a)}`, 'agent', fr ? 'Dernière activité d’un agent' : 'Most recent agent activity')

  if (Array.isArray(data.v)) {
    const pass = Math.max(0, Number(data.v[0]) || 0)
    const total = Math.max(0, Number(data.v[1]) || 0)
    const fail = Math.max(0, Number(data.v[2]) || 0)
    const unknown = Math.max(0, Number(data.v[3]) || 0)
    const notRun = Math.max(0, Number(data.v[4]) || 0)
    if (total > 0) {
      const tone = fail > 0 ? 'danger' : pass === total ? 'success' : 'pending'
      const detail = [fr ? `${pass} réussi${pass > 1 ? 's' : ''}` : `${pass} pass`]
      if (fail) detail.push(fr ? `${fail} échec${fail > 1 ? 's' : ''}` : `${fail} fail`)
      if (unknown) detail.push(fr ? `${unknown} inconnu${unknown > 1 ? 's' : ''}` : `${unknown} unknown`)
      if (notRun) detail.push(fr ? `${notRun} non exécuté${notRun > 1 ? 's' : ''}` : `${notRun} not run`)
      add(`${t('verify', lang)} · ${pass}/${total}`, tone, detail.join(' · '))
    }
  }

  if (data.e) add(`${t('evaluator', lang)} · ${verdictLabel(data.e, lang)}`, verdictTone(data.e), fr ? 'Verdict de l’évaluateur indépendant' : 'Independent evaluator verdict')
  if (data.g) {
    const blocked = Math.max(0, Number(data.b) || 0)
    const verdict = verdictLabel(data.g, lang)
    const blockLabel = fr ? `${blocked} blocage${blocked > 1 ? 's' : ''}` : `${blocked} block`
    const label = blocked ? `SilverGuard · ${verdict} · ${blockLabel}` : `SilverGuard · ${verdict}`
    add(label, verdictTone(data.g), fr ? 'Décision de sécurité SilverGuard' : 'SilverGuard security disposition')
  }

  if (data.d || data.r !== null) {
    const disposition = data.d ? String(data.d) : data.r ? 'READY' : 'NOT READY'
    add(
      `${t('release', lang)} · ${verdictLabel(disposition, lang)}`,
      data.r === true ? 'success' : verdictTone(disposition),
      fr ? 'Porte de livraison Agency Agent ; ne constitue pas une preuve de fusion GitHub' : 'Agency Agent release gate; not GitHub merge evidence'
    )
  }

  if (Array.isArray(data.q) && data.q.length >= 2) {
    const requestStatus = String(data.q[0] || '').toUpperCase()
    const requestAction = String(data.q[1] || '')
    if (requestStatus) {
      add(
        `${fr ? 'Demande' : 'Request'} · ${governedRequestLabel(requestStatus, lang)}`,
        governedRequestTone(requestStatus),
        fr
          ? `${requestAction} · état du suivi humain dans Agency Agent ; ne prouve pas l’exécution de l’action`
          : `${requestAction} · human follow-up state in Agency Agent; does not prove action execution`
      )
    }
  }

  badges.push(...githubBadges(data, lang))

  const tokens = compactNumber(data.t)
  if (tokens) add(`${tokens} ${t('tokens', lang)}`, 'metric', fr ? 'Utilisation agrégée des jetons de la tâche' : 'Aggregated task token usage')

  if (data.c && typeof data.c === 'object' && !Array.isArray(data.c)) {
    for (const [currency, amount] of Object.entries(data.c).slice(0, 2)) {
      const number = Number(amount)
      if (!Number.isFinite(number) || number <= 0) continue
      const formatted = number < 0.01 ? number.toFixed(4) : number < 1 ? number.toFixed(3) : number.toFixed(2)
      add(`${String(currency).toUpperCase()} ${formatted}`, 'metric', fr ? 'Coût agrégé communiqué par Agency Agent' : 'Aggregated task cost reported by Agency Agent')
    }
  }

  return badges
}
