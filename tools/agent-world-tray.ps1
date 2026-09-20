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

New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null

$script:OwnedProcess = $null
$script:Exiting = $false

function Test-AgentWorldHealth {
    try {
        $response = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 2
        return ($response.status -eq 'ok' -and $response.service -eq 'silverken-agent-world')
    }
    catch {
        return $false
    }
}

function Open-AgentWorld {
    Start-Process $Url | Out-Null
}

function Stop-OwnedProcess {
    if ($null -eq $script:OwnedProcess) {
        return
    }

    try {
        $script:OwnedProcess.Refresh()
    }
    catch {
        $script:OwnedProcess = $null
        return
    }

    if (-not $script:OwnedProcess.HasExited) {
        $taskkill = Join-Path $env:SystemRoot 'System32\taskkill.exe'
        & $taskkill /PID $script:OwnedProcess.Id /T /F | Out-Null
        $script:OwnedProcess.WaitForExit(5000) | Out-Null
    }

    $script:OwnedProcess.Dispose()
    $script:OwnedProcess = $null
}

function Start-OwnedProcess {
    if (Test-AgentWorldHealth) {
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

    $deadline = (Get-Date).AddSeconds(30)
    while ((Get-Date) -lt $deadline) {
        if (Test-AgentWorldHealth) {
            return 'owned'
        }

        $script:OwnedProcess.Refresh()
        if ($script:OwnedProcess.HasExited) {
            throw "Agent World stopped during startup. See $StderrLog"
        }

        Start-Sleep -Milliseconds 500
    }

    Stop-OwnedProcess
    throw "Agent World did not become healthy within 30 seconds. See $StderrLog"
}

function Restart-AgentWorld {
    if ($null -eq $script:OwnedProcess -and (Test-AgentWorldHealth)) {
        [System.Windows.Forms.MessageBox]::Show(
            'Agent World is already running outside this tray session. It will not be stopped automatically.',
            'SilverKen Agent World',
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Information
        ) | Out-Null
        return
    }

    Stop-OwnedProcess
    Start-OwnedProcess | Out-Null
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

$openItem.Add_Click({ Open-AgentWorld })
$tray.Add_DoubleClick({ Open-AgentWorld })
$restartItem.Add_Click({
    try {
        Restart-AgentWorld
    }
    catch {
        [System.Windows.Forms.MessageBox]::Show(
            $_.Exception.Message,
            'SilverKen Agent World',
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        ) | Out-Null
    }
})
$logsItem.Add_Click({ Start-Process explorer.exe -ArgumentList $RuntimeDir | Out-Null })
$exitItem.Add_Click({
    $script:Exiting = $true
    Stop-OwnedProcess
    $tray.Visible = $false
    [System.Windows.Forms.Application]::Exit()
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

try {
    $mode = Start-OwnedProcess
    if ($mode -eq 'owned') {
        $tray.ShowBalloonTip(
            2000,
            'SilverKen Agent World',
            'Agent World est demarre. Double-cliquez sur l''icone pour l''ouvrir.',
            [System.Windows.Forms.ToolTipIcon]::Info
        )
    }
    Open-AgentWorld
    [System.Windows.Forms.Application]::Run()
}
catch {
    $tray.Visible = $false
    Stop-OwnedProcess
    [System.Windows.Forms.MessageBox]::Show(
        $_.Exception.Message,
        'SilverKen Agent World',
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
    exit 1
}
finally {
    $timer.Stop()
    $timer.Dispose()
    $tray.Dispose()

    if (-not $script:Exiting) {
        Stop-OwnedProcess
    }
}
