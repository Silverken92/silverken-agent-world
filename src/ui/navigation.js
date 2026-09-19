import { normalizeLocale } from './i18n.js'

function safeHttpUrl(value, { githubOnly = false } = {}) {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    if (url.username || url.password) return ''
    if (githubOnly && url.hostname.toLowerCase() !== 'github.com') return ''
    return url.toString()
  } catch {
    return ''
  }
}

function githubRepoUrl(repo) {
  const value = typeof repo === 'string' ? repo.trim() : ''
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) return ''
  const [owner, name] = value.split('/')
  if (owner === '.' || owner === '..' || name === '.' || name === '..') return ''
  return `https://github.com/${owner}/${name}`
}

export function governedNavigation(data, locale = 'en') {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return []
  const fr = normalizeLocale(locale) === 'fr'
  const actions = []

  const operatorUrl = safeHttpUrl(data?.x?.o)
  const operatorThreadId = typeof data?.x?.i === 'string' ? data.x.i : ''
  const taskEvidenceTarget = operatorThreadId.startsWith('agency-agent:')
  if (operatorUrl) {
    actions.push({
      kind: 'operator',
      label: taskEvidenceTarget
        ? (fr ? 'Preuves & trace' : 'Evidence & trace')
        : (fr ? 'Ouvrir dans Operator' : 'Open in Operator'),
      title: taskEvidenceTarget
        ? (fr
            ? 'Ouvrir la fiche Preuves & trace dans l’interface autoritative Agency Agent'
            : 'Open the Evidence & trace drilldown in the authoritative Agency Agent Operator UI')
        : (fr
            ? 'Ouvrir dans l’interface autoritative Agency Agent'
            : 'Open in the authoritative Agency Agent Operator UI'),
      url: operatorUrl,
    })
  }

  const github = data?.h
  const repoUrl = githubRepoUrl(github?.q)
  const prNumber = Math.max(0, Number(github?.n) || 0)
  if (repoUrl && prNumber) {
    actions.push({
      kind: 'pr',
      label: fr ? `Ouvrir la PR #${prNumber}` : `Open PR #${prNumber}`,
      title: fr ? 'Ouvrir la pull request GitHub observée' : 'Open the observed GitHub pull request',
      url: `${repoUrl}/pull/${prNumber}`,
    })
  }
  if (repoUrl) {
    actions.push({
      kind: 'repo',
      label: fr ? 'Ouvrir le dépôt' : 'Open repository',
      title: fr ? 'Ouvrir le dépôt GitHub observé' : 'Open the observed GitHub repository',
      url: repoUrl,
    })
  }

  return actions
    .map((action) => ({ ...action, url: safeHttpUrl(action.url, { githubOnly: action.kind !== 'operator' }) }))
    .filter((action) => action.url)
}

export { githubRepoUrl, safeHttpUrl }
