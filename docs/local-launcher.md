# AW8 — Local launcher and persistent machine config

AW8 turns the development setup into a repeatable local product workflow. Secrets and machine paths live in one ignored JSON file; environment variables still override that file when needed.

## First-time setup

From the Agent World repository:

```powershell
npm ci
npm run setup
```

`npm run setup` creates:

```text
config/agent-world.local.json
```

The file is ignored by Git because it may contain local paths and API tokens. It is never copied into browser payloads or colony state.

Edit the file once. A typical Windows configuration for sibling repositories is:

```json
{
  "agencyAgent": {
    "url": "http://127.0.0.1:8787",
    "token": "aa_your_real_token_here",
    "repoPath": "../agency-agent",
    "autoStart": true
  },
  "github": {
    "token": "",
    "projects": {
      "f-Silverken-Plateform": "Silverken92/silverken-platform"
    },
    "branches": {}
  }
}
```

For private GitHub repositories, put a GitHub read token in `github.token`, or keep using `AGENT_WORLD_GITHUB_TOKEN` / `GH_TOKEN` in the environment. Environment variables take precedence over the local file.

## Daily launch

Run:

```powershell
npm run dev
```

The launcher:

1. loads `config/agent-world.local.json` when present;
2. never prints token values;
3. checks Agency Agent `/health`;
4. if `agencyAgent.autoStart` is true and Agency Agent is down, starts the sibling repository's `.venv` CLI;
5. waits for Agency Agent to become healthy;
6. builds local 3D assets;
7. starts Vite / Agent World on the normal local port.

If Agency Agent is already running, the launcher reuses it and does not start a second instance.

When the launcher itself started Agency Agent, it also attempts to stop that child process when Agent World exits.

## Doctor

Run:

```powershell
npm run doctor
```

The doctor reports only safe metadata:

```text
SilverKen Agent World doctor
- Node: v22.x
- config: PASS
- Agency Agent URL: http://127.0.0.1:8787
- Agency Agent token: configured
- Agency Agent health: PASS
- Agency Agent auto-start: enabled
- Agency Agent executable: PASS
- GitHub token: configured / optional
- GitHub project mappings: N
- secrets printed: never
```

It intentionally never prints token values.

## Override rules

The local JSON is a convenience layer over the existing environment contract. Existing automation remains valid.

Priority is:

```text
explicit environment variable
        ↓
config/agent-world.local.json
        ↓
built-in default
```

Supported mappings include:

```text
agencyAgent.url       → AGENCY_AGENT_URL
agencyAgent.token     → AGENCY_AGENT_TOKEN
agencyAgent.repoPath  → AGENT_WORLD_AGENCY_AGENT_REPO
agencyAgent.autoStart → AGENT_WORLD_AGENCY_AGENT_AUTOSTART

github.token          → AGENT_WORLD_GITHUB_TOKEN
github.projects       → AGENT_WORLD_GITHUB_PROJECTS
github.branches       → AGENT_WORLD_GITHUB_BRANCHES
```

## Security boundary

- `config/agent-world.local.json` is ignored by Git;
- tokens are loaded only into the Node server process environment;
- the config loader returns only boolean `tokenConfigured` flags in diagnostics;
- browser requests never receive Agency Agent or GitHub tokens;
- governed actions still go through the loopback-only Agent World gateway and Agency Agent RBAC/audit boundary;
- do not copy the local config into issues, screenshots or chat messages.

## Production-style serve

`npm run serve` also loads the same local configuration before starting the built server. `npm start` still performs a build first, then serves the result.

## Troubleshooting

If `npm run dev` says the Agency Agent executable is missing, confirm that the configured repository has its virtual environment installed:

```text
../agency-agent/.venv/Scripts/agency-agent.exe   # Windows
../agency-agent/.venv/bin/agency-agent           # macOS / Linux
```

If you intentionally do not want auto-start, set:

```json
"autoStart": false
```

and start Agency Agent yourself as before.
