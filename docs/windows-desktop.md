# AW21 — Windows Desktop / Tray Launcher

AW21 adds an optional Windows desktop experience around the existing SilverKen Agent World local launcher. It does not replace the browser application, the Vite development flow, or Agency Agent governance.

## What it adds

- a double-click launcher: `SilverKen-Agent-World.cmd`;
- a native Windows notification-area icon implemented with Windows PowerShell / WinForms;
- **Open Agent World**, **Restart**, **Open logs**, and **Stop and exit** actions;
- a Start Menu shortcut installer;
- an Agent World-only `/healthz` endpoint used by the tray;
- a managed production launcher that reuses AW8 Agency Agent auto-start semantics.

## Daily use

First install dependencies and local configuration as usual:

```powershell
npm ci
npm run setup
npm run doctor
```

Install the Start Menu shortcut once:

```powershell
npm run desktop:install
```

Then launch **SilverKen Agent World** from the Windows Start Menu.

For direct testing from the repository:

```powershell
npm run desktop
```

The tray starts Agent World on:

```text
http://127.0.0.1:5274
```

and opens the default browser.

## Process ownership

The tray only stops processes it started itself.

If Agent World is already healthy on the configured local port when the tray starts, the tray treats it as an external instance. It may open that instance, but it will not terminate it.

When the AW8 configuration has `agencyAgent.autoStart: true`:

- an already-running healthy Agency Agent is reused and remains external;
- if the managed launcher starts Agency Agent itself, it belongs to that launcher process tree and is stopped with the desktop session.

This preserves the existing AW8 ownership rule instead of introducing a second process manager.

## Logs

Desktop launcher logs are machine-local:

```text
%LOCALAPPDATA%\SilverKen\AgentWorld\agent-world.out.log
%LOCALAPPDATA%\SilverKen\AgentWorld\agent-world.err.log
```

They are not written into the Git repository.

## Security boundary

AW21 does not add execution or governance authority to the browser.

The tray script:

- never reads or prints Agency Agent, GitHub, or OpenAI credential values;
- delegates existing configuration loading to the server-side launcher;
- binds Agent World to the existing localhost default;
- uses the narrow `/healthz` endpoint only to detect Agent World process health;
- stops only its own process tree;
- does not install an auto-start-at-login task or service.

The Start Menu shortcut is opt-in and can be removed normally from the user's Start Menu folder.

## Development flow remains unchanged

Developers can continue using:

```powershell
npm run dev
```

AW21 is an optional operator convenience layer. The browser app, harness contracts, scanner behavior, state model, and upstream Bot Crossing seam remain unchanged.


## Windows validation

AW21 was validated on a real Windows machine.

Final smoke:

```text
tray menu visible                                           PASS
Open Agent World                                           PASS
Restart                                                    PASS
Windows notification: Redemarrage termine.                PASS
GET /healthz after restart                                 PASS
Stop and exit                                              PASS
TCP 127.0.0.1:5274 closed after shutdown                  PASS
```

The first smoke identified that restart and shutdown were not deterministic. The final implementation uses a WinForms `ApplicationContext`, explicit process-tree termination, a bounded wait for `/healthz` to disappear, and machine-local `tray.log` diagnostics. The corrected lifecycle passed the Windows re-smoke.
