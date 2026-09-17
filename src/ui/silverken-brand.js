import './operational.css'
import './navigation.css'
import './governed-actions.css'
import { getLocale, setLocale, t, translateLiteral, translateRelativeTime } from './i18n.js'
import { decodeOperationalModel, operationalBadges } from './operational.js'
import { governedNavigation } from './navigation.js'
import { renderGovernedAction } from './governed-actions.js'

const BRAND_NAME = 'SilverKen Agent World'
let currentLocale = getLocale()

function statLabels(locale = currentLocale) {
  return {
    working: [t('active', locale), locale === 'fr' ? 'Aller au prochain astronaute actif' : 'Jump to the next active astronaut'],
    waiting: [t('needsInput', locale), locale === 'fr' ? 'Aller au prochain astronaute en attente' : 'Jump to the next astronaut needing input'],
    blocked: [t('failed', locale), locale === 'fr' ? 'Aller au prochain astronaute en échec ou bloqué' : 'Jump to the next failed or blocked astronaut'],
    celebrating: [t('released', locale), locale === 'fr' ? 'Aller au prochain astronaute livré' : 'Jump to the next released astronaut'],
    agents: [t('agents', locale), locale === 'fr' ? 'Aller au prochain astronaute' : 'Jump to the next astronaut'],
  }
}

const STAT_LABELS = statLabels('en')

function replaceButtonText(button, text) {
  if (!button) return
  const next = ` ${text}`
  const node = [...button.childNodes].find((child) => child.nodeType === Node.TEXT_NODE)
  if (node) {
    if (node.textContent !== next) node.textContent = next
  } else {
    button.append(next)
  }
}

function localizeStaticText(root, locale) {
  if (!root) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (const node of nodes) {
    const next = translateLiteral(node.nodeValue, locale)
    if (next !== node.nodeValue) node.nodeValue = next
  }
  for (const el of root.querySelectorAll('[title]')) {
    const next = translateLiteral(el.title, locale)
    if (next !== el.title) el.title = next
  }
}

function localizeRelativeTimes(root, locale) {
  for (const el of root.querySelectorAll('.when, .thread-pop .meta > span:not(.tag)')) {
    const next = translateRelativeTime(el.textContent, locale)
    if (next !== el.textContent) el.textContent = next
  }
}

function setTitle(root, selector, en, fr) {
  const el = root.querySelector(selector)
  if (!el) return
  const next = currentLocale === 'fr' ? fr : en
  if (el.title !== next) el.title = next
}

function ensureLanguageControl(root) {
  const brandbar = root.querySelector('.side .brandbar')
  if (!brandbar) return
  let wrap = brandbar.querySelector('.sk-language')
  if (!wrap) {
    wrap = document.createElement('label')
    wrap.className = 'sk-language'
    wrap.innerHTML = '<span class="sr-only">Language</span><select aria-label="Language"><option value="fr">FR</option><option value="en">EN</option></select>'
    const firstAction = brandbar.querySelector('button')
    brandbar.insertBefore(wrap, firstAction)
    wrap.querySelector('select').addEventListener('change', (event) => {
      currentLocale = setLocale(event.target.value)
      applyBrand(document)
    })
  }
  const select = wrap.querySelector('select')
  if (select.value !== currentLocale) select.value = currentLocale
  wrap.querySelector('span').textContent = t('language', currentLocale)
  select.setAttribute('aria-label', t('language', currentLocale))
}

function renderNavigation(card, data) {
  const actions = governedNavigation(data, currentLocale)
  let nav = card.querySelector('.sk-nav')
  if (!actions.length) {
    nav?.remove()
    return
  }
  if (!nav) {
    nav = document.createElement('div')
    nav.className = 'sk-nav'
    const pair = card.querySelector('.pair')
    if (pair) pair.insertAdjacentElement('beforebegin', nav)
    else card.appendChild(nav)
  }
  nav.replaceChildren()
  for (const action of actions) {
    const link = document.createElement('a')
    link.className = `btn sk-nav-link ${action.kind}`
    link.href = action.url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.textContent = action.label
    link.title = action.title
    nav.appendChild(link)
  }
}

function applyOperationalBadges(root = document) {
  for (const card of root.querySelectorAll('.thread-pop')) {
    const meta = card.querySelector('.meta')
    if (!meta) continue

    const rawTag = [...meta.querySelectorAll('.tag')].find((tag) => decodeOperationalModel(tag.textContent || ''))
    if (rawTag) {
      card.dataset.skops = rawTag.textContent || ''
      rawTag.remove()
      card.dataset.skRenderKey = ''
    } else if (card.dataset.skops && !meta.querySelector('.sk-op')) {
      delete card.dataset.skops
      delete card.dataset.skRenderKey
      card.querySelector('.sk-nav')?.remove()
      card.querySelector('.sk-governed-actions')?.remove()
      continue
    }

    const encoded = card.dataset.skops || ''
    const data = decodeOperationalModel(encoded)
    if (!data) continue
    const renderKey = `${currentLocale}|${encoded}`
    if (card.dataset.skRenderKey === renderKey) continue

    meta.querySelectorAll('.sk-op').forEach((node) => node.remove())
    const badges = operationalBadges(data, currentLocale)
    for (const badge of badges) {
      const el = document.createElement('span')
      el.className = `tag sk-op ${badge.tone}`
      el.textContent = badge.label
      if (badge.title) el.title = badge.title
      meta.appendChild(el)
    }
    renderNavigation(card, data)
    renderGovernedAction(card, data, currentLocale)
    card.dataset.skRenderKey = renderKey
  }
}

function applyBrand(root = document) {
  document.documentElement.lang = currentLocale

  const brand = root.querySelector('.side .brand')
  if (brand && !brand.querySelector('.sk-mark')) {
    brand.innerHTML =
      '<span class="sk-mark" aria-hidden="true">SK</span>' +
      '<span class="sk-brand-copy"><strong>SilverKen</strong><small>Agent World</small></span>'
    brand.setAttribute('aria-label', BRAND_NAME)
  }

  ensureLanguageControl(root)

  const brandbar = root.querySelector('.side .brandbar')
  if (brandbar && !root.querySelector('.sk-systembar')) {
    brandbar.insertAdjacentHTML(
      'afterend',
      '<div class="sk-systembar"><i class="sk-live" aria-hidden="true"></i><span></span><strong></strong></div>'
    )
  }
  const systembar = root.querySelector('.sk-systembar')
  if (systembar) {
    systembar.querySelector('span').textContent = t('governedView', currentLocale)
    systembar.querySelector('strong').textContent = currentLocale === 'fr' ? 'ACTIONS GOUVERNÉES' : 'GOVERNED ACTIONS'
  }

  const bootTitle = root.querySelector('.boot h1')
  if (bootTitle && bootTitle.textContent !== BRAND_NAME) bootTitle.textContent = BRAND_NAME

  const helpTitle = root.querySelector('.help h2')
  if (helpTitle && helpTitle.textContent !== BRAND_NAME) helpTitle.textContent = BRAND_NAME

  const helpSub = root.querySelector('.help .sub')
  if (helpSub) {
    helpSub.dataset.silverken = 'true'
    helpSub.textContent = t('helpSummary', currentLocale)
    let note = root.querySelector('.sk-governance-note')
    if (!note) {
      note = document.createElement('div')
      note.className = 'sk-governance-note'
      helpSub.insertAdjacentElement('afterend', note)
    }
    note.textContent = currentLocale === 'fr'
      ? 'Agent World observe les systèmes sources et peut enregistrer des demandes gouvernées ; Agency Agent reste l’autorité d’exécution.'
      : 'Agent World observes source systems and may record governed requests; Agency Agent remains the execution authority.'
  }

  const labels = statLabels(currentLocale)
  for (const [key, [label, title]] of Object.entries(labels)) {
    const stat = root.querySelector(`.stat[data-key="${key}"]`)
    if (!stat) continue
    const labelNode = stat.querySelector('.lbl')
    if (labelNode && labelNode.textContent !== label) labelNode.textContent = label
    if (stat.title !== title) stat.title = title
  }

  const projectsHeading = root.querySelector('.projects-pane .sec-head span')
  if (projectsHeading) {
    const text = projectsHeading.textContent.trim()
    const count = text.match(/^(\d+)\s+(?:repos?|projects?|projets?)$/i)?.[1]
    const next = count
      ? `${count} ${Number(count) === 1 ? t('project', currentLocale) : t('projects', currentLocale)}`
      : t('projects', currentLocale)
    if (projectsHeading.textContent !== next) projectsHeading.textContent = next
  }

  const hiddenLabel = root.querySelector('#btn-hidden-toggle .label')
  if (hiddenLabel) {
    const count = hiddenLabel.textContent.match(/(\d+)/)?.[1] || '0'
    const next = currentLocale === 'fr' ? `${count} masqué${count === '1' ? '' : 's'}` : `${count} hidden`
    if (hiddenLabel.textContent !== next) hiddenLabel.textContent = next
  }

  replaceButtonText(root.querySelector('#btn-close-project'), t('allProjects', currentLocale))
  replaceButtonText(root.querySelector('#btn-new-session'), t('newSession', currentLocale))
  replaceButtonText(root.querySelector('#btn-copy-path'), t('copyPath', currentLocale))
  replaceButtonText(root.querySelector('#btn-hide-project'), t('hideProject', currentLocale))
  replaceButtonText(root.querySelector('#btn-open'), t('open', currentLocale))
  replaceButtonText(root.querySelector('#btn-viewed'), t('viewed', currentLocale))
  replaceButtonText(root.querySelector('#btn-archive'), t('archive', currentLocale))

  const settingsHeader = root.querySelector('.settings > header')
  if (settingsHeader) {
    const node = [...settingsHeader.childNodes].find((child) => child.nodeType === Node.TEXT_NODE)
    const next = `${t('settings', currentLocale)} `
    if (node && node.textContent !== next) node.textContent = next
  }

  const hideProject = root.querySelector('#btn-hide-project')
  if (hideProject) {
    hideProject.title = currentLocale === 'fr'
      ? 'Masquer ce projet dans Agent World sans modifier son système source'
      : 'Hide this project from Agent World without modifying its source system'
  }

  const shot = root.querySelector('#btn-shot')
  if (shot) shot.title = currentLocale === 'fr' ? 'Capturer Agent World (P)' : 'Capture Agent World (P)'

  setTitle(root, '#btn-help', 'Help (?)', 'Aide (?)')
  setTitle(root, '#btn-hide', 'Hide all UI (H)', 'Masquer toute l’interface (H)')
  setTitle(root, '#btn-settings', 'Settings (S)', 'Paramètres (S)')
  setTitle(root, '#btn-close-settings', 'Close', 'Fermer')
  setTitle(root, '#btn-home', 'Reset the view (0)', 'Réinitialiser la vue (0)')
  setTitle(root, '#btn-next', 'Next astronaut waiting on you (N)', 'Prochain astronaute en attente (N)')
  setTitle(root, '#btn-orbit', 'Orbit mode — sweep around the colony (O)', 'Mode orbite — tourner autour de la colonie (O)')
  setTitle(root, '#btn-planet', 'Change planet (Tab)', 'Changer de planète (Tab)')
  setTitle(root, '#btn-time', 'Change the time of day (L)', 'Changer l’heure de la journée (L)')
  setTitle(root, '#btn-locate', 'Fly to this zone', 'Aller à cette zone')
  setTitle(root, '#btn-copy-path', 'Copy the folder path', 'Copier le chemin du dossier')
  setTitle(root, '#btn-deselect', 'Deselect (Esc)', 'Désélectionner (Échap)')
  setTitle(root, '#btn-open', 'Open this thread in the harness it came from (Enter)', 'Ouvrir cette session dans son outil d’origine (Entrée)')
  setTitle(root, '#btn-viewed', 'Stop this thread asking for you until it moves on again (V)', 'Marquer comme vu jusqu’à la prochaine activité (V)')
  setTitle(root, '#btn-archive', 'Archive — this astronaut walks back to the ship (A)', 'Archiver — cet astronaute retourne au vaisseau (A)')

  localizeStaticText(root.querySelector('.settings .body'), currentLocale)
  localizeStaticText(root.querySelector('.help .cols'), currentLocale)
  localizeStaticText(root.querySelector('.help .legend-row')?.parentElement, currentLocale)
  localizeRelativeTimes(root, currentLocale)
  applyOperationalBadges(root)
}

let scheduled = false
function scheduleBrand() {
  if (scheduled) return
  scheduled = true
  queueMicrotask(() => {
    scheduled = false
    applyBrand(document)
  })
}

applyBrand(document)

const app = document.getElementById('app')
if (app) {
  const observer = new MutationObserver(scheduleBrand)
  observer.observe(app, { childList: true, subtree: true, characterData: true })
}

export { BRAND_NAME, STAT_LABELS, applyBrand, applyOperationalBadges, statLabels }
