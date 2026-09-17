# SilverKen Agent World

> A governed 3D operations surface for AI coding agents.

SilverKen Agent World turns coding-agent work into a navigable colony: repositories become zones, sessions/tasks become astronauts and buildings, and operational states become visible behavior.

This repository is a fork of **[Station-Sciences/bot-crossing](https://github.com/Station-Sciences/bot-crossing)** by Jarren Rocks. The original Three.js colony engine, local-first architecture, assets and interaction model remain under the upstream MIT license. SilverKen extends that foundation with Agency Agent integration, governed operational evidence, optional GitHub PR/CI context, governed request actions and a French/English product layer.

## Status

**Current milestone: AW8 — Productization & Local Launcher**

| Capability | Status |
| --- | --- |
| Bot Crossing 3D colony engine | ✅ inherited upstream |
| Claude Code / Codex / Cursor harnesses | ✅ inherited upstream |
| Agency Agent harness + state mapping | ✅ SilverKen extension |
| SilverKen visual identity | ✅ AW4 |
| French / English UI switch | ✅ real-machine validated |
| Agency Agent operational snapshot | ✅ AW5A |
| Verification / Evaluator / SilverGuard / release badges | ✅ AW5A |
| GitHub repository / PR / CI enrichment | ✅ AW5B |
| Real PR `OPEN → MERGED` + CI PASS smoke | ✅ Windows operator machine |
| Governed deep navigation | ✅ AW6 real-machine smoke |
| Governed request actions + audit | ✅ AW7 real-machine smoke |
| Persistent machine config + one-command launcher | 🟠 AW8 current |

## Architecture

```text
Agency Agent
  SilverFlow / SilverGuard / Evaluator / Durable Knowledge
  Operator API
       │
       │ authenticated snapshots + narrowly governed requests
       ▼
server/harnesses/agency-agent.mjs
       │
       │ normalized Thread[] + compact operational context
       ▼
optional GitHub enrichment
       │
       │ repository / branch / PR / checks
       ▼
SilverKen Agent World
  Three.js / WebGL colony
       │
       ├─ project → zone
       ├─ task/session → astronaut + building
       ├─ working → hammering
       ├─ human decision → ?
       ├─ verification failure → !
       ├─ governed evidence → compact badges
       ├─ real GitHub merged PR → merged state / celebration
       ├─ navigation → authoritative Operator / GitHub surfaces
       └─ governed request → Agency Agent RBAC + audit
```

**Authority stays in Agency Agent.** Agent World may visualize, navigate and record a deliberately small request vocabulary, but it does not bypass RBAC, SilverGuard, verification, approvals, release gates or audit controls. GitHub PR/CI state remains a separate evidence domain and never substitutes for Agency Agent governance.

## Quick start — AW8 local launcher

Requirements:

- Node.js **22.13+**
- npm
- optional but recommended: a working sibling `agency-agent` checkout with `.venv`

First time:

```powershell
npm ci
npm run setup
```

Then edit the generated, Git-ignored file:

```text
config/agent-world.local.json
```

Put your Agency Agent URL/token there once. With sibling repositories, the default `../agency-agent` path is enough.

Check the machine:

```powershell
npm run doctor
```

Daily launch:

```powershell
npm run dev
```

If `agencyAgent.autoStart` is enabled and Agency Agent is not already healthy, the launcher starts its `.venv` CLI, waits for `/health`, then starts Agent World. Token values are never printed.

See [`docs/local-launcher.md`](docs/local-launcher.md).

### Legacy / automation environment variables

Environment variables still work and take precedence over the local file:

```powershell
$env:AGENCY_AGENT_URL="http://127.0.0.1:8787"
$env:AGENCY_AGENT_TOKEN="aa_your_token_here"
npm run dev
```

This keeps CI and existing scripts backward compatible.

## French / English UI

A compact **FR / EN** selector is available in the SilverKen header. First launch follows the browser language; the choice is remembered locally.

The real-machine smoke validated the French governed view, including labels such as `Vue gouvernée`, `Actions gouvernées`, `Tous les projets`, `Nouvelle session`, `Ouvrir dans Operator` and `Demande enregistrée ✓`.

## Governed Agency Agent integration

Agency Agent exposes one bounded project snapshot:

```text
GET /api/v1/projects/{project_id}/agent-world
```

The visualization receives only the operational context it needs: owner/current agent, verification counts, Evaluator verdict, SilverGuard disposition, release readiness, aggregate token/cost telemetry and workspace/branch hints. Raw evidence bodies, credentials and policy are not replicated.

AW6 adds safe navigation back to the authoritative Operator UI. AW7 adds only three request intents:

```text
REQUEST_HUMAN_REVIEW
REQUEST_RISK_REVIEW
REQUEST_VERIFICATION_RETRY
```

A request requires a rationale, is loopback-gated in Agent World, re-resolves the canonical task server-side, and becomes an Agency Agent `governed_action.requested` audit event. The request itself does **not** transition a task, approve risk, retry verification, execute tools, write files or merge a PR.

The Windows AW7 smoke confirmed:

```text
3D button → rationale → Demande enregistrée ✓
Agency Agent audit → governed_action.requested / SUCCESS
requested_action → REQUEST_HUMAN_REVIEW
source → silverken-agent-world
```

## Optional GitHub context

For projects without a local checkout, map project names explicitly. The AW8 local config supports the same mappings without requiring PowerShell environment variables every launch.

```json
{
  "github": {
    "token": "",
    "projects": {
      "f-Silverken-Plateform": "Silverken92/silverken-platform"
    },
    "branches": {}
  }
}
```

GitHub credentials remain server-side. Public repositories can work without a token subject to API limits.

See [`docs/github-context.md`](docs/github-context.md) and [`docs/github-branch-overrides.md`](docs/github-branch-overrides.md).

## Agency Agent state mapping

| Agency Agent task state | Colony behavior |
| --- | --- |
| `IN_PROGRESS` / `IMPLEMENTED` / review states | working |
| `BLOCKED` / `NEEDS_USER_DECISION` / `RISK_ACCEPTANCE_REQUIRED` | needs attention (`?`) |
| `FAILED_VERIFICATION` | error (`!`) |
| `DONE` | retired from active colony |

The mapping visualizes operational state; it does not create a second source of truth.

## Quality

```bash
npm audit --omit=dev --audit-level=high
npm test
npm run build
```

Repository CI runs runtime dependency audit, tests and production build on pull requests and pushes to `main`.

Real-machine validation on Windows has confirmed:

```text
Agency Agent authenticated scan       ✅
Tuce task in 3D                       ✅
French UI                             ✅
GitHub PR OPEN → MERGED + CI PASS     ✅
Ouvrir dans Operator deep navigation  ✅
Governed request recorded in audit    ✅
Persistent success UX                 ✅
```

## Roadmap

See [`ROADMAP.md`](ROADMAP.md).

```text
AW1  Bridge contract                     ✅
AW2  Repo bootstrap + adapter            ✅
AW3  Live Agency Agent view              ✅
AW4  SilverKen visual identity           ✅
I18N French / English UI                 ✅
AW5A Governed operational enrichment     ✅
AW5B GitHub / PR / CI enrichment         ✅
AW6  Governed navigation                 ✅
AW7  Governed action requests            ✅
AW8  Productization & local launcher     🟠 current
```

## Upstream relationship

This fork deliberately keeps the Bot Crossing harness seam and core local-first philosophy intact. Upstream improvements can be reviewed and selectively synced where they do not conflict with SilverKen governance or product direction.

- Upstream: `Station-Sciences/bot-crossing`
- SilverKen fork: `Silverken92/silverken-agent-world`
- License: MIT — see [`LICENSE`](LICENSE)
- Original creator: Jarren Rocks

## Security principles

- no writes into external harness-owned files or databases;
- Agency Agent access uses the Operator API, never direct database reads;
- Agency Agent and GitHub tokens stay server-side and are never placed in thread `ref`, colony state or browser persistence;
- `config/agent-world.local.json` is explicitly ignored by Git;
- diagnostics report only whether a token is configured, never its value;
- governed actions are request-only and pass through Agency Agent RBAC/audit;
- operational snapshots are data-minimized;
- visual state never constitutes release approval, PR merge evidence or security evidence unless the corresponding authoritative source explicitly reports it.

---

**SilverKen Agent World** — see the work, keep governance authoritative.
