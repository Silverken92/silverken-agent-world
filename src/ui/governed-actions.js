const ACTIONS = {
  HUMAN: 'REQUEST_HUMAN_REVIEW',
  RISK: 'REQUEST_RISK_REVIEW',
  VERIFY: 'REQUEST_VERIFICATION_RETRY',
}

const governedActionStates = new Map()

function actionForStatus(status) {
  if (status === 'RISK_ACCEPTANCE_REQUIRED') return ACTIONS.RISK
  if (status === 'FAILED_VERIFICATION') return ACTIONS.VERIFY
  return ACTIONS.HUMAN
}

function copyFor(action, locale = 'en') {
  const fr = locale === 'fr'
  if (action === ACTIONS.RISK) {
    return {
      label: fr ? 'Demander revue risque' : 'Request risk review',
      prompt: fr ? 'Pourquoi une revue du risque est-elle demandée ?' : 'Why is a risk review requested?',
      defaultRationale: fr ? 'Revue du risque demandée depuis Agent World' : 'Risk review requested from Agent World',
    }
  }
  if (action === ACTIONS.VERIFY) {
    return {
      label: fr ? 'Demander nouvelle vérification' : 'Request verification retry',
      prompt: fr ? 'Pourquoi faut-il relancer la vérification ?' : 'Why should verification be retried?',
      defaultRationale: fr ? 'Nouvelle vérification demandée depuis Agent World' : 'Verification retry requested from Agent World',
    }
  }
  return {
    label: fr ? 'Demander une revue' : 'Request human review',
    prompt: fr ? 'Pourquoi une revue humaine est-elle demandée ?' : 'Why is a human review requested?',
    defaultRationale: fr ? 'Revue humaine demandée depuis Agent World' : 'Human review requested from Agent World',
  }
}

function governedActionModel(data, locale = 'en') {
  const threadId = typeof data?.x?.i === 'string' ? data.x.i : ''
  if (!threadId.startsWith('agency-agent:')) return null
  const status = typeof data?.x?.s === 'string' ? data.x.s : ''
  const action = actionForStatus(status)
  return { threadId, status, action, ...copyFor(action, locale) }
}

function governedActionKey(model) {
  return `${model?.threadId || ''}\u0000${model?.action || ''}`
}

function governedActionState(model) {
  return governedActionStates.get(governedActionKey(model)) || ''
}

function setGovernedActionState(model, state) {
  const key = governedActionKey(model)
  if (!model?.threadId || !model?.action) return
  if (state) governedActionStates.set(key, state)
  else governedActionStates.delete(key)
}

function clearGovernedActionStates() {
  governedActionStates.clear()
}

function actionStateCopy(state, locale, model) {
  if (state === 'pending') return locale === 'fr' ? 'Enregistrement…' : 'Recording…'
  if (state === 'recorded') return locale === 'fr' ? 'Demande enregistrée ✓' : 'Request recorded ✓'
  return model.label
}

async function submitGovernedAction(model, rationale, fetchImpl = fetch) {
  const response = await fetchImpl('/api/governed-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      threadId: model.threadId,
      action: model.action,
      rationale,
    }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || body.ok !== true) {
    throw new Error(body.error || `Governed action failed (${response.status})`)
  }
  return body.request
}

function renderGovernedAction(card, data, locale = 'en') {
  const model = governedActionModel(data, locale)
  let wrap = card.querySelector('.sk-governed-actions')
  if (!model) {
    wrap?.remove()
    return
  }

  if (!wrap) {
    wrap = document.createElement('div')
    wrap.className = 'sk-governed-actions'
    const pair = card.querySelector('.pair')
    if (pair) pair.insertAdjacentElement('beforebegin', wrap)
    else card.appendChild(wrap)
  }
  wrap.replaceChildren()

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'btn sk-governed-action'
  const initialState = governedActionState(model)
  button.disabled = initialState === 'pending' || initialState === 'recorded'
  button.textContent = actionStateCopy(initialState, locale, model)
  button.title = locale === 'fr'
    ? 'Enregistre une demande gouvernée dans Agency Agent ; aucune action sensible n’est exécutée directement'
    : 'Records a governed request in Agency Agent; no sensitive action is executed directly'
  button.addEventListener('click', async () => {
    const rationale = window.prompt(model.prompt, model.defaultRationale)
    if (rationale === null) return
    const clean = rationale.trim()
    if (clean.length < 3) {
      window.alert(locale === 'fr' ? 'Une raison est requise.' : 'A rationale is required.')
      return
    }

    setGovernedActionState(model, 'pending')
    button.disabled = true
    button.textContent = actionStateCopy('pending', locale, model)
    try {
      await submitGovernedAction(model, clean)
      setGovernedActionState(model, 'recorded')
      button.textContent = actionStateCopy('recorded', locale, model)
    } catch (error) {
      setGovernedActionState(model, '')
      button.disabled = false
      button.textContent = model.label
      window.alert(error.message)
    }
  })
  wrap.appendChild(button)
}

export {
  ACTIONS,
  actionForStatus,
  actionStateCopy,
  clearGovernedActionStates,
  copyFor,
  governedActionModel,
  governedActionState,
  renderGovernedAction,
  setGovernedActionState,
  submitGovernedAction,
}
