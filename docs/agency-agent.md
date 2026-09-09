# Agency Agent Integration

This document defines the SilverKen Agent World integration with Agency Agent.

## Boundary

Agent World is a **read-only consumer** of the Agency Agent Operator API.

It must not:

- write directly to Agency Agent databases;
- bypass Operator API authentication or project RBAC;
- store bearer tokens in colony state, thread refs or browser-persisted state;
- replicate raw evaluator, security or release evidence unnecessarily;
- represent visual state as authoritative approval/security/release evidence;
- create, retry, approve, release or otherwise mutate Agency Agent work before a separately governed mutation slice.

## Configuration

Start Agency Agent's Operator API, create a bearer token through the trusted Operator administration boundary, then launch Agent World from the same shell environment:

```bash
export AGENCY_AGENT_URL=http://127.0.0.1:8787
export AGENCY_AGENT_TOKEN=aa_your_token_here
npm run dev
```

`AGENCY_AGENT_URL` defaults to `http://127.0.0.1:8787`.

`AGENCY_AGENT_TOKEN` has no default.

See [`local-smoke.md`](local-smoke.md) for complete Windows, macOS and Linux instructions.

## Discovery and diagnostics

AW3 separates **service discovery** from **authorization**.

The adapter first probes the public Agency Agent health endpoint:

```text
GET /health
```

It expects:

```json
{
  "status": "ok",
  "service": "agency-agent-operator"
}
```

That means Agent World can show Agency Agent as installed/running even when the bearer token has not been configured yet.

The harness diagnostic distinguishes:

| Situation | Result |
| --- | --- |
| Operator API not reachable | harness absent; no noisy error |
| API healthy, token missing | explicit token-not-configured diagnostic |
| API healthy, token returns `401` | token rejected/expired diagnostic |
| API healthy, token returns `403` | token accepted but under-authorized diagnostic |
| API healthy, token authorized | no diagnostic; tasks can be scanned |

Network/API probes are bounded with a short timeout so a dead local service cannot stall colony polling indefinitely.

## Authenticated API reads

AW5 uses:

```text
GET /api/v1/projects
GET /api/v1/projects/{project_id}/agent-world
```

The second route is a bounded snapshot produced by Agency Agent specifically for the visual operations surface. Agent World makes one snapshot request per authorized project rather than multiplying evidence calls for every task.

For compatibility while upgrading an older local Agency Agent checkout, Agent World falls back to:

```text
GET /api/v1/projects/{project_id}/tasks
```

**only** when the snapshot route returns `404`. Authentication/authorization or server failures do not silently downgrade the security/data contract.

The bearer token is sent only in the server-side request header:

```text
Authorization: Bearer <token>
```

No token value is copied into normalized thread data, `ref`, operational metadata or colony persistence.

## AW5 snapshot data

The Agency Agent snapshot is intentionally data-minimized. Per task it exposes compact operational fields required by the 3D view:

- task id/objective/status/risk/execution model;
- owner agent and workspace hints;
- task timestamps;
- verification counts;
- event count, latest activity and most recent agent;
- aggregate token usage and reported cost;
- compact independent Evaluator verdict;
- compact SilverGuard disposition and finding counts;
- compact Agency Agent release disposition/readiness.

It does **not** replicate raw evidence bodies, evaluator/security/release summaries, acceptance checks, tool policy or credentials.

The Agency Agent endpoint is merged on its authoritative repository at:

```text
dc9cf4b4726d2ee686655d5d2221fce169261978
```

Its post-merge Repository Quality passes runtime/docs, PostgreSQL production smoke and constrained-container production smoke.

## Mapping

The adapter translates each task/snapshot record into the Bot Crossing `Thread` contract.

| Thread field | Agency Agent source |
| --- | --- |
| `id` | `agency-agent:<project_id>:<task_id>` |
| `title` / `preview` | task objective |
| `project` | Operator project name/slug |
| `worktree` | workspace isolation ID when mode is `WORKTREE` |
| `gitBranch` | workspace integration target |
| `model` | SilverKen compact display payload for enriched records, execution model for legacy fallback |
| `effort` | risk level |
| `createdAt` | task creation timestamp |
| `lastActivityAt` | newest of task update and snapshot activity timestamp |
| `running` | active implementation/review states |
| `unread` | blocked/human-decision states |
| `hasError` | `FAILED_VERIFICATION` |
| `archived` | `DONE` |
| `source` | `agency-agent` |
| `operational` | compact AW5 operational object when available |

The `ref` object remains deliberately small:

```text
projectId
taskId
status
ownerAgent
```

## Operational badges

For an enriched Agency Agent astronaut, the SilverKen UI can render available badges for:

```text
execution model
owner agent
most recent active agent
verification pass/total
Evaluator verdict
SilverGuard disposition
Agency Agent release gate
token usage
reported cost
```

The UI layer decodes and formats those values without importing governance logic into the Three.js engine.

`Release · READY` is explicitly **not** GitHub PR merge evidence. The adapter does not set `prState` from Agency Agent release readiness, so the upstream merged-PR celebration cannot be faked by a release-gate signal.

## State semantics

Working:

```text
IN_PROGRESS
IMPLEMENTED
QA_REVIEW
SECURITY_REVIEW
FINAL_REVIEW
```

Needs human attention:

```text
BLOCKED
NEEDS_USER_DECISION
RISK_ACCEPTANCE_REQUIRED
```

Error:

```text
FAILED_VERIFICATION
```

Retired:

```text
DONE
```

Other states remain visible as idle/non-attention work unless the upstream colony's dormant rules hide their zone.

## Opening and creating sessions

For the current bridge:

```text
openThread()  -> disabled
newSession()  -> disabled
```

That is deliberate. Agency Agent has stronger authorization/governance semantics than a local deep link. Governed navigation is deferred to AW6; governed mutations are deferred to AW7.

## Failure isolation

The upstream harness scanner isolates adapters. If Agency Agent is unavailable or one project cannot be read, other harnesses continue to scan.

Within the Agency Agent adapter, an unreadable project is skipped with a warning rather than aborting the whole Agency Agent scan.

## Tests

`test/agency-agent.test.mjs` verifies:

- active-state mapping;
- human-attention mapping;
- verification-failure mapping;
- completion/archive mapping;
- stable prefixed IDs;
- branch/worktree mapping;
- credential-free refs;
- no write method;
- disabled open/new-session behavior;
- public health discovery without a token;
- missing-token and rejected-token diagnostics;
- AW5 snapshot scanning through a mocked Operator API;
- one bounded snapshot call per project;
- compatibility fallback only on snapshot `404`;
- compact verification/Evaluator/SilverGuard/release/activity mapping;
- no PR merge state inferred from release readiness;
- server-side bearer header usage;
- bearer credential absence from normalized thread JSON;
- clean absence when the Operator API cannot be reached.

`test/operational.test.mjs` verifies the SilverKen display decoder and badge presentation, including explicit failure styling and the distinction between release readiness and GitHub merge evidence.

The AW5 Agent World branch quality gate passes **47/47 tests**, runtime dependency audit and production Vite build.

## Real-machine smoke

The remaining end-to-end proof must run on the operator's machine because the Operator API is intentionally local/private.

Use [`local-smoke.md`](local-smoke.md). The smoke closes the real-machine part of AW3 and validates AW5 against live Agency Agent state.

The key proof is:

```text
Agency Agent /health                     PASS
bearer project discovery                 PASS
AW5 project snapshot                     PASS
project zone visible                     PASS
task astronaut visible                   PASS
working/attention/failure mapping        PASS
operational badges                       PASS
no mutation from Agent World             PASS
```

## Next enrichment

AW5B can add explicitly linked GitHub PR/CI context. GitHub state remains evidence/context rather than a replacement for Agency Agent release gates, and merged-PR celebration must only come from real merged-PR evidence.
