# SilverKen Agent World

> A 3D, read-only visual control center for AI coding agents.

SilverKen Agent World turns coding-agent work into a navigable colony: repositories become zones, sessions/tasks become astronauts and buildings, and operational states become visible behavior.

This repository is a fork of **[Station-Sciences/bot-crossing](https://github.com/Station-Sciences/bot-crossing)** by Jarren Rocks. The original Three.js colony engine, local-first architecture, assets and core interaction model come from Bot Crossing and remain under the upstream MIT license. SilverKen extends that foundation with an **Agency Agent** integration and a roadmap toward a governed visual operations surface.

## Status

**Current milestone: AW3 — Live Agency Agent View**

| Capability | Status |
| --- | --- |
| Bot Crossing 3D colony engine | ✅ inherited upstream |
| Claude Code harness | ✅ inherited upstream |
| Codex harness | ✅ inherited upstream |
| Cursor harness | ✅ inherited upstream |
| Agency Agent harness | ✅ SilverKen extension |
| Agency Agent state mapping | ✅ tested |
| Read-only governance boundary | ✅ enforced by adapter contract |
| Agency Agent health detection | ✅ implemented |
| Missing/invalid token diagnostics | ✅ implemented |
| Fixture-backed live API scan | ✅ tested |
| Real local Agency Agent smoke | ⏭️ requires operator machine/token |
| SilverKen full visual identity | ⏭️ AW4 |
| GitHub / PR / CI enrichment | ⏭️ AW5 |
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
       │ public /health + authenticated GET
       ▼
server/harnesses/agency-agent.mjs
       │
       │ normalized Thread[]
       ▼
SilverKen Agent World
  Three.js / WebGL colony
       │
       ├─ project → zone
       ├─ task → astronaut + building
       ├─ working → hammering
       ├─ human decision → ? badge
       ├─ verification failure → error state
       └─ done → archived/retired
```

**Authority stays in Agency Agent.** Agent World is a visualization consumer. It does not bypass RBAC, SilverGuard, verification, approvals, release gates or audit controls.

## Requirements

- Node.js **22.13+**
- npm
- optional: a running Agency Agent Operator API for the SilverKen integration

## Run

```bash
npm install
npm run dev
```

The application binds locally like upstream Bot Crossing.

### Run with Agency Agent

Start Agency Agent separately, then create an API token from an authenticated Operator session and export:

```bash
export AGENCY_AGENT_URL=http://127.0.0.1:8787
export AGENCY_AGENT_TOKEN=aa_your_token_here
npm run dev
```

AW3 detects Agency Agent through its public `/health` endpoint. If the service is running but the token is missing, invalid or under-authorized, the harness status reports the reason instead of silently disappearing. Other supported harnesses continue working independently.

See [`docs/agency-agent.md`](docs/agency-agent.md) for the integration contract, diagnostics and security boundary.

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

## Roadmap

See [`ROADMAP.md`](ROADMAP.md).

High-level sequence:

```text
AW1  Bridge contract                ✅
AW2  Repo bootstrap + adapter       ✅
AW3  Live Agency Agent view         🚧
AW4  SilverKen visual identity      ⏭️
AW5  GitHub/PR/CI enrichment        ⏭️
AW6  Governed navigation            ⏭️
AW7  Optional governed actions      ⏭️
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
- API tokens stay server-side and are never put into thread `ref`, colony state or client payloads;
- bridge API calls remain read-only;
- visual state never constitutes release approval or security evidence.

---

**SilverKen Agent World** — see the work, keep governance authoritative.
