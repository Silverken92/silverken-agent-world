import { decodeOperationalModel, operationalBadges } from './operational.js'

const BRAND_NAME = 'SilverKen Agent World'

const STAT_LABELS = {
  working: ['active', 'Jump to the next active astronaut'],
  waiting: ['needs input', 'Jump to the next astronaut needing input'],
  blocked: ['failed', 'Jump to the next failed or blocked astronaut'],
  celebrating: ['released', 'Jump to the next released astronaut'],
  agents: ['agents', 'Jump to the next astronaut'],
}

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

function applyOperationalBadges(root = document) {
  for (const tag of root.querySelectorAll('.thread-pop .meta .tag')) {
    const data = decodeOperationalModel(tag.textContent || '')
    if (!data) continue

    const badges = operationalBadges(data)
    if (!badges.length) {
      tag.remove()
      continue
    }

    const fragment = document.createDocumentFragment()
    for (const badge of badges) {
      const el = document.createElement('span')
      el.className = `tag sk-op ${badge.tone}`
      el.textContent = badge.label
      if (badge.title) el.title = badge.title
      fragment.appendChild(el)
    }
    tag.replaceWith(fragment)
  }
}

function applyBrand(root = document) {
  const brand = root.querySelector('.side .brand')
  if (brand && !brand.querySelector('.sk-mark')) {
    brand.innerHTML =
      '<span class="sk-mark" aria-hidden="true">SK</span>' +
      '<span class="sk-brand-copy"><strong>SilverKen</strong><small>Agent World</small></span>'
    brand.setAttribute('aria-label', BRAND_NAME)
  }

  const brandbar = root.querySelector('.side .brandbar')
  if (brandbar && !root.querySelector('.sk-systembar')) {
    brandbar.insertAdjacentHTML(
      'afterend',
      '<div class="sk-systembar"><i class="sk-live" aria-hidden="true"></i><span>Governed view</span><strong>Read only</strong></div>'
    )
  }

  const bootTitle = root.querySelector('.boot h1')
  if (bootTitle && bootTitle.textContent !== BRAND_NAME) bootTitle.textContent = BRAND_NAME

  const helpTitle = root.querySelector('.help h2')
  if (helpTitle && helpTitle.textContent !== BRAND_NAME) helpTitle.textContent = BRAND_NAME

  const helpSub = root.querySelector('.help .sub')
  if (helpSub && helpSub.dataset.silverken !== 'true') {
    helpSub.dataset.silverken = 'true'
    helpSub.textContent =
      'Projects become zones and agent sessions become astronauts. SilverKen Agent World visualizes work from Agency Agent, Claude Code, Codex and Cursor while authoritative approvals, verification, security and release decisions stay in their source systems.'
    const note = document.createElement('div')
    note.className = 'sk-governance-note'
    note.textContent =
      'Agent World is a read-only operations surface. Verification, Evaluator, SilverGuard and release badges summarize Agency Agent evidence; they never replace the authoritative records.'
    helpSub.insertAdjacentElement('afterend', note)
  }

  for (const [key, [label, title]] of Object.entries(STAT_LABELS)) {
    const stat = root.querySelector(`.stat[data-key="${key}"]`)
    if (!stat) continue
    const labelNode = stat.querySelector('.lbl')
    if (labelNode && labelNode.textContent !== label) labelNode.textContent = label
    if (stat.title !== title) stat.title = title
  }

  // Preserve the live count written by the upstream HUD, only swap the product vocabulary.
  const projectsHeading = root.querySelector('.projects-pane .sec-head span')
  if (projectsHeading && /repos?/i.test(projectsHeading.textContent)) {
    projectsHeading.textContent = projectsHeading.textContent.replace(/repos?/i, (value) =>
      value.toLowerCase().endsWith('s') ? 'projects' : 'project'
    )
  }

  replaceButtonText(root.querySelector('#btn-close-project'), 'All projects')
  replaceButtonText(root.querySelector('#btn-new-session'), 'New session')

  const hideProject = root.querySelector('#btn-hide-project')
  replaceButtonText(hideProject, 'Hide project')
  if (
    hideProject &&
    hideProject.title !== 'Hide this project from Agent World without modifying its source system'
  ) {
    hideProject.title = 'Hide this project from Agent World without modifying its source system'
  }

  const shot = root.querySelector('#btn-shot')
  if (shot && shot.title !== 'Capture Agent World (P)') shot.title = 'Capture Agent World (P)'

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

export { BRAND_NAME, STAT_LABELS, applyBrand, applyOperationalBadges }
