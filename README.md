# SilverKen Agent World

> A 3D, read-only visual control center for AI coding agents.

SilverKen Agent World turns coding-agent work into a navigable colony: repositories become zones, sessions/tasks become astronauts and buildings, and operational states become visible behavior.

This repository is a fork of **[Station-Sciences/bot-crossing](https://github.com/Station-Sciences/bot-crossing)** by Jarren Rocks. The original Three.js colony engine, local-first architecture, assets and interaction model remain under the upstream MIT license. SilverKen extends that foundation with Agency Agent integration, governed operational evidence, optional GitHub PR/CI context and a French/English product layer.

## Status

**Current milestone: AW6 — Governed Navigation**

| Capability | Status |
| --- | --- |
| Bot Crossing 3D colony engine | ✅ inherited upstream |
| Claude Code / Codex / Cursor harnesses | ✅ inherited upstream |
| Agency Agent harness + state mapping | ✅ SilverKen extension |
| Read-only governance boundary | ✅ enforced |
| Agency Agent health/auth diagnostics | ✅ real-machine validated |
| SilverKen visual identity | ✅ AW4 |
| French / English UI switch | ✅ persisted locally |
| Agency Agent operational snapshot | ✅ AW5A |
| Verification / Evaluator / SilverGuard / release badges | ✅ AW5A |
| Token/cost telemetry | ✅ AW5A |
| GitHub repository / PR / CI enrichment | ✅ AW5B |
| Real PR `OPEN → MERGED` + CI PASS smoke | ✅ Windows operator machine |
| Governed deep navigation | ⏭️ AW6 |
| Optional governed actions | ⏭️ AW7 |

## Architecture

```text
Agency Agent
  SilverFlow / SilverGuard / Evaluator / Durable Knowledge
  Operator API
       │
       │ authenticated read-only snapshots
       ▼
server/harnesses/agency-agent.mjs
       │
       │ normalized Thread[] + compact operational context
       ▼
optional read-only GitHub enrichment
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
       └─ done → archived/retired
```

**Authority stays in Agency Agent.** Agent World is a visualization consumer. It does not bypass RBAC, SilverGuard, verification, approvals, release gates or audit controls. GitHub PR/CI state is a separate evidence domain and never substitutes for Agency Agent governance.

## AW5 operational enrichment

Agency Agent exposes one bounded read-only snapshot per project:

```text
GET /api/v1/projects/{project_id}/agent-world
```

The snapshot contains only the operational context needed by the visualization: owner/current agent, verification counts, Evaluator verdict, SilverGuard disposition, release readiness, aggregate token/cost telemetry and workspace/branch hints. Raw evidence bodies, acceptance checks, credentials and policy are not replicated.

`Livraison · PRÊT` is an Agency Agent governance signal. It is **not** treated as GitHub merge evidence.

AW5B optionally adds real GitHub repository, branch, pull-request and CI/check context. It is cached locally, GET-only and keeps GitHub credentials server-side. Repository mappings and optional branch mappings allow Agency Agent projects without a local checkout to resolve GitHub context.

See [`docs/github-context.md`](docs/github-context.md) and [`docs/github-branch-overrides.md`](docs/github-branch-overrides.md).

## French / English UI

The SilverKen layer keeps the upstream renderer/HUD architecture intact and adds product styling and localization additively.

A compact **FR / EN** selector is available in the SilverKen header. First launch follows the browser language; the choice is remembered locally.

The real-machine smoke validated the French governed view, including labels such as `Vue gouvernée`, `Lecture seule`, `Tous les projets`, `Nouvelle session`, `Explorer` and Agency Agent/GitHub operational badges.

## Requirements

- Node.js **22.13+**
- npm
- optional: a running Agency Agent Operator API
- optional: GitHub read access for private repository PR/CI context

## Run

```bash
npm ci
npm run dev
```

### With Agency Agent

Start Agency Agent separately, create an Operator API token, then export:

```bash
export AGENCY_AGENT_URL=http://127.0.0.1:8787
export AGENCY_AGENT_TOKEN=aa_your_token_here
npm run dev
```

Agency Agent is detected through `/health`; missing, rejected or under-authorized bearer tokens are reported without breaking other harnesses.

For the complete Windows/macOS/Linux walkthrough, see [`docs/local-smoke.md`](docs/local-smoke.md).

### Optional GitHub context

For a project without a local checkout, map the project name explicitly. Example on PowerShell:

```powershell
$env:AGENT_WORLD_GITHUB_TOKEN=(gh auth token) # optional for public repos
$env:AGENT_WORLD_GITHUB_PROJECTS='{"Tuce":"Silverken92/silverken-agent-world"}'
$env:AGENT_WORLD_GITHUB_BRANCHES='{"Tuce":"feature/example"}'
npm run dev
```

Do not commit or share tokens. Public repository mappings can work without a token, subject to GitHub API limits.

## Agency Agent state mapping

| Agency Agent task state | Colony behavior |
| --- | --- |
| `IN_PROGRESS` / `IMPLEMENTED` / review states | working |
| `BLOCKED` / `NEEDS_USER_DECISION` / `RISK_ACCEPTANCE_REQUIRED` | needs attention (`?`) |
| `FAILED_VERIFICATION` | error (`!`) |
| `DONE` | retired from active colony |

The mapping visualizes operational state; it does not create a second source of truth.

## Quality and real-machine evidence

```bash
npm audit --omit=dev --audit-level=high
npm test
npm run build
```

Repository CI runs runtime dependency audit, tests and production build on pull requests and pushes to `main`.

Key evidence:

```text
Agency Agent snapshot API       71 tests + PostgreSQL/container production gates ✅
Agent World AW5A                47 tests + audit + build ✅
FR/EN localization              52 tests + audit + build ✅
AW5B initial implementation     59 tests + audit + build ✅
AW5B branch mapping hardening   64 tests + audit + build ✅
AW5B real-machine smoke         PR #11 OPEN → MERGED, CI PASS 1/1 ✅
```

Real-machine validation on Windows confirmed:

```text
Agency Agent /health            OK
Agency Agent authenticated scan OK
Tuce project/task in 3D         OK
French UI                       OK
GitHub repo mapping             OK
GitHub branch mapping           OK
PR #11 OPEN                     OK
CI PASS                         OK
PR #11 MERGED                   OK
```

## Roadmap

See [`ROADMAP.md`](ROADMAP.md).

```text
AW1  Bridge contract                     ✅
AW2  Repo bootstrap + adapter            ✅
AW3  Live Agency Agent view              ✅ real-machine smoke
AW4  SilverKen visual identity           ✅
I18N French / English UI                 ✅ real-machine smoke
AW5A Governed operational enrichment     ✅ real 3D smoke
AW5B GitHub / PR / CI enrichment         ✅ real OPEN→MERGED + CI smoke
AW6  Governed navigation                 ⏭️ current
AW7  Optional governed actions           ⏭️
```

## Upstream relationship

This fork deliberately keeps the Bot Crossing harness seam and read-only philosophy intact. Upstream improvements can be reviewed and selectively synced where they do not conflict with SilverKen governance or product direction.

- Upstream: `Station-Sciences/bot-crossing`
- SilverKen fork: `Silverken92/silverken-agent-world`
- License: MIT — see [`LICENSE`](LICENSE)
- Original creator: Jarren Rocks

## Security principles

- no writes into external harness data;
- Agency Agent access uses the Operator API, never direct database reads;
- Agency Agent and GitHub tokens stay server-side and are never placed in thread `ref`, colony state or browser persistence;
- bridge and GitHub enrichment remain read-only;
- operational snapshots are data-minimized;
- visual state never constitutes release approval, PR merge evidence or security evidence unless the corresponding authoritative source explicitly reports it.

---

**SilverKen Agent World** — see the work, keep governance authoritative.
