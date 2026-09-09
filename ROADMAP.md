# SilverKen Agent World Roadmap

SilverKen Agent World evolves Bot Crossing into a governed visual operations surface for Agency Agent while preserving the local-first, read-only harness boundary.

## Principles

1. Agency Agent remains authoritative for task state, approvals, verification, security and release decisions.
2. Agent World is read-only until a later slice explicitly introduces governed actions through Agency Agent APIs.
3. No adapter writes to harness-owned files or databases.
4. Credentials remain server-side.
5. Upstream Bot Crossing improvements are synced selectively, not blindly.
6. Agency Agent release readiness and GitHub PR merge state remain separate evidence domains.

## AW1 — Bridge Contract ✅

Completed in `Silverken92/agency-agent`.

- define Agency Agent → Bot Crossing thread mapping;
- define read-only API-token integration;
- document security/governance boundary;
- preserve Operator API/RBAC as authority;
- add ADR-0014 to Agency Agent.

## AW2 — Repository Bootstrap ✅

Goal: establish a maintainable SilverKen fork with a tested Agency Agent harness.

Completed evidence:

- [x] fork `Station-Sciences/bot-crossing` as `Silverken92/silverken-agent-world`;
- [x] register `agency-agent` harness;
- [x] map Agency Agent task states into colony behavior;
- [x] add adapter unit tests;
- [x] rebrand package/app shell/README;
- [x] preserve MIT/upstream attribution;
- [x] add hardened repository CI with runtime dependency audit;
- [x] PR #1 quality gate passes;
- [x] 39/39 tests pass;
- [x] production build passes;
- [x] squash merge to `main` at `1705be2f823f30a18352561b5460d98da28bb314`;
- [x] post-merge `main` quality gate passes.

## AW3 — Live Agency Agent View ⚙️

Goal: prove end-to-end operation against a real local Agency Agent instance and make connection failures understandable.

Code/CI complete:

- [x] detect the Agency Agent Operator API through public `/health`;
- [x] keep bearer authentication server-side;
- [x] report a missing token explicitly;
- [x] distinguish rejected and under-authorized tokens;
- [x] avoid throwing the colony scan for expected auth failures;
- [x] fixture-backed live project/task API scan tests;
- [x] verify normalized threads contain no bearer credential;
- [x] PR #2 quality gate passes;
- [x] squash merge to `main` at `476e1a36f06edc32e4d0a76dc27f9c89173d6fc9`;
- [x] post-merge `main` quality gate passes;
- [ ] exercise against a real operator machine with a real Agency Agent API token;
- [ ] observe real task state transitions in the running colony.

AW3 remains operator-smoke pending because the Operator API is intentionally local/private. The exact procedure is documented in `docs/local-smoke.md`.

## AW4 — SilverKen Visual Identity ✅

Goal: make the product visually distinct while retaining the proven colony engine and keeping upstream sync inexpensive.

Completed evidence:

- [x] dedicated `silverken.css` product skin rather than rewriting upstream HUD CSS;
- [x] dedicated idempotent branding layer rather than forking `hud.js` wholesale;
- [x] SilverKen monogram and two-line Agent World brand header;
- [x] persistent `Governed view / Read only` system indicator;
- [x] graphite/silver + violet/cyan product palette;
- [x] SilverKen boot screen and favicon treatment;
- [x] refined operator vocabulary (`active`, `needs input`, `failed`, `released`);
- [x] `repo` → `project` and `conversation` → `session` product vocabulary where appropriate;
- [x] SilverKen help/governance explanation;
- [x] visual identity architecture documentation;
- [x] PR #3 quality gate passes;
- [x] squash merge to `main` at `35530844900e8a6b06149251d88007238e59b051`;
- [x] post-merge `main` quality gate passes.

Role-specific operational evidence intentionally moved to AW5 so AW4 remained a presentation-only layer.

## AW5 — Operational Enrichment 🚧

Goal: surface high-value delivery context next to the world without turning Agent World into a second evidence store.

### AW5A — Governed Agency Agent evidence ✅

Agency Agent side:

- [x] add one bounded read-only project snapshot: `GET /api/v1/projects/{project_id}/agent-world`;
- [x] require bearer authentication and explicit project/task/run/evidence/security read permissions;
- [x] compact task fields rather than returning the complete task contract;
- [x] aggregate verification counts;
- [x] expose latest agent/activity plus token/cost telemetry;
- [x] expose compact independent Evaluator verdict;
- [x] expose compact SilverGuard disposition/finding counts;
- [x] expose compact Agency Agent release disposition/readiness;
- [x] exclude raw evidence bodies, summaries, acceptance checks, policy and credentials;
- [x] Agency Agent PR #13 Repository Quality passes — 71 tests plus PostgreSQL/container production gates;
- [x] squash merge to Agency Agent `main` at `dc9cf4b4726d2ee686655d5d2221fce169261978`;
- [x] post-merge Agency Agent Repository Quality passes all three jobs.

Agent World side:

- [x] consume one `/agent-world` snapshot per project;
- [x] retain `/tasks` fallback only for an older API returning 404;
- [x] surface execution model, owner and most recent agent;
- [x] surface verification counts;
- [x] surface Evaluator and SilverGuard verdict/disposition;
- [x] surface Agency Agent release readiness without setting `prState`;
- [x] surface compact token/cost telemetry;
- [x] keep enrichment in additive SilverKen UI modules instead of rewriting the upstream HUD;
- [x] add local smoke instructions for Windows/macOS/Linux;
- [x] Agent World PR #4 quality gate passes — 47/47 tests, runtime audit and production build;
- [x] squash merge Agent World PR #4 to `main` at `d2d9d7e7d5f631edb1e0107bf5061581b14b4c31`;
- [x] post-merge Agent World quality gate passes;
- [ ] real-machine smoke with local Agency Agent token.

The only remaining AW3/AW5A proof is operator-machine live observation, because the Operator API intentionally remains local/private.

### AW5B — GitHub / PR / CI context ⏭️

Still planned:

- explicitly linked GitHub PR number/state;
- CI/check status;
- real merged-PR evidence for celebration behavior;
- links/evidence useful for AW6 navigation.

GitHub data must remain evidence/context and must not replace Agency Agent release gates.

## AW6 — Governed Navigation

Goal: make Agent World a fast visual entry point into authoritative systems.

Examples:

- open Agency Agent Operator task page;
- open GitHub PR;
- open repository/worktree;
- open relevant logs/evidence.

Navigation must not mutate governed state, and no bearer token may appear in a URL.

## AW7 — Optional Governed Actions

Goal: evaluate a small set of explicit actions only if they can be routed through Agency Agent authorization and audit boundaries.

Possible examples:

- acknowledge/view attention;
- request a governed retry;
- submit an approval through the Operator API.

Non-negotiable conditions:

- no direct database mutation;
- no bypass of RBAC/CSRF/token rules;
- no release/security shortcut;
- every mutation auditable in Agency Agent;
- dedicated threat review before enabling actions.

## Upstream sync policy

For each upstream Bot Crossing update:

1. inspect upstream diff;
2. identify changes to harness contract, scanner, state persistence, launch behavior or client payloads;
3. verify SilverKen security assumptions still hold;
4. sync on a branch;
5. run full tests/build;
6. merge only after review.
