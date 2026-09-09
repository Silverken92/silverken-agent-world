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
| Fixture-backed live API scan | ✅ tested |
| SilverKen product skin / branding | ✅ AW4 |
| Bounded Agency Agent operational snapshot | ✅ Agency Agent main |
| Verification / Evaluator / SilverGuard / release badges | ✅ AW5 implementation |
| Token/cost operational telemetry | ✅ AW5 implementation |
| Real local Agency Agent smoke | ⏭️ requires operator machine/token |
| GitHub PR / CI enrichment | ⏭️ next AW5 increment |
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
SilverKen Agent World
  Three.js / WebGL colony
       │
       ├─ project → zone
       ├─ task → astronaut + building
       ├─ working → hammering
       ├─ human decision → ? badge
       ├─ verification failure → error state
       ├─ governed evidence → compact card badges
       └─ done → archived/retired
```

**Authority stays in Agency Agent.** Agent World is a visualization consumer. It does not bypass RBAC, SilverGuard, verification, approvals, release gates or audit controls.

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

## Visual identity

AW4 keeps the upstream Three.js/HUD implementation intact and layers SilverKen product styling over it:

```text
upstream HUD + render engine
           ↓
silverken.css
silverken-brand.js
operational.js / operational.css
           ↓
SilverKen Agent World
```

The interface uses a graphite/silver base, violet identity accents, cyan live-system signals and an explicit **Governed view / Read only** indicator. See [`docs/visual-identity.md`](docs/visual-identity.md).

## Requirements

- Node.js **22.13+**
- npm
- optional: a running Agency Agent Operator API for the SilverKen integration

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

AW5's current Agent World gate passes **47/47 tests**, runtime dependency audit and production Vite build. The matching Agency Agent snapshot API is squash-merged at `dc9cf4b4726d2ee686655d5d2221fce169261978`; its post-merge Repository Quality passes runtime/docs, PostgreSQL production smoke and constrained-container production smoke.

## Roadmap

See [`ROADMAP.md`](ROADMAP.md).

High-level sequence:

```text
AW1  Bridge contract                     ✅
AW2  Repo bootstrap + adapter            ✅
AW3  Live Agency Agent code              ✅  real-machine smoke pending
AW4  SilverKen visual identity           ✅
AW5  Operational enrichment              🚧  Agency evidence implemented; GitHub/CI next
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
- API tokens stay server-side and are never put into thread `ref`, colony state or persisted browser state;
- bridge API calls remain read-only;
- operational snapshots are data-minimized;
- visual state never constitutes release approval, PR merge evidence or security evidence.

---

**SilverKen Agent World** — see the work, keep governance authoritative.
