# AW7 — Governed actions

SilverKen Agent World can record a small set of governed action requests in Agency Agent. It does **not** execute the requested operation itself.

## Boundary

The browser never receives `AGENCY_AGENT_TOKEN`. A card sends only:

- its canonical Agent World thread id;
- one allowlisted request kind;
- a human rationale.

The same-origin Agent World server accepts the request only from a loopback page (`localhost`, `127.0.0.1`, or `::1`). It rescans current threads, resolves the canonical Agency Agent project/task reference server-side, and forwards the request with the server-only bearer token.

Agency Agent then applies project membership and the `action.request` permission and records `governed_action.requested` in its durable Operator audit trail.

## AW7 v1 actions

- `REQUEST_HUMAN_REVIEW`
- `REQUEST_RISK_REVIEW`
- `REQUEST_VERIFICATION_RETRY`

The 3D card shows one contextual action:

- normal/review states → request human review;
- `RISK_ACCEPTANCE_REQUIRED` → request risk review;
- `FAILED_VERIFICATION` → request verification retry.

Every request asks the user for a rationale before submission.

## What a request does not do

Recording a request does not:

- transition the task;
- create an approval decision;
- accept risk;
- retry a run or verification automatically;
- execute a tool;
- modify a repository or file;
- merge a pull request;
- bypass Evaluator or SilverGuard.

The Agency Agent Operator/CLI remains authoritative for subsequent action.

## RBAC

Agency Agent grants `action.request` to OWNER, ADMIN, DEVELOPER and REVIEWER. VIEWER remains read-only.

`approval.decide` remains a separate permission. A request for review is not an approval.

## Security properties

- loopback-only action gateway;
- same-origin `Origin` required for POST;
- allowlisted request kinds only;
- bounded rationale/body sizes;
- thread id re-resolved server-side before forwarding;
- no browser-supplied project/task id is trusted;
- no bearer token in DOM, URL, request body, normalized thread, `ref`, SKOPS persistence, or `colony.json`;
- upstream errors are sanitized before returning to the browser.

The authoritative architecture decision is Agency Agent ADR-0015.
