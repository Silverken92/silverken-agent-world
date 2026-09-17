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
3D request button          ✅
mandatory rationale        ✅
Demande enregistrée ✓      ✅
Audit outcome SUCCESS      ✅
action REQUEST_HUMAN_REVIEW ✅
source silverken-agent-world ✅
```

Multiple audit rows created during debugging are expected historical requests; after the final UX hotfix, the success button remains disabled for the page session to reduce accidental duplicates.

## AW8 — Productization & Local Launcher 🟠 CURRENT

Goal: make the local product usable every day without re-entering environment variables or manually coordinating two terminals.

Current implementation scope:

- Git-ignored `config/agent-world.local.json` machine config;
- committed safe template `config/agent-world.example.json`;
- environment variables remain higher-priority overrides;
- config loader maps existing Agency Agent and GitHub env contracts without exposing secrets;
- `npm run setup` creates the local template once and never overwrites it;
- `npm run doctor` reports Node/config/health/mapping status without printing token values;
- `npm run dev` becomes the local launcher;
- optional Agency Agent auto-start from a sibling `.venv` checkout;
- existing healthy Agency Agent process is reused rather than duplicated;
- launcher waits for `/health` before starting the 3D app;
- Vite and production server load the same machine config;
- no new runtime dependency.

Exit criteria:

- CI audit/tests/build green;
- tests prove local config does not expose token values in diagnostics;
- tests prove environment variables override the local file;
- tests reject embedded credentials / non-http Agency Agent URLs;
- Windows smoke: `npm run setup` → one local edit → `npm run doctor` → `npm run dev`;
- Windows smoke proves Agency Agent auto-start when stopped;
- Agent World still shows `Tuce`, FR UI and governed request/navigation after launcher boot;
- roadmap promoted to AW8 complete only after the real-machine smoke.

## After AW8

Candidate future work, not pre-approved:

- AW9 governed request inbox / lifecycle (`RECORDED → ACKNOWLEDGED → RESOLVED`);
- optional desktop packaging / tray launcher;
- richer evidence/log navigation;
- idempotent execution workers for narrowly approved request classes;
- upstream Bot Crossing sync automation;
- cleanup/automation for stale development branches.

Any automatic execution from a request still requires a separate ADR, explicit state machine, idempotency semantics, failure/retry policy and security review.

## Upstream sync policy

For each upstream Bot Crossing update:

1. inspect upstream diff;
2. identify changes to harness contract, scanner, state persistence, launch behavior or client payloads;
3. verify SilverKen security assumptions still hold;
4. sync on a branch;
5. run full tests/build;
6. merge only after review.
