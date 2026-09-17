# Explicit GitHub branch mappings

AW5B normally discovers a branch from the harness thread or the local Git checkout. Agency Agent projects do not currently expose a repository checkout path, and older Cursor/Codex threads may also lack branch evidence.

For those cases, Agent World supports an optional project-to-branch map in addition to the existing project-to-repository map.

## Windows PowerShell

```powershell
$env:AGENT_WORLD_GITHUB_PROJECTS='{"Tuce":"Silverken92/silverken-agent-world"}'
$env:AGENT_WORLD_GITHUB_BRANCHES='{"Tuce":"smoke/aw5b-live"}'
```

## macOS / Linux

```bash
export AGENT_WORLD_GITHUB_PROJECTS='{"Tuce":"Silverken92/silverken-agent-world"}'
export AGENT_WORLD_GITHUB_BRANCHES='{"Tuce":"smoke/aw5b-live"}'
```

Project keys are matched case-insensitively. A branch reported directly by the thread remains authoritative and takes precedence over the explicit branch map.

The branch map contains no credentials. GitHub authentication continues to use `AGENT_WORLD_GITHUB_TOKEN`, `GITHUB_TOKEN`, or `GH_TOKEN` only in the local Node server process.

This override is intended as a bridge until Agency Agent carries repository/branch coordinates as governed project/task metadata.
