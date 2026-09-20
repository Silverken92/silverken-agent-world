@echo off
setlocal
cd /d "%~dp0"
start "" powershell.exe -NoProfile -WindowStyle Hidden -STA -File "%~dp0tools\agent-world-tray.ps1"
endlocal
