# AW10 — Persistent Agent Registry visualization

SilverKen Agent World consumes the project-scoped Agent Registry owned by Agency Agent. The registry is authoritative in Agency Agent; Agent World only renders its bounded projection.

## Visual model

AW10 introduces two distinct visual concepts inside one project zone:

- **persistent agent identity** — one astronaut per enabled AgentProfile, visible even when it has no task;
- **mission/task thread** — the existing task visualization retained from AW3–AW9.

This split is intentional for the first registry increment. It preserves all task, evidence, GitHub, request-lifecycle and governed-navigation behavior while giving agents an identity that survives task archival.

A later visual increment may group missions around the persistent agent avatar. It must not make Agent World authoritative for assignment or execution.

## Profile projection

The Agency Agent bounded snapshot exposes only non-secret profile fields required for presentation, such as stable agent ID, name, role, description, enabled state and configured boundaries. `created_by`, authentication material and runtime credentials are not projected.

Agent World creates a synthetic read-only thread ID:

```text
agency-agent-profile:<project_id>:<agent_id>
```

The profile astronaut links back to the Operator **Agents** view. It does not expose the AW7 governed task-request button because an AgentProfile is not a task.

## State summary

The persistent astronaut summarizes the health of its currently owned non-DONE tasks:

- any active owned task → working;
- any human-decision owned task → needs attention;
- any failed-verification owned task → error;
- no live owned tasks → idle;
- disabled profile → archived from the live colony.

These states are derived presentation only. Enabling/disabling and assigning work remain Agency Agent Operator actions.

## Compatibility

If Agency Agent does not expose the Agent Registry snapshot yet, the adapter continues to render task threads exactly as before. AW10 therefore remains additive to AW1–AW9.
