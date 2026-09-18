# SilverKen Agent World Roadmap

SilverKen Agent World evolves Bot Crossing into a governed visual operations surface for Agency Agent while preserving a narrow, explicit trust boundary.

## Principles

1. Agency Agent remains authoritative for task state, approvals, verification, security and release decisions.
2. Agent World may navigate and record explicitly governed requests, but it is not an execution authority.
3. No adapter writes to harness-owned files or databases.
4. Credentials remain server-side and machine-local secrets are never committed.
5. Upstream Bot Crossing improvements are synced selectively, not blindly.
6. Agency Agent release readiness and GitHub PR merge state remain separate evidence domains.

## AW1 — Bridge Contract ✅

Completed in `Silverken92/agency-agent`.

- Agency Agent → Bot Crossing thread mapping defined;
- authenticated API-token integration defined;
- security/governance boundary documented;
- Operator API/RBAC remains authoritative;
- ADR-0014 added to Agency Agent.

## AW2 — Repository Bootstrap ✅

- fork `Station-Sciences/bot-crossing` as `Silverken92/silverken-agent-world`;
- register `agency-agent` harness;
- preserve MIT/upstream attribution;
- hardened CI with runtime dependency audit;
- initial quality gate and production build green.

## AW3 — Live Agency Agent View ✅

- public `/health` detection;
- server-side bearer authentication;
- missing/rejected/under-authorized token diagnostics;
- normalized threads contain no bearer credential;
- real Windows smoke with a real Agency Agent token;
- real `Tuce` project/task rendered in the live 3D colony.

## AW4 — SilverKen Visual Identity ✅

- additive SilverKen product skin and branding layer;
- governed-view indicator;
- graphite/silver + violet/cyan palette;
- operator-oriented vocabulary and help surface;
- upstream renderer kept largely intact.

## FR/EN Localization ✅

- additive FR/EN localization layer;
- browser-language detection and locally persisted preference;
- French governance and operational labels;
- MutationObserver freeze regression fixed;
- real Windows smoke confirms stable French UI.

## AW5 — Operational Enrichment ✅

### AW5A — Governed Agency Agent evidence ✅

- bounded `GET /api/v1/projects/{project_id}/agent-world` snapshot;
- owner/current agent, verification, Evaluator, SilverGuard and release context;
- aggregate token/cost telemetry;
- raw evidence/policy/credentials excluded;
- real Windows 3D smoke.

### AW5B — GitHub / PR / CI context ✅

- optional, server-side GitHub enrichment;
- repository and branch mapping for projects without local checkout;
- PR state and CI/check aggregation;
- real GitHub `merged_at` is the only GitHub evidence that sets `MERGED`;
- real Windows smoke: PR #11 `OPEN → MERGED`, CI `PASS 1/1`.

Agency Agent `Livraison · PRÊT` and GitHub `PR · FUSIONNÉE` remain separate evidence domains.

## AW6 — Governed Navigation ✅

- safe deep link to the authoritative Agency Agent Operator UI;
- project/task automatically selected;
- GitHub PR/repository navigation guarded by scheme/host/path validation;
- no bearer token in URLs;
- real Windows smoke confirms `Ouvrir dans Operator` opens the correct `Tuce` task/evidence.

## AW7 — Governed Action Requests ✅

Goal: allow a very small set of explicit requests from the 3D surface while Agency Agent remains the only authority that can decide or execute sensitive operations.

Implemented request vocabulary:

```text
REQUEST_HUMAN_REVIEW
REQUEST_RISK_REVIEW
REQUEST_VERIFICATION_RETRY
```

Completed controls:

- one contextual request button per Agency Agent task card;
- mandatory human rationale;
- loopback-only Agent World request gateway;
- canonical thread re-resolution server-side before forwarding;
- Agency Agent bearer token remains server-side;
- dedicated `action.request` RBAC permission;
- VIEWER remains read-only;
- durable `governed_action.requested` Operator audit event;
- no task transition, approval decision, tool execution, file write, verification retry or PR merge is executed by the request itself;
- Vite development route wired and integration-tested;
- request success state persists across card rerenders and disables duplicate clicks for the current page session.

Real-machine evidence on Windows:

```text
3D request button            ✅
mandatory rationale          ✅
Demande enregistrée ✓        ✅
Audit outcome SUCCESS        ✅
action REQUEST_HUMAN_REVIEW ✅
source silverken-agent-world ✅
```

## AW8 — Productization & Local Launcher ✅

Goal: make the local product usable every day without re-entering environment variables or manually coordinating two terminals.

Completed implementation:

- Git-ignored `config/agent-world.local.json` machine config;
- committed safe template `config/agent-world.example.json`;
- environment variables remain higher-priority overrides;
- config loader maps existing Agency Agent and GitHub env contracts without exposing secrets;
- `npm run setup` creates the local template once and never overwrites it;
- `npm run doctor` reports Node/config/health/mapping status without printing token values;
- `npm run dev` is the cross-platform local launcher;
- optional Agency Agent auto-start from a sibling `.venv` checkout;
- existing healthy Agency Agent process is reused rather than duplicated;
- launcher waits for `/health` before starting the 3D app;
- Vite and production server load the same machine config;
- no new runtime dependency.

Real-machine Windows evidence confirms one-command boot, machine-local secret loading, Agent World FR UI and automatic Agency Agent availability.

## AW9 — Governed Request Inbox & Lifecycle ✅

Goal: turn AW7 request audit rows into durable, human-trackable work items without making Agent World an execution authority.

Completed implementation:

- request inbox projected from the durable Agency Agent audit stream;
- strict lifecycle `RECORDED → ACKNOWLEDGED → RESOLVED`;
- no direct status skip or rollback;
- each transition produces its own audit event;
- Operator `Requests` tab with lifecycle controls;
- Agent World receives compact lifecycle state only, without rationale text;
- duplicate contextual requests are blocked while an equivalent request remains open;
- resolved requests remain visible and allow a future new request.

AW9.1 added a professional FR/EN Operator cockpit with translated business labels, integrated transition forms, clearer status cards and explanatory governance copy.

Real-machine Windows evidence:

```text
Operator: Enregistrée → Prise en compte → Résolue ✅
Agent World: Demande · RÉSOLUE                 ✅
request payload: RESOLVED / REQUEST_HUMAN_REVIEW ✅
underlying task remained BACKLOG               ✅
```

## AW10 — Persistent Agent Registry & Operator Creation ✅

Goal: make Agency Agent Operator the authoritative place to create and configure persistent governed agent identities, then visualize those identities in Agent World independently of any one task.

Completed implementation:

- durable project-scoped `AgentProfile` registry;
- migration `0002_agent_registry`;
- Agent Registry create/update/enable controls in Operator;
- FR/EN registry UI;
- role, model, description, allowed tools and allowed write paths;
- `agent.read` / `agent.manage` RBAC permissions and audit events;
- task creation selects from enabled registered agents once a project adopts the registry;
- Agent World snapshot v1.1 carries a compact non-secret agent inventory;
- one persistent 3D astronaut per enabled AgentProfile, even when idle;
- task/mission threads remain distinct for AW1–AW9 compatibility;
- profile cards navigate back to Operator and cannot submit task-governed requests;
- disabled profiles leave the active colony.

Quality evidence:

```text
Agency Agent main: 4ab0deb2d513a99a78abe71c3a4d01b659c02b19 ✅
Repository Quality / PostgreSQL / container production smokes              ✅
Agent World main: 8f12ad279353b6c1b5edc78a10a948e7133a7827            ✅
Agent World Quality: runtime audit + 89/89 tests + build                    ✅
```

Real-machine Windows evidence:

```text
AgentProfile: Tuce-Frontend / FRONTEND                         ✅
Operator task assignment selector: Tuce-Frontend · FRONTEND   ✅
Mission: Smoke AW10 - mission assignée à Tuce-Frontend        ✅
Persistent 3D profile id: agency-agent-profile:...             ✅
project: Tuce                                                   ✅
running: False                                                  ✅ expected idle identity
archived: False                                                 ✅
role: FRONTEND                                                  ✅
3D card: AGENT · FRONTEND / Responsable · Tuce-Frontend        ✅
```

AW10 therefore meets its real-machine exit criteria: an agent can be created in Operator, assigned governed work, and exist as a persistent 3D identity without an implicit execution side effect.

## AW11 — Agent Mission Topology ✅

Goal: make the 3D colony explain who owns each governed mission by linking task/mission objects to the persistent AgentProfile that Agency Agent assigned.

Completed implementation:

- mission threads resolve their registered AgentProfile through the AW10 snapshot;
- the normalized relation carries the stable `agent_id` plus display name;
- persistent agent identities are ordered beside their explicitly assigned missions;
- Agent World draws a read-only visual connector from the persistent agent site to each linked mission site;
- task cards expose `Mission · <agent>` in FR/EN instead of relying on an ambiguous owner label;
- legacy tasks without a resolvable AgentProfile remain unchanged and receive no inferred link;
- no task state, assignment, AgentProfile or source system is mutated by topology rendering.

Real-machine Windows smoke from the clean `F:\\SilverKen` installation:

```text
explicit agent_id relation in /api/threads        ✅
persistent agent beside assigned mission          ✅
3D missionLinks renderer created 1 connector       ✅
FR/EN mission ownership badge                      ✅
unregistered legacy mission remains compatible     ✅
Tuce-Frontend / Smoke AW10 topology                 ✅
```

Observed stable relation:

```text
agentId    : agt_602488cb41d8471f8939b7e54a75fe84
agentName  : Tuce-Frontend
ownerAgent : Tuce-Frontend
```

Browser runtime proof reported `missionLinks.group.children.length === 1`, confirming that the Three.js topology layer created the agent → mission connector in the live scene.

AW11 therefore meets its exit criteria: Agent World now visualizes explicit, stable AgentProfile ownership of governed missions without inventing links for legacy free-form task owners or changing the Agency Agent authority boundary.

## AW12 — Project Workspace Binding ✅

Goal: give each Agency Agent project one authoritative local Git repository binding before any future governed execution can target real code.

Completed implementation:

- Agency Agent owns the durable workspace binding and validates the exact Git root;
- full absolute paths remain Operator-session-only;
- Agent World snapshot v1.2 receives only repository basename, branch, HEAD, clean/dirty and valid/bound state;
- Agent World normalizes only that compact projection and discards unknown/path fields;
- task and persistent-agent cards show a `Workspace · <repository>` operational badge;
- workspace status remains descriptive: Agent World still cannot bind a repo or launch execution.

Real-machine Windows smoke:

```text
Agency Agent migration 0003 + RBAC/API          ✅
Operator binding: silverken-platform             ✅
Git root: F:\\SilverKen\\projects\\silverken-platform ✅
Agent World receives no absolute local path      ✅
Workspace · silverken-platform badge             ✅
AgentProfile visible in 3D colony                ✅
Agency Agent + Agent World quality gates green   ✅
```

The live Agent World payload test returned `False` for a search of `F:\\SilverKen`, proving that the local absolute path stays outside the browser-facing projection.

## After AW12

Candidate future work, not pre-approved:

- agent templates/presets and richer capability policy authoring;
- explicit execution controls and run lifecycle only through separate ADR/RBAC/idempotency work;
- optional desktop packaging / tray launcher;
- richer evidence/log navigation;
- upstream Bot Crossing sync automation;
- cleanup/automation for stale development branches.

Any automatic execution still requires a separate ADR, explicit state machine, idempotency semantics, failure/retry policy and security review.

## Upstream sync policy

For each upstream Bot Crossing update:

1. inspect upstream diff;
2. identify changes to harness contract, scanner, state persistence, launch behavior or client payloads;
3. verify SilverKen security assumptions still hold;
4. sync on a branch;
5. run full tests/build;
6. merge only after review.
