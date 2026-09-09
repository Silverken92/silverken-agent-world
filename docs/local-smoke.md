# Local SilverKen Agent World smoke test

This is the operator-run test that completes the real-machine part of AW3 and validates AW5 against a live Agency Agent instance.

## What you need

- Python **3.13** for Agency Agent;
- Node.js **22.13+** for Agent World;
- Git;
- two terminals;
- an Agency Agent Operator user with access to at least one project.

The default local topology is:

```text
Agency Agent   http://127.0.0.1:8787
Agent World    http://localhost:5274
```

## 1. Start Agency Agent

Clone/update `Silverken92/agency-agent`, then install it in a Python 3.13 virtual environment.

### Windows PowerShell

```powershell
git clone https://github.com/Silverken92/agency-agent.git
cd agency-agent
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
agency-agent db upgrade
```

On a fresh database, create the first Operator account once:

```powershell
agency-agent operator bootstrap-owner <USERNAME>
```

Create an API token for Agent World:

```powershell
agency-agent operator create-token <USERNAME> --name agent-world --ttl-days 30
```

Copy the raw `aa_...` token printed by the command. It is displayed only once.

Start the Operator API:

```powershell
agency-agent serve
```

### macOS / Linux

```bash
git clone https://github.com/Silverken92/agency-agent.git
cd agency-agent
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]"
agency-agent db upgrade
agency-agent operator bootstrap-owner <USERNAME>   # fresh DB only
agency-agent operator create-token <USERNAME> --name agent-world --ttl-days 30
agency-agent serve
```

Check the public health endpoint in a browser:

```text
http://127.0.0.1:8787/health
```

It should report the Agency Agent Operator service as healthy.

## 2. Make sure there is something to visualize

Open the Operator UI:

```text
http://127.0.0.1:8787/ui
```

Sign in and use an existing project/task, or create a project and at least one task. Agent World only sees tasks explicitly linked to projects the API-token owner is authorized to read.

For the most useful visual smoke, have tasks in a few different states, for example:

- `IN_PROGRESS` → active/working astronaut;
- `NEEDS_USER_DECISION` or `BLOCKED` → needs-input badge;
- `FAILED_VERIFICATION` → failed/error badge;
- a task with verification/Evaluator/SilverGuard evidence → AW5 evidence badges when selected.

## 3. Start Agent World in a second terminal

Clone/update `Silverken92/silverken-agent-world`.

### Windows PowerShell

```powershell
git clone https://github.com/Silverken92/silverken-agent-world.git
cd silverken-agent-world
npm ci
$env:AGENCY_AGENT_URL="http://127.0.0.1:8787"
$env:AGENCY_AGENT_TOKEN="aa_REPLACE_WITH_YOUR_TOKEN"
npm run dev
```

### macOS / Linux

```bash
git clone https://github.com/Silverken92/silverken-agent-world.git
cd silverken-agent-world
npm ci
export AGENCY_AGENT_URL="http://127.0.0.1:8787"
export AGENCY_AGENT_TOKEN="aa_REPLACE_WITH_YOUR_TOKEN"
npm run dev
```

Open:

```text
http://localhost:5274
```

If Vite reports another port because `5274` is occupied, use the URL printed in the terminal.

## 4. What should happen

A successful live smoke has all of these properties:

1. **SilverKen Agent World** loads with the `Governed view / Read only` indicator.
2. Agency Agent projects appear as colony zones.
3. Agency Agent tasks appear as astronauts/buildings.
4. Working, attention and failure states match the Agency Agent task state.
5. Selecting an enriched Agency Agent astronaut shows compact badges for available data such as:
   - execution model / owner / most recent agent;
   - verification pass count;
   - independent Evaluator verdict;
   - SilverGuard disposition;
   - Agency Agent release readiness;
   - aggregated token usage and reported cost.
6. `Release · READY` is context only. It must **not** create the upstream PR-merged celebration unless real GitHub merge evidence is added in a later slice.
7. Agent World does not create/update Agency Agent tasks, approvals, security evidence or releases.

## 5. Quick diagnostics

### Agency Agent does not appear at all

Check:

```text
http://127.0.0.1:8787/health
```

Then confirm `agency-agent serve` is still running.

### Agent World says the token is missing

The token must be exported in the **same terminal** that runs `npm run dev`.

PowerShell:

```powershell
$env:AGENCY_AGENT_TOKEN="aa_..."
```

Bash/zsh:

```bash
export AGENCY_AGENT_TOKEN="aa_..."
```

Restart `npm run dev` after changing it.

### Token rejected

Mint a fresh token:

```text
agency-agent operator create-token <USERNAME> --name agent-world --ttl-days 30
```

Then restart Agent World with the new value.

### Agency Agent connects but no project/task appears

Verify in `/ui` that:

- the token owner is a member of the project;
- the task is explicitly linked to that project;
- the task is not already `DONE` (completed Agency Agent tasks are retired from the active colony in the current bridge).

## 6. Optional API check before opening the 3D view

With Agency Agent running, you can verify the AW5 snapshot directly.

PowerShell:

```powershell
$headers = @{ Authorization = "Bearer $env:AGENCY_AGENT_TOKEN" }
Invoke-RestMethod -Headers $headers http://127.0.0.1:8787/api/v1/projects
```

Take a `project_id` from the result, then:

```powershell
Invoke-RestMethod -Headers $headers "http://127.0.0.1:8787/api/v1/projects/<PROJECT_ID>/agent-world"
```

Bash/zsh:

```bash
curl -H "Authorization: Bearer $AGENCY_AGENT_TOKEN" http://127.0.0.1:8787/api/v1/projects
curl -H "Authorization: Bearer $AGENCY_AGENT_TOKEN" http://127.0.0.1:8787/api/v1/projects/<PROJECT_ID>/agent-world
```

The snapshot is intentionally compact: it does not replicate raw evaluator/security/release evidence and it never returns the bearer token.

## 7. Smoke-test completion record

When the live test succeeds, record:

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

That is sufficient to close the real-machine AW3 smoke and provides the first live proof for AW5.
