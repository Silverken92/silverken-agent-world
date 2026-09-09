# SilverKen Agent World Roadmap

SilverKen Agent World evolves Bot Crossing into a governed visual operations surface for Agency Agent while preserving the local-first, read-only harness boundary.

## Principles

1. Agency Agent remains authoritative for task state, approvals, verification, security and release decisions.
2. Agent World is read-only until a later slice explicitly introduces governed actions through Agency Agent APIs.
3. No adapter writes to harness-owned files or databases.
4. Credentials remain server-side.
5. Upstream Bot Crossing improvements are synced selectively, not blindly.

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

## AW3 — Live Agency Agent View 🚧

Goal: prove end-to-end operation against a real local Agency Agent instance and make connection failures understandable.

Implemented in the AW3 branch:

- [x] detect the Agency Agent Operator API through public `/health`;
- [x] keep bearer authentication server-side;
- [x] report a missing token explicitly;
- [x] distinguish rejected and under-authorized tokens;
- [x] avoid throwing the colony scan for expected auth failures;
- [x] fixture-backed live project/task API scan tests;
- [x] verify normalized threads contain no bearer credential;
- [ ] exercise against a real operator machine with a real Agency Agent API token;
- [ ] observe real task state transitions in the running colony.

Exit signal: a real Agency Agent project can be watched live in the colony with no write path from Agent World.

## AW4 — SilverKen Visual Identity

Goal: make the product visually distinct while retaining the proven colony engine.

Planned work:

- SilverKen naming throughout UI chrome;
- visual language for SilverFlow, SilverGuard, QA, evaluator and release roles;
- role-aware markers/props/buildings;
- refined status labels and help text;
- retain accessibility and performance characteristics.

## AW5 — Operational Enrichment

Goal: surface high-value delivery context next to the world.

Candidate data:

- task owner/role;
- verification state and counts;
- SilverGuard disposition;
- release readiness;
- branch/worktree;
- GitHub PR number/state;
- CI status;
- token/cost/runtime metrics when authoritative data is available.

GitHub data must be treated as evidence/context, not as a replacement for Agency Agent release gates.

## AW6 — Governed Navigation

Goal: make Agent World a fast visual entry point into authoritative systems.

Examples:

- open Agency Agent Operator task page;
- open GitHub PR;
- open repository/worktree;
- open relevant logs/evidence.

Navigation must not mutate governed state.

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
