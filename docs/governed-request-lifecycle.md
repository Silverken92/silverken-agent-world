# AW9 — Governed Request Lifecycle

AW9 turns AW7 governed-action audit roots into a human follow-up lifecycle owned by Agency Agent Operator.

## Authority boundary

Agent World remains a visualization and request-origin surface. Agency Agent remains authoritative.

```text
Agent World request
        ↓
RECORDED
        ↓ Operator acknowledges
ACKNOWLEDGED
        ↓ Operator closes follow-up
RESOLVED
```

These states describe the **request follow-up**, not execution of the requested action.

- `ACKNOWLEDGED` does not approve risk or a task.
- `RESOLVED` does not prove that a requested review/retry was executed or successful.
- No request lifecycle transition changes task state, creates approvals, executes tools, writes files, merges PRs or bypasses SilverGuard.

## 3D behavior

Agency Agent exposes only a compact lifecycle summary in its existing Agent World snapshot. The browser receives:

- request id;
- requested action kind;
- lifecycle status;
- request/acknowledge/resolve timestamps.

The rationale and Operator notes stay in Agency Agent and are not replicated into the 3D payload.

The latest request for a task is rendered as a compact badge:

```text
Demande · ENREGISTRÉE
Demande · PRISE EN COMPTE
Demande · RÉSOLUE
```

If the latest contextual request is still `RECORDED` or `ACKNOWLEDGED`, the 3D request button is disabled to reduce duplicate outstanding requests. A `RESOLVED` request stays visible as history but does not prevent a future new request.

## Operator inbox

Agency Agent owns the Requests view and the lifecycle transition endpoints. Mutations require an interactive Operator session, CSRF protection, project membership and `request.manage` permission.

The durable audit ledger remains the source for the projected request state, so historical AW7 requests appear without a migration/backfill.

## Next boundary

AW10 is reserved for the persistent Agent Registry and agent creation/configuration workflow in Agency Agent Operator. That registry, not Agent World, will own agent identities, roles, model/tool policy and task assignment.
