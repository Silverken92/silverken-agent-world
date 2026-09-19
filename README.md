# SilverKen Agent World

> A governed 3D operations surface for AI coding agents.

SilverKen Agent World turns coding-agent work into a navigable colony: projects become zones, persistent agents become astronauts, tasks/missions remain visible operational objects, and governed state becomes visual behavior.

This repository is a fork of **[Station-Sciences/bot-crossing](https://github.com/Station-Sciences/bot-crossing)** by Jarren Rocks. The original Three.js colony engine, local-first architecture, assets and interaction model remain under the upstream MIT license. SilverKen extends that foundation with Agency Agent integration, governed evidence and requests, persistent AgentProfiles, optional GitHub PR/CI context, and a French/English product layer.

## Status

**Latest completed milestone: AW15C — Live Multi-Agent Team Visualization**  
**Current product slice: AW17 — Evidence & Trace navigation (in progress)**

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
| Governed deep navigation | ✅ AW6 |
| Governed request actions + audit | ✅ AW7 |
| Persistent machine config + one-command launcher | ✅ AW8 |
| Governed request inbox/lifecycle | ✅ AW9 |
| Professional FR/EN Agency Agent Operator UX | ✅ AW9.1 |
| Persistent Agent Registry + Operator agent creation | ✅ AW10 |
| Persistent 3D astronaut per enabled AgentProfile | ✅ AW10 real-machine smoke |
| AgentProfile → mission topology links | ✅ AW11 real-machine smoke |
| Project → validated local Git workspace binding | ✅ AW12 real-machine smoke |
| Path-free workspace status in Agent World | ✅ AW12 |
| Governed execution lifecycle projection | ✅ AW13 |
| Real RUNNING → SUCCEEDED visualization | ✅ AW13 real-machine smoke |
| Compact AgentProfile capability visualization | ✅ AW14B real-machine smoke |
| Live SilverFlow team lifecycle visualization | ✅ AW15C real-machine smoke |
| Operator cleanup + FR/EN guide | ✅ Agency Agent AW16 |
| Agent World → Operator Evidence & Trace navigation | 🚧 AW17 in progress |

## Product model

```text
Agency Agent Operator
  projects
  persistent AgentProfiles
  governed tasks
  requests / approvals / audit
          │
          │ authoritative API + RBAC
          ▼
Agency Agent runtime
  SilverFlow / SilverGuard / Evaluator / Durable Knowledge
          │
          │ compact authenticated snapshot
          ▼
SilverKen Agent World
  Three.js / WebGL colony
          │
          ├─ project → zone
          ├─ persistent AgentProfile → astronaut identity
          ├─ task / mission → operational thread object
          ├─ state / evidence → animation + badges
          ├─ GitHub → PR / CI context
          ├─ navigation → Operator / GitHub
          └─ governed request → Agency Agent RBAC + audit
```

**Agency Agent is authoritative.** Agent World visualizes, navigates and records a deliberately small governed request vocabulary; it does not bypass RBAC, SilverGuard, verification, approvals, release gates or audit controls.

## AW10 — persistent agents

AW10 changes the meaning of an “agent” in the product.

Before AW10, task records carried a readable `owner_agent` string. After AW10, Agency Agent Operator also owns a durable project-scoped **Agent Registry**. Operators can create and configure persistent identities with role, model, description, allowed tools, allowed write paths and enabled/disabled state.

Once a project adopts the registry, new governed tasks select an enabled registered agent instead of relying on free text.

Agent World consumes the compact Agent Registry inventory from Agency Agent snapshot v1.1 and renders one persistent astronaut per enabled AgentProfile, even when the agent has no task. Mission/task objects remain separate for compatibility with AW1–AW9.

Real-machine Windows smoke validated:

```text
AgentProfile: Tuce-Frontend / FRONTEND                       ✅
Task owner selector: Tuce-Frontend · FRONTEND                ✅
Governed mission assigned to Tuce-Frontend                   ✅
Persistent 3D astronaut: Tuce-Frontend                       ✅
profile running: False                                       ✅ expected idle identity
profile archived: False                                      ✅
3D badge: AGENT · FRONTEND                                   ✅
Operator navigation from profile                             ✅
```

Creating an AgentProfile does **not** launch a model, run a tool, mutate a task or start an execution.

## AW11 — agent mission topology

AW11 makes mission ownership explicit in the 3D colony. Agency Agent task ownership is resolved against the AW10 Agent Registry, and Agent World carries the stable `agent_id` into normalized mission threads.

When a task is owned by a registered AgentProfile:

- the persistent agent identity is grouped beside its governed missions;
- Agent World draws a read-only 3D connector from the persistent agent site to each linked mission site;
- the task card shows `Mission · <agent>` in FR/EN;
- the relation is derived from the authoritative AgentProfile identity rather than inferred from display text.

Legacy tasks whose `owner_agent` cannot be resolved to a registered profile remain compatible and receive no invented topology link.

Real-machine Windows smoke on the clean `F:\\SilverKen` installation validated `Tuce-Frontend`, the assigned AW10 mission, the stable `agent_id`, the `Mission · Tuce-Frontend` badge, and one live Three.js mission connector.

## AW12 — project workspace binding

AW12 gives each Agency Agent project one optional authoritative local Git repository binding. Operator validates the exact Git root and keeps the absolute local path session-only. Agent World receives only a compact projection: repository basename, branch, HEAD, clean/dirty and valid/bound state.

Real-machine Windows validation used:

```text
F:\\SilverKen\\projects\\silverken-platform
```

with `SilverKen-Platform-Engineer` visible in the colony and the badge:

```text
Workspace · silverken-platform
```

A direct payload check confirmed that `F:\\SilverKen` is absent from Agent World data.

## AW13 — governed execution visualization

AW13 adds an explicit, Operator-controlled local execution path in Agency Agent and projects only compact run state into Agent World. Execution authority remains entirely in Agency Agent; Agent World cannot select a repository, model, tool grant, command prefix, write scope or start a run.

Real-machine Windows smoke validated the full path:

```text
Operator preflight: SilverKen-Platform-Engineer / silverken-platform / main / gpt-5.6-sol ✅
Agency Agent migration: 0004_execution_control                                        ✅
OpenAI provider + model configured                                                     ✅
RUNNING projected into Agent World                                                     ✅
mission + persistent AgentProfile active while RUNNING                                 ✅
Operator audit: execution.completed / SUCCESS                                          ✅
task lifecycle stopped at IMPLEMENTED                                                   ✅
Agent World terminal badge: Run · RÉUSSIE                                              ✅
bounded artifact: docs/AW13_SMOKE.md                                                   ✅
```

The smoke wrote only the explicitly authorized `docs/AW13_SMOKE.md` path. Agent World observed the lifecycle through snapshot v1.3 and never received execution authority or the absolute local workspace path.

## Quick start — local launcher

Requirements:

- Node.js **22.13+**
- npm
- recommended: sibling `agency-agent` checkout with its `.venv`

First time:

```powershell
npm ci
npm run setup
```

Edit the generated, Git-ignored machine file:

```text
config/agent-world.local.json
```

Store the Agency Agent API token under `agencyAgent.token`. GitHub credentials, when used, belong under `github.token`; they are separate credentials.

Check the machine:

```powershell
npm run doctor
```

Daily launch:

```powershell
npm run dev
```

With `agencyAgent.autoStart: true`, the launcher reuses an already healthy Agency Agent or starts the sibling `.venv` CLI and waits for `/health` before starting Agent World. Secret values are never printed.

See [`docs/local-launcher.md`](docs/local-launcher.md).

### Environment overrides

Environment variables remain supported and override the local file:

```powershell
$env:AGENCY_AGENT_URL="http://127.0.0.1:8787"
$env:AGENCY_AGENT_TOKEN="aa_your_token_here"
npm run dev
```

## French / English UI

Agent World exposes a compact **FR / EN** selector. Agency Agent Operator also has a persistent **FR / EN** toggle with translated business labels, clearer governed-request cards and integrated lifecycle forms.

## Governed request lifecycle

AW7 introduced narrow request intents:

```text
REQUEST_HUMAN_REVIEW
REQUEST_RISK_REVIEW
REQUEST_VERIFICATION_RETRY
```

AW9 made those requests human-trackable:

```text
RECORDED
   ↓
ACKNOWLEDGED
   ↓
RESOLVED
```

A lifecycle transition records human handling; it does **not** execute the requested operation. Real-machine validation confirmed `Enregistrée → Prise en compte → Résolue` in Operator and `Demande · RÉSOLUE` in Agent World while the underlying task remained `BACKLOG`.

## Governed Agency Agent integration

Agency Agent exposes one bounded project snapshot:

```text
GET /api/v1/projects/{project_id}/agent-world
```

The visualization receives only compact operational context required for the product: tasks, verification/activity summaries, governance state, governed-request lifecycle and a compact non-secret inventory of registered agents. Raw evidence bodies, bearer credentials and unrestricted policy state are not replicated.

AW17 keeps that boundary intact: task cards may expose a **Preuves & trace / Evidence & trace** link, but the detailed evidence, execution events, approvals and review reports are loaded only inside authenticated Agency Agent Operator.

## Optional GitHub context

For projects without a local checkout, map project names explicitly in the local configuration:

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

GitHub credentials remain server-side. Agency Agent `aa_...` credentials must never be placed in the GitHub token field.

See [`docs/github-context.md`](docs/github-context.md) and [`docs/github-branch-overrides.md`](docs/github-branch-overrides.md).

## Quality

```bash
npm audit --omit=dev --audit-level=high
npm test
npm run build
```

Latest completed Agent World milestone on `main`:

```text
AW15C
b0d562e4d03348f710cb5f82815ad912b631c0ff
```

AW15C validation recorded:

```text
Agent World Quality #82     ✅
runtime dependency audit    ✅
tests                       ✅
production build            ✅
real Windows live team smoke ✅
```

Paired Agency Agent milestones are also complete through AW16 on `main`. AW17 is intentionally split across the two repositories: Operator owns the detailed Evidence & Trace view; Agent World exposes only safe navigation to that authoritative surface and keeps detailed evidence out of the 3D payload.

## Roadmap

See [`ROADMAP.md`](ROADMAP.md).

```text
AW1   Bridge contract                         ✅
AW2   Repository bootstrap                    ✅
AW3   Live Agency Agent view                  ✅
AW4   SilverKen visual identity               ✅
I18N  French / English                        ✅
AW5   Governed evidence + GitHub PR/CI        ✅
AW6   Governed navigation                     ✅
AW7   Governed action requests                ✅
AW8   Productization & local launcher         ✅
AW9   Governed request inbox/lifecycle        ✅
AW9.1 Operator UX + FR/EN                     ✅
AW10  Persistent Agent Registry + 3D identity ✅
AW11  Agent Mission Topology                  ✅
AW12  Project Workspace Binding               ✅
AW13  Governed Execution Visualization        ✅
AW14B Compact Capability Visualization        ✅
AW15C Live Multi-Agent Team Visualization     ✅
AW16  Operator Cleanup & Guide (Agency Agent) ✅
AW17  Evidence & Trace navigation             🚧
```

## Upstream relationship

This fork deliberately keeps the Bot Crossing harness seam and core local-first philosophy intact. Upstream improvements are reviewed and selectively synced where they do not conflict with SilverKen governance or product direction.

- Upstream: `Station-Sciences/bot-crossing`
- SilverKen fork: `Silverken92/silverken-agent-world`
- License: MIT — see [`LICENSE`](LICENSE)
- Original creator: Jarren Rocks

## Security principles

- no writes into external harness-owned files or databases;
- Agency Agent access uses the Operator API, never direct database reads;
- Agency Agent and GitHub tokens stay server-side and are never placed in browser persistence or colony state;
- `config/agent-world.local.json` is ignored by Git;
- diagnostics report only whether a token is configured, never its value;
- governed actions are request-only and pass through Agency Agent RBAC/audit;
- persistent AgentProfile visualization is descriptive and cannot create, edit, enable, assign or execute an agent from the 3D layer;
- operational snapshots are data-minimized;
- visual state never constitutes release approval, PR merge evidence or security evidence unless the corresponding authoritative source explicitly reports it.

---

**SilverKen Agent World** — see the work, keep governance authoritative.
