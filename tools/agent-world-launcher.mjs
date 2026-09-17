import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { ROOT, loadLocalConfig } from '../server/local-config.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const EXAMPLE_CONFIG = path.join(ROOT, 'config', 'agent-world.example.json')
const LOCAL_CONFIG = path.join(ROOT, 'config', 'agent-world.local.json')
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
const ASSET_BUILDER = path.join(HERE, 'build-assets.mjs')

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function enabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(clean(value).toLowerCase())
}

async function exists(file) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

async function health(url) {
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/health`, {
      signal: AbortSignal.timeout(1200),
    })
    if (!response.ok) return false
    const body = await response.json()
    return body?.status === 'ok' && body?.service === 'agency-agent-operator'
  } catch {
    return false
  }
}

function resolveAgencyRepo(raw) {
  if (!clean(raw)) return ''
  return path.isAbsolute(raw) ? raw : path.resolve(ROOT, raw)
}

function agencyExecutable(repoPath) {
  if (!repoPath) return ''
  return process.platform === 'win32'
    ? path.join(repoPath, '.venv', 'Scripts', 'agency-agent.exe')
    : path.join(repoPath, '.venv', 'bin', 'agency-agent')
}

function spawnInherited(command, args, options = {}) {
  return spawn(command, args, {
    cwd: options.cwd || ROOT,
    env: process.env,
    stdio: 'inherit',
    windowsHide: false,
  })
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolve({ code, signal }))
  })
}

async function waitForHealth(url, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await health(url)) return true
    await new Promise((resolve) => setTimeout(resolve, 350))
  }
  return false
}

async function startAgencyAgentIfNeeded(summary) {
  const url = summary.agencyAgent.url
  if (await health(url)) {
    console.log(`✓ Agency Agent already running at ${url}`)
    return null
  }

  if (!summary.agencyAgent.autoStart) {
    console.log(`! Agency Agent is not running at ${url} (autoStart disabled)`)
    return null
  }

  const repo = resolveAgencyRepo(summary.agencyAgent.repoPath)
  const executable = agencyExecutable(repo)
  if (!repo || !(await exists(executable))) {
    throw new Error(
      `Agency Agent auto-start is enabled, but its executable was not found. Expected: ${executable || '<repoPath>/.venv/.../agency-agent'}`
    )
  }

  console.log(`→ Starting Agency Agent from ${repo}`)
  const child = spawnInherited(executable, ['serve'], { cwd: repo })
  if (!(await waitForHealth(url))) {
    child.kill()
    throw new Error(`Agency Agent did not become healthy at ${url}`)
  }
  console.log(`✓ Agency Agent healthy at ${url}`)
  return child
}

async function runAssets() {
  const child = spawnInherited(process.execPath, [ASSET_BUILDER])
  const result = await waitForExit(child)
  if (result.code !== 0) throw new Error(`Asset build failed with exit code ${result.code}`)
}

async function runDev() {
  const loaded = await loadLocalConfig()
  console.log(`SilverKen Agent World · local launcher`)
  console.log(`${loaded.loaded ? '✓' : '!'} Local config: ${loaded.path}`)
  console.log(`✓ Agency Agent token: ${loaded.summary.agencyAgent.tokenConfigured ? 'configured' : 'not configured'}`)
  console.log(`✓ GitHub token: ${loaded.summary.github.tokenConfigured ? 'configured' : 'not configured'}`)

  if (!(await exists(VITE_BIN))) {
    throw new Error('Vite is not installed. Run `npm ci` once in silverken-agent-world.')
  }

  const agencyChild = await startAgencyAgentIfNeeded(loaded.summary)
  await runAssets()

  const viteChild = spawnInherited(process.execPath, [VITE_BIN])
  const shutdown = () => {
    if (!viteChild.killed) viteChild.kill()
    if (agencyChild && !agencyChild.killed) agencyChild.kill()
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)

  try {
    const result = await waitForExit(viteChild)
    if (result.code && result.code !== 0) process.exitCode = result.code
  } finally {
    if (agencyChild && !agencyChild.killed) agencyChild.kill()
  }
}

async function doctor() {
  const loaded = await loadLocalConfig()
  const summary = loaded.summary
  const repo = resolveAgencyRepo(summary.agencyAgent.repoPath)
  const executable = agencyExecutable(repo)
  const aaHealthy = await health(summary.agencyAgent.url)

  console.log('SilverKen Agent World doctor')
  console.log(`- Node: ${process.version}`)
  console.log(`- config: ${loaded.loaded ? 'PASS' : 'WARN (local config not created)'}`)
  console.log(`- config path: ${loaded.path}`)
  console.log(`- Agency Agent URL: ${summary.agencyAgent.url}`)
  console.log(`- Agency Agent token: ${summary.agencyAgent.tokenConfigured ? 'configured' : 'missing'}`)
  console.log(`- Agency Agent health: ${aaHealthy ? 'PASS' : 'WARN (not running)'}`)
  console.log(`- Agency Agent auto-start: ${summary.agencyAgent.autoStart ? 'enabled' : 'disabled'}`)
  if (summary.agencyAgent.autoStart) {
    console.log(`- Agency Agent executable: ${(await exists(executable)) ? 'PASS' : `WARN (${executable || 'repoPath missing'})`}`)
  }
  console.log(`- GitHub token: ${summary.github.tokenConfigured ? 'configured' : 'optional / missing'}`)
  console.log(`- GitHub project mappings: ${summary.github.projectCount}`)
  console.log(`- GitHub branch mappings: ${summary.github.branchCount}`)
  console.log('- secrets printed: never')
}

async function setup() {
  if (await exists(LOCAL_CONFIG)) {
    console.log(`Local config already exists: ${LOCAL_CONFIG}`)
    console.log('Nothing was overwritten.')
    return
  }
  await fs.mkdir(path.dirname(LOCAL_CONFIG), { recursive: true })
  await fs.copyFile(EXAMPLE_CONFIG, LOCAL_CONFIG)
  console.log(`Created: ${LOCAL_CONFIG}`)
  console.log('Edit this ignored local file once, add your Agency Agent token, then run `npm run doctor`.')
}

async function main() {
  const command = process.argv[2] || 'dev'
  if (command === 'setup') return setup()
  if (command === 'doctor') return doctor()
  if (command === 'dev') return runDev()
  throw new Error(`Unknown launcher command: ${command}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Agent World launcher error: ${error.message}`)
    process.exitCode = 1
  })
}

export { agencyExecutable, doctor, health, resolveAgencyRepo, setup, startAgencyAgentIfNeeded, waitForHealth }
