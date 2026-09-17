# SilverKen Agent World

> A 3D, read-only visual control center for AI coding agents.

SilverKen Agent World turns coding-agent work into a navigable colony: repositories become zones, sessions/tasks become astronauts and buildings, and operational states become visible behavior.

This repository is a fork of **[Station-Sciences/bot-crossing](https://github.com/Station-Sciences/bot-crossing)** by Jarren Rocks. The original Three.js colony engine, local-first architecture, assets and core interaction model come from Bot Crossing and remain under the upstream MIT license. SilverKen extends that foundation with an **Agency Agent** integration and a governed visual operations surface.

## Status

**Current milestone: AW5 — Operational Enrichment**

| Capability | Status |
| --- | --- |
| Bot Crossing 3D colony engine | ✅ inherited upstream |
| Claude Code harness | ✅ inherited upstream |
| Codex harness | ✅ inherited upstream |
| Cursor harness | ✅ inherited upstream |
| Agency Agent harness | ✅ SilverKen extension |
| Agency Agent state mapping | ✅ tested |
| Read-only governance boundary | ✅ enforced by adapter contract |
| Agency Agent health/auth diagnostics | ✅ implemented and CI tested |
| Real local Agency Agent smoke | ✅ Windows operator machine |
| SilverKen product skin / branding | ✅ AW4 |
| French / English UI switch | ✅ FR/EN, persisted locally |
| Bounded Agency Agent operational snapshot | ✅ Agency Agent main |
| Verification / Evaluator / SilverGuard / release badges | ✅ AW5A main |
| Token/cost operational telemetry | ✅ AW5A main |
| Real Agency Agent data in 3D colony | ✅ AW5A operator smoke |
| GitHub PR / CI enrichment | 🚧 AW5B implementation + CI green |
| Governed deep navigation | ⏭️ AW6 |
| Governed actions | ⏭️ AW7 |

## Architecture

```text
Agency Agent
  SilverFlow
  SilverGuard
  Evaluator
  Durable Knowledge
  Operator API
       │
       │ public /health + authenticated read-only snapshots
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
       ├─ task → astronaut + building
       ├─ working → hammering
       ├─ human decision → ? badge
       ├─ verification failure → error state
       ├─ governed evidence → compact card badges
       ├─ real GitHub merged PR → celebration
       └─ done → archived/retired
```

**Authority stays in Agency Agent.** Agent World is a visualization consumer. It does not bypass RBAC, SilverGuard, verification, approvals, release gates or audit controls. GitHub PR/CI state is a separate evidence domain and never substitutes for Agency Agent governance.

## AW5 operational enrichment

Agency Agent exposes one bounded read-only snapshot per project:

```text
GET /api/v1/projects/{project_id}/agent-world
```

Agent World consumes that snapshot instead of issuing multiple evidence queries per task. The snapshot includes only compact operational context needed by the visualization:

- owner and most recent active agent;
- verification counts;
- independent Evaluator verdict;
- SilverGuard disposition and finding counts;
- Agency Agent release disposition/readiness;
- aggregate token usage and reported cost;
- workspace / branch hints already available to the task.

Raw evidence bodies, acceptance-check text, credentials and governance policy are deliberately not replicated. `Release · READY` is an Agency Agent gate signal only; it is **not** treated as GitHub merged-PR evidence.

AW5B optionally adds real GitHub repository, pull-request and checks/status context. It is off by default, cached locally, performs GET requests only, and keeps GitHub credentials server-side. See [`docs/github-context.md`](docs/github-context.md).

## Visual identity and languages

AW4 keeps the upstream Three.js/HUD implementation intact and layers SilverKen product styling over it. The FR/EN localization follows the same additive pattern:

```text
upstream HUD + render engine
           ↓
silverken.css
silverken-brand.js
i18n.js / i18n.css
operational.js / operational.css
           ↓
SilverKen Agent World
```

The interface uses a graphite/silver base, violet identity accents, cyan live-system signals and an explicit **Governed view / Read only** indicator. A compact **FR / EN** selector is available in the SilverKen header; the first launch follows the browser language and the choice is remembered locally. See [`docs/visual-identity.md`](docs/visual-identity.md).

## Requirements

- Node.js **22.13+**
- npm
- optional: a running Agency Agent Operator API for the SilverKen integration
- optional: GitHub read access for AW5B PR/CI context

## Run

```bash
npm ci
npm run dev
```

The application binds locally like upstream Bot Crossing.

### Run with Agency Agent

Start Agency Agent separately, create an Operator API token, then export:

```bash
export AGENCY_AGENT_URL=http://127.0.0.1:8787
export AGENCY_AGENT_TOKEN=aa_your_token_here
npm run dev
```

Agency Agent is detected through its public `/health` endpoint. If the service is running but the token is missing, invalid or under-authorized, the harness status reports the reason instead of silently disappearing. Other supported harnesses continue working independently.

For the complete Windows/macOS/Linux walkthrough, see [`docs/local-smoke.md`](docs/local-smoke.md). See [`docs/agency-agent.md`](docs/agency-agent.md) for the bridge contract and security boundary.

### Optional GitHub context

For Agency Agent projects without a local repository path, map the project name explicitly. Example on PowerShell:

```powershell
$env:AGENT_WORLD_GITHUB_TOKEN="YOUR_GITHUB_TOKEN"
$env:AGENT_WORLD_GITHUB_PROJECTS='{"Tuce":"Silverken92/tuce"}'
npm run dev
```

Do not commit or share the token. Public repository mappings can work without a token, subject to GitHub API limits. Full details are in [`docs/github-context.md`](docs/github-context.md).

## Agency Agent state mapping

| Agency Agent task state | Colony behavior |
| --- | --- |
| `IN_PROGRESS` | working |
| `IMPLEMENTED` | working |
| `QA_REVIEW` | working |
| `SECURITY_REVIEW` | working |
| `FINAL_REVIEW` | working |
| `BLOCKED` | needs attention (`?`) |
| `NEEDS_USER_DECISION` | needs attention (`?`) |
| `RISK_ACCEPTANCE_REQUIRED` | needs attention (`?`) |
| `FAILED_VERIFICATION` | error (`!`) |
| `DONE` | retired from the active colony |

The mapping intentionally visualizes operational state; it does **not** create a second source of truth.

## Quality

```bash
npm audit --omit=dev --audit-level=high
npm test
npm run build
```

Repository CI runs runtime dependency audit, tests and production build on pull requests and pushes to `main`.

Evidence through AW5B:

```text
Agency Agent snapshot API       71 tests + PostgreSQL/container production gates ✅
Agent World AW5A                47 tests + audit + build ✅
FR/EN localization              52 tests + audit + build ✅
AW5B PR/CI implementation       59 tests + audit + build ✅
```

The Agency Agent snapshot API is squash-merged at `dc9cf4b4726d2ee686655d5d2221fce169261978`. Agent World AW5A is merged at `d2d9d7e7d5f631edb1e0107bf5061581b14b4c31`; FR/EN localization is merged at `70fb8d82359eeb43a2f97be3343c7466fcb85e07`. AW5B merge evidence is recorded in the roadmap after promotion to `main`.

## Roadmap

See [`ROADMAP.md`](ROADMAP.md).

High-level sequence:

```text
AW1  Bridge contract                     ✅
AW2  Repo bootstrap + adapter            ✅
AW3  Live Agency Agent view              ✅ real-machine smoke
AW4  SilverKen visual identity           ✅
I18N French / English UI                 ✅
AW5A Governed operational enrichment     ✅ real 3D smoke
AW5B GitHub / PR / CI enrichment         🚧 implementation + CI green
AW6  Governed navigation                 ⏭️
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
- Agency Agent access uses its Operator API, never direct database reads;
- Agency Agent and GitHub tokens stay server-side and are never put into thread `ref`, colony state or persisted browser state;
- bridge and AW5B GitHub API calls remain read-only;
- operational snapshots are data-minimized;
- visual state never constitutes release approval, PR merge evidence or security evidence unless the corresponding authoritative source explicitly reports that evidence.

---

**SilverKen Agent World** — see the work, keep governance authoritative.
