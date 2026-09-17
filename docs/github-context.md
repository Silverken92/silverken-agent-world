# GitHub PR / CI Context

AW5B adds an optional, read-only GitHub evidence layer to SilverKen Agent World.

It exists to answer operational questions such as:

- which repository and branch back this work;
- whether a pull request exists and whether it is open, closed or merged;
- whether GitHub checks/statuses pass, fail or are still pending.

It does **not** replace Agency Agent release governance. A task may be `Release · READY` while its GitHub PR is still open, and a merged GitHub PR does not retroactively create an Agency Agent approval.

## Security boundary

GitHub access runs only in the local Node server.

The browser may receive compact repository/branch/PR/check metadata, but it never receives the GitHub token. The token is not written to `data/colony.json`, thread `ref`, localStorage or the Agency Agent operational snapshot.

GitHub enrichment only performs GET requests. It does not create, update, merge, approve, label or close pull requests and does not trigger workflows.

GitHub enrichment is **off by default**. It becomes active only when one of the following is configured:

- `AGENT_WORLD_GITHUB_TOKEN`, `GITHUB_TOKEN` or `GH_TOKEN`;
- `AGENT_WORLD_GITHUB_PROJECTS`;
- `AGENT_WORLD_GITHUB=true`.

Network failures, missing permissions and rate limits are isolated: the original harness thread remains usable without GitHub context.

## Repository resolution

For local harnesses such as Cursor, Codex and Claude Code, Agent World can inspect the local checkout with read-only Git commands:

```text
git -C <project> remote get-url origin
git -C <project> branch --show-current
```

Common `github.com` HTTPS and SSH origin forms are recognized.

Agency Agent currently exposes project/task governance state but not a repository path, so AW5B also supports an explicit project-to-repository map.

Example:

```json
{
  "Tuce": "Silverken92/tuce",
  "SilverKen Platform": "Silverken92/silverken-platform"
}
```

The map contains repository coordinates only. Do not put tokens in it.

## Windows PowerShell

For a private repository, create a GitHub token with the minimum read access needed for that repository's metadata, pull requests and checks/statuses. Keep it local and do not paste it into chat, source control or screenshots.

```powershell
$env:AGENT_WORLD_GITHUB_TOKEN="YOUR_GITHUB_TOKEN"
$env:AGENT_WORLD_GITHUB_PROJECTS='{"Tuce":"Silverken92/tuce"}'
npm run dev
```

For a public repository, the explicit mapping can work without a token, subject to GitHub's unauthenticated API limits:

```powershell
$env:AGENT_WORLD_GITHUB_PROJECTS='{"Tuce":"Silverken92/tuce"}'
npm run dev
```

If the Agency Agent task has not yet acquired a branch, the card can still show the repository context. PR/CI evidence appears once a branch is known and a matching pull request exists.

## macOS / Linux

```bash
export AGENT_WORLD_GITHUB_TOKEN='YOUR_GITHUB_TOKEN'
export AGENT_WORLD_GITHUB_PROJECTS='{"Tuce":"Silverken92/tuce"}'
npm run dev
```

## Cache and limits

GitHub evidence is cached locally to avoid turning the colony's polling loop into repeated API traffic.

Defaults:

```text
cache             30 seconds
max enriched work 20 threads per scan
request timeout    4 seconds
```

Optional overrides:

```text
AGENT_WORLD_GITHUB_CACHE_MS
AGENT_WORLD_GITHUB_MAX_CONTEXTS
AGENT_WORLD_GITHUB_API
```

`AGENT_WORLD_GITHUB_API` exists primarily for testing and controlled compatible endpoints; the initial repository resolver recognizes `github.com` origins.

## Visual semantics

Agency Agent cards can display compact evidence such as:

```text
GitHub · Silverken92/silverken-platform
PR #42 · OPEN
CI · PASS · 8/8
```

In French:

```text
GitHub · Silverken92/silverken-platform
PR #42 · OUVERTE
CI · OK · 8/8
```

Only an actual GitHub PR with `merged_at` evidence sets the thread's GitHub `prState` to `MERGED`, which is the signal used by the colony's merged-PR celebration behavior.

The Agency Agent release badge remains independent:

```text
Livraison · PRÊT      ← Agency Agent governance
PR #42 · OUVERTE      ← GitHub delivery evidence
CI · OK · 8/8         ← GitHub checks/statuses
```

That separation is deliberate.
