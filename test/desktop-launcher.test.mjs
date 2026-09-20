import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function read(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), 'utf8')
}

test('AW21 exposes explicit Windows desktop launcher commands', async () => {
  const pkg = JSON.parse(await read('package.json'))

  assert.equal(
    pkg.scripts['desktop:server'],
    'node tools/agent-world-launcher.mjs desktop-server'
  )
  assert.equal(
    pkg.scripts.desktop,
    'powershell.exe -NoProfile -STA -File tools/agent-world-tray.ps1'
  )
  assert.equal(
    pkg.scripts['desktop:install'],
    'powershell.exe -NoProfile -STA -File tools/install-windows-shortcut.ps1'
  )
})

test('AW21 tray remains local and does not embed provider credentials', async () => {
  const tray = await read('tools/agent-world-tray.ps1')

  assert.match(tray, /http:\/\/127\.0\.0\.1:\$Port/)
  assert.match(tray, /\/healthz/)
  assert.match(tray, /taskkill\.exe/)
  assert.doesNotMatch(tray, /AGENCY_AGENT_TOKEN/)
  assert.doesNotMatch(tray, /github\.token/)
  assert.doesNotMatch(tray, /OPENAI_API_KEY/)
})

test('AW21 desktop server reuses the governed local launcher boundary', async () => {
  const launcher = await read('tools/agent-world-launcher.mjs')

  assert.match(launcher, /startAgencyAgentIfNeeded\(loaded\.summary\)/)
  assert.match(launcher, /runProductionBuild\(\)/)
  assert.match(launcher, /desktop-server/)
  assert.match(launcher, /SERVER_ENTRY/)
})

test('AW21 exposes a bounded Agent World health endpoint', async () => {
  const server = await read('server/serve.mjs')

  assert.match(server, /url\.pathname === '\/healthz'/)
  assert.match(server, /service: 'silverken-agent-world'/)
  assert.match(server, /'Cache-Control': 'no-store'/)
})

test('AW21 Start Menu installer targets the repository launcher', async () => {
  const installer = await read('tools/install-windows-shortcut.ps1')
  const command = await read('SilverKen-Agent-World.cmd')

  assert.match(installer, /SilverKen Agent World\.lnk/)
  assert.match(installer, /SilverKen-Agent-World\.cmd/)
  assert.match(command, /agent-world-tray\.ps1/)
  assert.match(command, /-WindowStyle Hidden/)
})
