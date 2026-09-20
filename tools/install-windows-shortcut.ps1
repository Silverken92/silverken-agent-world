param()

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$Launcher = Join-Path $Root 'SilverKen-Agent-World.cmd'
$Programs = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$Folder = Join-Path $Programs 'SilverKen'
$ShortcutPath = Join-Path $Folder 'SilverKen Agent World.lnk'

if (-not (Test-Path -LiteralPath $Launcher)) {
    throw "Launcher not found: $Launcher"
}

New-Item -ItemType Directory -Path $Folder -Force | Out-Null

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Launcher
$Shortcut.WorkingDirectory = $Root
$Shortcut.Description = 'SilverKen Agent World'
$Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,13"
$Shortcut.Save()

Write-Host 'SilverKen Agent World shortcut installed:'
Write-Host $ShortcutPath
