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

export function operationalBadges(data) {
  if (!data || typeof data !== 'object') return []
  const badges = []
  const add = (label, tone = 'neutral', title = '') => {
    if (!label) return
    badges.push({ label, tone, title })
  }

  if (data.m) add(String(data.m), 'model', 'Agency Agent execution model')
  if (data.o) add(`Owner · ${String(data.o)}`, 'agent', 'Task owner agent')
  if (data.a && data.a !== data.o) add(`Live · ${String(data.a)}`, 'agent', 'Most recent agent activity')

  if (Array.isArray(data.v)) {
    const pass = Math.max(0, Number(data.v[0]) || 0)
    const total = Math.max(0, Number(data.v[1]) || 0)
    const fail = Math.max(0, Number(data.v[2]) || 0)
    const unknown = Math.max(0, Number(data.v[3]) || 0)
    const notRun = Math.max(0, Number(data.v[4]) || 0)
    if (total > 0) {
      const tone = fail > 0 ? 'danger' : pass === total ? 'success' : 'pending'
      const detail = [`${pass} pass`]
      if (fail) detail.push(`${fail} fail`)
      if (unknown) detail.push(`${unknown} unknown`)
      if (notRun) detail.push(`${notRun} not run`)
      add(`Verify · ${pass}/${total}`, tone, detail.join(' · '))
    }
  }

  if (data.e) add(`Eval · ${String(data.e)}`, verdictTone(data.e), 'Independent evaluator verdict')
  if (data.g) {
    const blocked = Math.max(0, Number(data.b) || 0)
    const label = blocked ? `SilverGuard · ${String(data.g)} · ${blocked} block` : `SilverGuard · ${String(data.g)}`
    add(label, verdictTone(data.g), 'SilverGuard security disposition')
  }

  if (data.d || data.r !== null) {
    const disposition = data.d ? String(data.d) : data.r ? 'READY' : 'NOT READY'
    add(`Release · ${disposition}`, data.r === true ? 'success' : verdictTone(disposition), 'Agency Agent release gate; not GitHub merge evidence')
  }

  const tokens = compactNumber(data.t)
  if (tokens) add(`${tokens} tok`, 'metric', 'Aggregated task token usage')

  if (data.c && typeof data.c === 'object' && !Array.isArray(data.c)) {
    for (const [currency, amount] of Object.entries(data.c).slice(0, 2)) {
      const number = Number(amount)
      if (!Number.isFinite(number) || number <= 0) continue
      const formatted = number < 0.01 ? number.toFixed(4) : number < 1 ? number.toFixed(3) : number.toFixed(2)
      add(`${String(currency).toUpperCase()} ${formatted}`, 'metric', 'Aggregated task cost reported by Agency Agent')
    }
  }

  return badges
}
