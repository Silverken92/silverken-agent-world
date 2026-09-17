export const SUPPORTED_LOCALES = ['en', 'fr']
export const DEFAULT_LOCALE = 'en'
export const LOCALE_STORAGE_KEY = 'silverken-agent-world.locale'

const CATALOG = {
  en: {
    governedView: 'Governed view',
    readOnly: 'Read only',
    language: 'Language',
    projects: 'projects',
    project: 'project',
    allProjects: 'All projects',
    newSession: 'New session',
    hideProject: 'Hide project',
    copyPath: 'Copy path',
    settings: 'Settings',
    open: 'Open',
    viewed: 'Viewed',
    archive: 'Archive',
    active: 'active',
    needsInput: 'needs input',
    failed: 'failed',
    released: 'released',
    agents: 'agents',
    statusWorking: 'Working',
    statusWaiting: 'Waiting on you',
    statusBlocked: 'Blocked',
    statusShipped: 'Shipped',
    statusIdle: 'Idle',
    statusDormant: 'Dormant',
    statusArriving: 'Arriving',
    statusLeaving: 'Heading home',
    owner: 'Owner',
    live: 'Live',
    verify: 'Verify',
    evaluator: 'Eval',
    release: 'Release',
    tokens: 'tok',
    helpSummary:
      'Projects become zones and agent sessions become astronauts. SilverKen Agent World visualizes work from Agency Agent, Claude Code, Codex and Cursor while authoritative approvals, verification, security and release decisions stay in their source systems.',
    governanceNote:
      'Agent World is a read-only operations surface. Verification, Evaluator, SilverGuard and release badges summarize Agency Agent evidence; they never replace the authoritative records.',
  },
  fr: {
    governedView: 'Vue gouvernée',
    readOnly: 'Lecture seule',
    language: 'Langue',
    projects: 'projets',
    project: 'projet',
    allProjects: 'Tous les projets',
    newSession: 'Nouvelle session',
    hideProject: 'Masquer le projet',
    copyPath: 'Copier le chemin',
    settings: 'Paramètres',
    open: 'Ouvrir',
    viewed: 'Vu',
    archive: 'Archiver',
    active: 'actifs',
    needsInput: 'en attente',
    failed: 'échecs',
    released: 'livrés',
    agents: 'agents',
    statusWorking: 'Actif',
    statusWaiting: 'Attend votre réponse',
    statusBlocked: 'Échec',
    statusShipped: 'Livré',
    statusIdle: 'Inactif',
    statusDormant: 'Dormant',
    statusArriving: 'Arrivée',
    statusLeaving: 'Retour',
    owner: 'Responsable',
    live: 'Actif',
    verify: 'Vérif.',
    evaluator: 'Éval.',
    release: 'Livraison',
    tokens: 'jet.',
    helpSummary:
      'Les projets deviennent des zones et les sessions des agents deviennent des astronautes. SilverKen Agent World visualise le travail provenant d’Agency Agent, Claude Code, Codex et Cursor, tandis que les validations, vérifications, décisions de sécurité et de livraison restent dans leurs systèmes d’autorité.',
    governanceNote:
      'Agent World est une surface d’observation en lecture seule. Les badges Vérification, Evaluator, SilverGuard et Livraison résument les preuves Agency Agent sans jamais remplacer les enregistrements faisant autorité.',
  },
}

const LITERALS = {
  'Quality preset': 'Préréglage qualité',
  Performance: 'Performances',
  'HDR + bloom': 'HDR + halo',
  'Tilt-shift': 'Effet maquette',
  'Tilt-shift blur': 'Flou maquette',
  'Tilt-shift angle': 'Angle maquette',
  Shadows: 'Ombres',
  Off: 'Désactivé',
  Low: 'Faible',
  High: 'Élevé',
  Ultra: 'Ultra',
  Particles: 'Particules',
  Full: 'Complet',
  Textures: 'Textures',
  Medium: 'Moyen',
  'Ground detail': 'Détail du terrain',
  'Anti-aliasing': 'Anticrénelage',
  'Render scale': 'Échelle de rendu',
  'Adaptive quality': 'Qualité adaptative',
  Scatter: 'Densité du décor',
  'Max crew': 'Agents maximum',
  Stars: 'Étoiles',
  Planet: 'Planète',
  Lighting: 'Éclairage',
  Live: 'Heure locale',
  'Time of day': 'Heure de la journée',
  'Cycle day/night': 'Cycle jour/nuit',
  'Cycle length': 'Durée du cycle',
  'Environment light': 'Éclairage ambiant',
  Environment: 'Environnement',
  Exposure: 'Exposition',
  Bloom: 'Halo',
  View: 'Vue',
  'Hide dormant repos': 'Masquer les projets dormants',
  'Return to isometric': 'Retour isométrique',
  'Field of view': 'Champ de vision',
  'Project labels': 'Noms des projets',
  'Reduced motion': 'Réduire les animations',
  'Show FPS': 'Afficher les FPS',
  Potato: 'Minimal',
  Balanced: 'Équilibré',
  'battery first — flat light, no extras': 'priorité à la batterie — éclairage simple, sans extras',
  'for when you are on the go': 'pour une machine en mobilité',
  'the default — looks good, runs cool': 'réglage par défaut — beau et fluide',
  'sharp shadows and a full sky': 'ombres nettes et ciel complet',
  'everything on, plugged in': 'tout activé, idéal sur secteur',
  'Glowing eyes, lamps and windows. The first thing to drop.': 'Yeux, lampes et fenêtres lumineux. Premier effet à désactiver.',
  'A shallow depth of field, which is what makes the colony read as a model.': 'Faible profondeur de champ donnant à la colonie un aspect de maquette.',
  'Aperture: how shallow the focus is, and how far out of it things go.': 'Ouverture : règle la profondeur de la zone nette et l’intensité du flou.',
  'Swings the plane of focus, the way tilting a real lens does.': 'Incline le plan de mise au point comme un objectif à bascule.',
  'SMAA pass. Cheap, but not free.': 'Passe SMAA. Peu coûteuse, mais pas gratuite.',
  '100% is your display’s own resolution, retina included.': '100 % correspond à la résolution native de votre écran, Retina comprise.',
  'Quietly drops render scale if frames get expensive.': 'Réduit automatiquement l’échelle de rendu si les images deviennent trop coûteuses.',
  'Runs the clock forward on its own. Ignored while the sky is following this machine’s clock.': 'Fait avancer l’heure automatiquement. Ignoré si le ciel suit l’horloge de cette machine.',
  'Image-based lighting taken from this planet’s own sky. Metals get something to reflect.': 'Éclairage basé sur le ciel de la planète, notamment pour les reflets métalliques.',
  'Takes a repo off the map when every thread in it has been quiet for three days. Its threads are untouched, and it comes back to the same ground the moment one wakes up.': 'Retire un projet de la carte quand toutes ses sessions sont inactives depuis trois jours. Les sessions restent intactes et le projet revient dès qu’une activité reprend.',
  'Eases the angle back when you stop dragging.': 'Ramène progressivement la caméra en vue isométrique après un déplacement.',
  'Calms the bobbing and the camera easing.': 'Réduit les mouvements des personnages et de la caméra.',
  'Drag the ground': 'Déplacer le terrain',
  'Tilt & rotate': 'Incliner et tourner',
  'Zoom to cursor': 'Zoomer vers le curseur',
  'Move / zoom': 'Déplacer / zoomer',
  'Reset view': 'Réinitialiser la vue',
  'Hide all UI': 'Masquer l’interface',
  Settings: 'Paramètres',
  Screenshot: 'Capture d’écran',
  'Next needing you': 'Prochain élément en attente',
  'Open thread': 'Ouvrir la session',
  'Mark viewed': 'Marquer comme vu',
  Archive: 'Archiver',
  'New conversation': 'Nouvelle session',
  'Orbit mode': 'Mode orbite',
  'Change planet': 'Changer de planète',
  'Time of day': 'Heure de la journée',
  Deselect: 'Désélectionner',
  'This sheet': 'Cette aide',
  'Got it': 'Compris',
  'waiting on your reply — click to open the thread': 'attend votre réponse — cliquez pour ouvrir la session',
  'the session hit an error': 'la session a rencontré une erreur',
  'running right now, building': 'travail en cours',
  'its pull request landed': 'sa pull request a été fusionnée',
  'nothing for three days': 'aucune activité depuis trois jours',
  Working: 'Actif',
  'Waiting on you': 'Attend votre réponse',
  Blocked: 'Échec',
  Shipped: 'Livré',
  Idle: 'Inactif',
  Dormant: 'Dormant',
  Arriving: 'Arrivée',
  'Heading home': 'Retour',
}

const REVERSE_LITERALS = new Map()
for (const [en, fr] of Object.entries(LITERALS)) {
  REVERSE_LITERALS.set(en, en)
  REVERSE_LITERALS.set(fr, en)
}

export function normalizeLocale(value) {
  const locale = String(value || '').trim().toLowerCase()
  if (locale === 'fr' || locale.startsWith('fr-') || locale.startsWith('fr_')) return 'fr'
  return 'en'
}

function browserStorage() {
  try {
    return globalThis.localStorage || null
  } catch {
    return null
  }
}

export function getLocale({ storage = browserStorage(), navigatorLanguage = globalThis.navigator?.language } = {}) {
  try {
    const stored = storage?.getItem?.(LOCALE_STORAGE_KEY)
    if (stored) return normalizeLocale(stored)
  } catch {
    // A blocked storage API must never stop the HUD from rendering.
  }
  return normalizeLocale(navigatorLanguage || DEFAULT_LOCALE)
}

export function setLocale(value, { storage = browserStorage() } = {}) {
  const locale = normalizeLocale(value)
  try {
    storage?.setItem?.(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Locale persistence is optional; the in-memory UI can still switch language.
  }
  return locale
}

export function t(key, locale = DEFAULT_LOCALE) {
  const lang = normalizeLocale(locale)
  return CATALOG[lang]?.[key] ?? CATALOG.en[key] ?? key
}

export function translateLiteral(value, locale = DEFAULT_LOCALE) {
  const source = String(value ?? '')
  if (normalizeLocale(locale) !== 'fr') {
    const canonical = REVERSE_LITERALS.get(source.trim())
    if (!canonical) return source
    return source.replace(source.trim(), canonical)
  }
  const canonical = REVERSE_LITERALS.get(source.trim())
  if (!canonical) return source
  return source.replace(source.trim(), LITERALS[canonical] ?? canonical)
}

export function translateRelativeTime(value, locale = DEFAULT_LOCALE) {
  const source = String(value || '').trim()
  if (normalizeLocale(locale) !== 'fr') {
    if (source === 'jamais') return 'never'
    if (source === 'à l’instant') return 'just now'
    let match = source.match(/^il y a (\d+) min$/)
    if (match) return `${match[1]}m ago`
    match = source.match(/^il y a (\d+) h$/)
    if (match) return `${match[1]}h ago`
    match = source.match(/^il y a (\d+) j$/)
    if (match) return `${match[1]}d ago`
    return source
  }
  if (source === 'never') return 'jamais'
  if (source === 'just now') return 'à l’instant'
  let match = source.match(/^(\d+)m ago$/)
  if (match) return `il y a ${match[1]} min`
  match = source.match(/^(\d+)h ago$/)
  if (match) return `il y a ${match[1]} h`
  match = source.match(/^(\d+)d ago$/)
  if (match) return `il y a ${match[1]} j`
  return source
}
