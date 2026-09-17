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

- Agency Agent → Bot Crossing thread mapping defined;
- authenticated read-only API-token integration defined;
- security/governance boundary documented;
- Operator API/RBAC remains authoritative;
- ADR-0014 added to Agency Agent.

## AW2 — Repository Bootstrap ✅

Goal: establish a maintainable SilverKen fork with a tested Agency Agent harness.

Completed evidence:

- fork `Station-Sciences/bot-crossing` as `Silverken92/silverken-agent-world`;
- register `agency-agent` harness;
- map Agency Agent states into colony behavior;
- preserve MIT/upstream attribution;
- hardened CI with runtime dependency audit;
- PR #1 quality gate passes — 39/39 tests + production build;
- squash merge to `main` at `1705be2f823f30a18352561b5460d98da28bb314`;
- post-merge `main` quality gate passes.

## AW3 — Live Agency Agent View ✅

Goal: prove end-to-end operation against a real local Agency Agent instance and make connection failures understandable.

Completed evidence:

- public `/health` detection;
- server-side bearer authentication;
- missing/rejected/under-authorized token diagnostics;
- expected auth failures isolated from the colony scan;
- normalized threads contain no bearer credential;
- PR #2 merged at `476e1a36f06edc32e4d0a76dc27f9c89173d6fc9`;
- real Windows smoke with a real Agency Agent token;
- `/health`, authenticated project discovery and `/api/threads` verified;
- real `Tuce` project/task rendered in the live 3D colony.

## AW4 — SilverKen Visual Identity ✅

Goal: make the product visually distinct while retaining the proven colony engine and keeping upstream sync inexpensive.

Completed evidence:

- additive `silverken.css` product skin;
- idempotent branding layer;
- SilverKen monogram/header and `Governed view / Read only` indicator;
- graphite/silver + violet/cyan palette;
- operator-oriented vocabulary and help surface;
- PR #3 merged at `35530844900e8a6b06149251d88007238e59b051`;
- post-merge quality gate passes.

## FR/EN Localization ✅

Goal: make the 3D operational surface usable in French without creating an expensive upstream fork.

Completed evidence:

- additive `i18n.js` / `i18n.css` layer;
- compact FR/EN selector;
- browser-language detection on first use;
- locally persisted preference;
- reversible French/English primary HUD and governance labels;
- French Agency Agent/GitHub badges without changing evidence semantics;
- PR #6 merged at `70fb8d82359eeb43a2f97be3343c7466fcb85e07`;
- i18n freeze regression fixed by the MutationObserver hotfix at `64e74fd435767c7af241b906a52299782a9336ef`;
- real Windows smoke confirms the French 3D UI is stable and responsive.

## AW5 — Operational Enrichment ✅

Goal: surface high-value delivery context without turning Agent World into a second evidence store.

### AW5A — Governed Agency Agent evidence ✅

Agency Agent side:

- one bounded read-only project snapshot: `GET /api/v1/projects/{project_id}/agent-world`;
- bearer auth + scoped read permissions;
- compact task contract;
- verification counts, latest agent/activity, token/cost telemetry;
- Evaluator verdict, SilverGuard disposition and release readiness;
- raw evidence/policy/credentials excluded;
- Agency Agent PR #13 passes Repository Quality — 71 tests + PostgreSQL/container gates;
- squash merge to Agency Agent `main` at `dc9cf4b4726d2ee686655d5d2221fce169261978`.

Agent World side:

- consume one `/agent-world` snapshot per project;
- `/tasks` fallback only for older APIs returning 404;
- surface execution model, owner/current agent, verification, Evaluator, SilverGuard, release, tokens/cost;
- Agency Agent release readiness never sets GitHub `prState`;
- PR #4 passes — 47/47 tests, audit and build;
- squash merge at `d2d9d7e7d5f631edb1e0107bf5061581b14b4c31`;
- real Windows smoke confirms live governed data in the 3D colony.

### AW5B — GitHub / PR / CI context ✅

Goal: add delivery evidence without confusing GitHub state with Agency Agent governance.

Implementation evidence:

- optional GitHub enrichment disabled by default;
- server-side token only; no credential in normalized thread, `ref`, SKOPS payload or colony state;
- GET-only GitHub API access;
- 30-second cache, bounded request timeout and bounded enriched-thread count;
- automatic `github.com` origin/branch resolution for local harness checkouts;
- explicit Agency Agent project → GitHub repository mapping;
- explicit project → branch override for projects with no local checkout/branch;
- thread-provided branch evidence remains authoritative over an override;
- PR number/state and checks + legacy status aggregation;
- real GitHub `merged_at` is the only GitHub evidence that sets `prState=MERGED`;
- compact GitHub / PR / CI badges in English and French;
- GitHub failures/rate limits/auth failures degrade to the original harness thread;
- configuration and security documentation in `docs/github-context.md` and `docs/github-branch-overrides.md`.

Quality evidence:

- PR #7 initial AW5B implementation — 59/59 tests + audit + build;
- squash merge at `3b70f947121f4eca3637c47e2087d79243f52f59`;
- PR #10 branch-mapping hardening — 64/64 tests + audit + build;
- squash merge at `dfb5e3f620219fb7a2327c0d1b2501a6809c8857`.

Real-machine smoke evidence:

- real Windows Operator machine;
- Agency Agent harness `detected=true` with authenticated `Tuce` thread;
- `Tuce` explicitly mapped to `Silverken92/silverken-agent-world`;
- `Tuce` explicitly mapped to branch `smoke/aw5b-live`;
- real PR #11 detected as `OPEN`;
- real GitHub Actions result detected as `CI PASS 1/1`;
- PR #11 squash-merged at `de81cba747307e0823bb6c6c99b93eb8cf7950a5`;
- same live thread refreshed to `prState=MERGED` while CI remained PASS;
- smoke marker removed after validation.

Agency Agent `Livraison · PRÊT` and GitHub `PR #… · FUSIONNÉE` remain deliberately separate evidence domains.

## AW6 — Governed Navigation ⏭️ CURRENT

Goal: make Agent World a fast visual entry point into authoritative systems while remaining read-only.

Planned scope:

- open the corresponding Agency Agent Operator task page;
- open a real GitHub PR when `prUrl` is available;
- open repository/worktree/folder when supported by the source harness;
- expose relevant logs/evidence navigation without copying credentials into URLs;
- distinguish unavailable navigation from auth/permission failures;
- preserve the browser/server trust boundary.

Exit criteria:

- navigation targets are derived only from authoritative normalized metadata;
- no bearer token appears in a URL, DOM data attribute or browser-persisted state;
- navigation actions do not mutate Agency Agent or GitHub state;
- unit tests cover allowed/denied/unavailable navigation paths;
- real-machine smoke verifies at least Operator task + GitHub PR navigation.

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
