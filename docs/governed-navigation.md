# AW6 — Governed Navigation

AW6 turns SilverKen Agent World into a read-only visual entry point into authoritative systems. Navigation is allowed; state mutation is not.

## Supported navigation

Agency Agent task cards may expose:

- **Operator** — opens the authenticated Agency Agent Operator UI with project/task context;
- **GitHub PR** — opens the observed pull request when a real PR exists;
- **GitHub repository** — opens the observed repository.

Local harness projects continue to use the inherited Bot Crossing navigation controls for opening a harness thread, revealing a project folder, and copying its path.

## Security boundary

Navigation never carries bearer credentials.

The Agency Agent link contains only:

```text
/ui?project=<project_id>&task=<task_id>&view=tasks
```

The Operator UI still performs its normal authenticated same-origin session check before loading data. The project identifier must resolve to a project returned by the authenticated API before selection occurs.

GitHub links are reconstructed from validated `owner/repo` and PR-number evidence. Browser navigation accepts only HTTP(S); GitHub actions require the `github.com` host. Credential-bearing URLs and executable schemes such as `javascript:` are rejected.

All Agent World links open with `noopener noreferrer`.

## Non-goals

AW6 does not:

- approve or reject tasks;
- merge pull requests;
- retry runs;
- modify Agency Agent state;
- write to GitHub;
- put Operator or GitHub tokens into URLs, browser storage, thread refs, or colony state.

Those actions remain outside Agent World until a later governed-actions slice explicitly defines authorization, audit, and threat-review requirements.
