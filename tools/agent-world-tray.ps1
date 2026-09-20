param(
    [int]$Port = 5274
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$Root = Split-Path -Parent $PSScriptRoot
$Launcher = Join-Path $Root 'tools\agent-world-launcher.mjs'
$Node = (Get-Command node -ErrorAction Stop).Source
$Url = "http://127.0.0.1:$Port"
$HealthUrl = "$Url/healthz"
$RuntimeDir = Join-Path $env:LOCALAPPDATA 'SilverKen\AgentWorld'
$StdoutLog = Join-Path $RuntimeDir 'agent-world.out.log'
$StderrLog = Join-Path $RuntimeDir 'agent-world.err.log'
$TrayLog = Join-Path $RuntimeDir 'tray.log'

New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null

$script:OwnedProcess = $null
$script:Exiting = $false
$script:Context = $null

function Write-TrayLog {
    param([string]$Message)

    $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff'
    Add-Content -LiteralPath $TrayLog -Value "[$stamp] $Message" -Encoding UTF8
}

function Test-AgentWorldHealth {
    try {
        $response = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 2
        return ($response.status -eq 'ok' -and $response.service -eq 'silverken-agent-world')
    }
    catch {
        return $false
    }
}

function Wait-AgentWorldStopped {
    param([int]$TimeoutSeconds = 8)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (-not (Test-AgentWorldHealth)) {
            return $true
        }

        Start-Sleep -Milliseconds 250
    }

    return $false
}

function Open-AgentWorld {
    Start-Process $Url | Out-Null
}

function Stop-OwnedProcess {
    $process = $script:OwnedProcess
    $script:OwnedProcess = $null

    if ($null -eq $process) {
        Write-TrayLog 'Stop requested with no owned process.'
        return
    }

    try {
        $process.Refresh()
        if ($process.HasExited) {
            Write-TrayLog "Owned process already exited. PID=$($process.Id)"
            return
        }

        $pidToStop = $process.Id
        Write-TrayLog "Stopping owned process tree. PID=$pidToStop"

        $taskkill = Join-Path $env:SystemRoot 'System32\taskkill.exe'
        $killArgs = @{
            FilePath = $taskkill
            ArgumentList = @('/PID', [string]$pidToStop, '/T', '/F')
            WindowStyle = 'Hidden'
            Wait = $true
            PassThru = $true
        }
        $kill = Start-Process @killArgs

        Write-TrayLog "taskkill exit code=$($kill.ExitCode) for PID=$pidToStop"

        $process.Refresh()
        if (-not $process.HasExited) {
            Stop-Process -Id $pidToStop -Force -ErrorAction SilentlyContinue
        }

        $null = $process.WaitForExit(5000)

        if (-not (Wait-AgentWorldStopped)) {
            throw "Agent World is still healthy on $HealthUrl after stopping PID $pidToStop."
        }

        Write-TrayLog "Owned process tree stopped. PID=$pidToStop"
    }
    finally {
        $process.Dispose()
    }
}

function Start-OwnedProcess {
    if (Test-AgentWorldHealth) {
        Write-TrayLog 'Existing Agent World instance detected; treating it as external.'
        return 'external'
    }

    if ($null -ne $script:OwnedProcess) {
        try {
            $script:OwnedProcess.Refresh()
            if (-not $script:OwnedProcess.HasExited) {
                return 'owned'
            }
        }
        catch {
            Write-TrayLog "Failed to refresh stale owned process: $($_.Exception.Message)"
        }

        try {
            $script:OwnedProcess.Dispose()
        }
        catch {
        }

        $script:OwnedProcess = $null
    }

    $env:PORT = [string]$Port
    $argumentList = '"' + $Launcher + '" desktop-server'

    $startArgs = @{
        FilePath = $Node
        ArgumentList = $argumentList
        WorkingDirectory = $Root
        WindowStyle = 'Hidden'
        RedirectStandardOutput = $StdoutLog
        RedirectStandardError = $StderrLog
        PassThru = $true
    }

    $script:OwnedProcess = Start-Process @startArgs
    Write-TrayLog "Started managed desktop launcher. PID=$($script:OwnedProcess.Id)"

    $deadline = (Get-Date).AddSeconds(45)
    while ((Get-Date) -lt $deadline) {
        if (Test-AgentWorldHealth) {
            Write-TrayLog "Agent World healthy at $HealthUrl"
            return 'owned'
        }

        $script:OwnedProcess.Refresh()
        if ($script:OwnedProcess.HasExited) {
            $exitCode = $script:OwnedProcess.ExitCode
            $script:OwnedProcess.Dispose()
            $script:OwnedProcess = $null
            throw "Agent World stopped during startup with exit code $exitCode. See $StderrLog"
        }

        Start-Sleep -Milliseconds 500
    }

    Stop-OwnedProcess
    throw "Agent World did not become healthy within 45 seconds. See $StderrLog"
}

function Restart-AgentWorld {
    if ($null -eq $script:OwnedProcess -and (Test-AgentWorldHealth)) {
        throw 'Agent World is running outside this tray session. This tray will not stop or restart that external instance.'
    }

    Stop-OwnedProcess
    return Start-OwnedProcess
}

function Show-TrayError {
    param([string]$Message)

    Write-TrayLog "ERROR: $Message"
    [System.Windows.Forms.MessageBox]::Show(
        $Message,
        'SilverKen Agent World',
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
}

$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Text = 'SilverKen Agent World'
$tray.Icon = [System.Drawing.SystemIcons]::Application
$tray.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip

$openItem = $menu.Items.Add('Ouvrir Agent World')
$restartItem = $menu.Items.Add('Redemarrer')
$statusItem = $menu.Items.Add('Etat : demarrage...')
$statusItem.Enabled = $false
$menu.Items.Add('-') | Out-Null
$logsItem = $menu.Items.Add('Ouvrir les logs')
$exitItem = $menu.Items.Add('Arreter et quitter')

$openItem.Add_Click({
    try {
        Open-AgentWorld
    }
    catch {
        Show-TrayError $_.Exception.Message
    }
})

$tray.Add_DoubleClick({
    try {
        Open-AgentWorld
    }
    catch {
        Show-TrayError $_.Exception.Message
    }
})

$restartItem.Add_Click({
    try {
        $restartItem.Enabled = $false
        $statusItem.Text = 'Etat : redemarrage...'
        $tray.Text = 'SilverKen Agent World - redemarrage...'
        [System.Windows.Forms.Application]::DoEvents()

        $mode = Restart-AgentWorld

        if ($mode -ne 'owned') {
            throw "Unexpected restart mode: $mode"
        }

        $statusItem.Text = 'Etat : en cours'
        $tray.Text = 'SilverKen Agent World - en cours'
        $tray.ShowBalloonTip(
            1800,
            'SilverKen Agent World',
            'Redemarrage termine.',
            [System.Windows.Forms.ToolTipIcon]::Info
        )
        Write-TrayLog 'Restart completed successfully.'
    }
    catch {
        Show-TrayError $_.Exception.Message
    }
    finally {
        $restartItem.Enabled = $true
    }
})

$logsItem.Add_Click({
    try {
        Start-Process explorer.exe -ArgumentList $RuntimeDir | Out-Null
    }
    catch {
        Show-TrayError $_.Exception.Message
    }
})

$exitItem.Add_Click({
    $script:Exiting = $true
    $statusItem.Text = 'Etat : arret...'
    $tray.Text = 'SilverKen Agent World - arret...'
    [System.Windows.Forms.Application]::DoEvents()

    try {
        Stop-OwnedProcess
        Write-TrayLog 'Tray exit requested; owned runtime stopped.'
    }
    catch {
        Write-TrayLog "Shutdown warning: $($_.Exception.Message)"
    }
    finally {
        $tray.Visible = $false
        if ($null -ne $script:Context) {
            $script:Context.ExitThread()
        }
    }
})

$tray.ContextMenuStrip = $menu

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 3000
$timer.Add_Tick({
    $healthy = Test-AgentWorldHealth

    if ($healthy) {
        if ($null -ne $script:OwnedProcess) {
            $statusItem.Text = 'Etat : en cours'
            $tray.Text = 'SilverKen Agent World - en cours'
        }
        else {
            $statusItem.Text = 'Etat : instance externe'
            $tray.Text = 'SilverKen Agent World - instance externe'
        }
    }
    else {
        $statusItem.Text = 'Etat : arrete'
        $tray.Text = 'SilverKen Agent World - arrete'
    }

    $restartItem.Enabled = -not ($null -eq $script:OwnedProcess -and $healthy)
})

$timer.Start()
$script:Context = New-Object System.Windows.Forms.ApplicationContext

try {
    Write-TrayLog 'Tray starting.'
    $mode = Start-OwnedProcess

    if ($mode -eq 'owned') {
        $tray.ShowBalloonTip(
            2000,
            'SilverKen Agent World',
            'Agent World est demarre. Double-cliquez sur cette icone pour l''ouvrir.',
            [System.Windows.Forms.ToolTipIcon]::Info
        )
    }

    Open-AgentWorld
    [System.Windows.Forms.Application]::Run($script:Context)
}
catch {
    $tray.Visible = $false

    try {
        Stop-OwnedProcess
    }
    catch {
        Write-TrayLog "Cleanup warning: $($_.Exception.Message)"
    }

    Show-TrayError $_.Exception.Message
    exit 1
}
finally {
    $timer.Stop()
    $timer.Dispose()
    $tray.Visible = $false
    $tray.Dispose()

    if ($null -ne $script:Context) {
        $script:Context.Dispose()
        $script:Context = $null
    }

    if (-not $script:Exiting) {
        try {
            Stop-OwnedProcess
        }
        catch {
            Write-TrayLog "Final cleanup warning: $($_.Exception.Message)"
        }
    }

    Write-TrayLog 'Tray stopped.'
}
