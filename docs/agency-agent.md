# Agency Agent Integration

This document defines the SilverKen Agent World integration with Agency Agent.

## Boundary

Agent World is a **read-only consumer** of the Agency Agent Operator API.

It must not:

- write directly to Agency Agent databases;
- bypass Operator API authentication or project RBAC;
- store bearer tokens in colony state, thread refs or browser payloads;
- represent visual state as authoritative approval/security/release evidence;
- create, retry, approve, release or otherwise mutate Agency Agent work in the AW3 bridge.

## Configuration

Start Agency Agent's Operator API, create a bearer token through an authenticated Operator session, then launch Agent World from the same shell environment:

```bash
export AGENCY_AGENT_URL=http://127.0.0.1:8787
export AGENCY_AGENT_TOKEN=aa_your_token_here
npm run dev
```

`AGENCY_AGENT_URL` defaults to `http://127.0.0.1:8787`.

`AGENCY_AGENT_TOKEN` has no default.

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

The harness diagnostic then distinguishes:

| Situation | Result |
| --- | --- |
| Operator API not reachable | harness absent; no noisy error |
| API healthy, token missing | explicit token-not-configured diagnostic |
| API healthy, token returns `401` | token rejected/expired diagnostic |
| API healthy, token returns `403` | token accepted but under-authorized diagnostic |
| API healthy, token authorized | no diagnostic; tasks can be scanned |

Network/API probes are bounded with a short timeout so a dead local service cannot stall colony polling indefinitely.

## Authenticated API reads

The adapter currently uses:

```text
GET /api/v1/projects
GET /api/v1/projects/{project_id}/tasks
```

The bearer token is sent only in the server-side request header:

```text
Authorization: Bearer <token>
```

No token value is copied into the normalized thread object.

Expected authentication failures (`401`/`403`) produce an empty Agency Agent roster plus a harness diagnostic rather than throwing the entire colony scan.

## Mapping

Agency Agent returns governed `TaskRecord` objects. The adapter translates each task into the Bot Crossing `Thread` contract.

| Thread field | Agency Agent source |
| --- | --- |
| `id` | `agency-agent:<project_id>:<task_id>` |
| `title` / `preview` | task objective |
| `project` | Operator project name/slug |
| `worktree` | workspace isolation ID when mode is `WORKTREE` |
| `gitBranch` | workspace integration target |
| `model` | execution model |
| `effort` | risk level |
| `createdAt` | task creation timestamp |
| `lastActivityAt` | task update timestamp |
| `running` | active implementation/review states |
| `unread` | blocked/human-decision states |
| `hasError` | `FAILED_VERIFICATION` |
| `archived` | `DONE` |
| `source` | `agency-agent` |

The `ref` object contains only:

```text
projectId
taskId
status
ownerAgent
```

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

For AW3:

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
- missing-token diagnostic;
- rejected-token diagnostic;
- live project/task scan through a mocked Operator API;
- server-side bearer header usage;
- bearer credential absence from normalized thread JSON;
- clean absence when the Operator API cannot be reached.

## Real-machine AW3 smoke

The remaining AW3 proof must run on the operator's machine because the Operator API is intentionally local/private.

Expected sequence:

```bash
# terminal 1 — Agency Agent
agency-agent serve

# terminal 2 — after creating an Operator API token
export AGENCY_AGENT_URL=http://127.0.0.1:8787
export AGENCY_AGENT_TOKEN=aa_your_token_here
npm install
npm run dev
```

Then verify:

1. Agency Agent appears in the harness list;
2. Operator projects appear as colony zones;
3. project tasks appear as astronauts/buildings;
4. changing a task into `NEEDS_USER_DECISION` produces the attention state on the next poll;
5. `FAILED_VERIFICATION` produces the error state;
6. no mutation is written back by Agent World.

## Future enrichment

AW5 may add additional **read-only** API reads for authoritative evidence such as agents, events, verification, SilverGuard and release state. Any such data should be normalized server-side before reaching the browser and should follow the same least-privilege principle.
