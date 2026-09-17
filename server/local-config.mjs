import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_RELATIVE_PATH = path.join('config', 'agent-world.local.json')

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [clean(key), clean(item)])
      .filter(([key, item]) => key && item)
  )
}

function safeHttpUrl(value) {
  const raw = clean(value)
  if (!raw) return ''
  try {
    const url = new URL(raw)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

function resolveConfigPath(rawPath = '') {
  const configured = clean(rawPath)
  if (!configured) return path.join(ROOT, DEFAULT_RELATIVE_PATH)
  return path.isAbsolute(configured) ? configured : path.resolve(ROOT, configured)
}

function setIfMissing(env, key, value) {
  const normalized = clean(value)
  if (!clean(env[key]) && normalized) env[key] = normalized
}

function applyLocalConfig(config, env = process.env) {
  const agency = config?.agencyAgent && typeof config.agencyAgent === 'object' ? config.agencyAgent : {}
  const github = config?.github && typeof config.github === 'object' ? config.github : {}

  const agencyUrl = safeHttpUrl(agency.url)
  if (agency.url && !agencyUrl) {
    throw new Error('agencyAgent.url must be an http(s) URL without embedded credentials')
  }

  setIfMissing(env, 'AGENCY_AGENT_URL', agencyUrl)
  setIfMissing(env, 'AGENCY_AGENT_TOKEN', agency.token)
  setIfMissing(env, 'AGENT_WORLD_AGENCY_AGENT_REPO', agency.repoPath)
  if (!clean(env.AGENT_WORLD_AGENCY_AGENT_AUTOSTART) && agency.autoStart === true) {
    env.AGENT_WORLD_AGENCY_AGENT_AUTOSTART = '1'
  }

  setIfMissing(env, 'AGENT_WORLD_GITHUB_TOKEN', github.token)
  const projects = cleanMap(github.projects)
  const branches = cleanMap(github.branches)
  if (!clean(env.AGENT_WORLD_GITHUB_PROJECTS) && Object.keys(projects).length) {
    env.AGENT_WORLD_GITHUB_PROJECTS = JSON.stringify(projects)
  }
  if (!clean(env.AGENT_WORLD_GITHUB_BRANCHES) && Object.keys(branches).length) {
    env.AGENT_WORLD_GITHUB_BRANCHES = JSON.stringify(branches)
  }

  return {
    agencyAgent: {
      url: clean(env.AGENCY_AGENT_URL) || 'http://127.0.0.1:8787',
      tokenConfigured: Boolean(clean(env.AGENCY_AGENT_TOKEN)),
      repoPath: clean(env.AGENT_WORLD_AGENCY_AGENT_REPO),
      autoStart: ['1', 'true', 'yes', 'on'].includes(clean(env.AGENT_WORLD_AGENCY_AGENT_AUTOSTART).toLowerCase()),
    },
    github: {
      tokenConfigured: Boolean(clean(env.AGENT_WORLD_GITHUB_TOKEN || env.GITHUB_TOKEN || env.GH_TOKEN)),
      projectCount: Object.keys(projects).length,
      branchCount: Object.keys(branches).length,
    },
  }
}

async function loadLocalConfig({ env = process.env, configPath } = {}) {
  const file = resolveConfigPath(configPath || env.AGENT_WORLD_CONFIG)
  let parsed
  try {
    parsed = JSON.parse(await fs.readFile(file, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        loaded: false,
        path: file,
        summary: applyLocalConfig({}, env),
      }
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in local Agent World config: ${file}`)
    }
    throw error
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Local Agent World config must contain a JSON object: ${file}`)
  }

  return {
    loaded: true,
    path: file,
    summary: applyLocalConfig(parsed, env),
  }
}

export { ROOT, applyLocalConfig, loadLocalConfig, resolveConfigPath, safeHttpUrl }
