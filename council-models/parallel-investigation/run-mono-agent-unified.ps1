<#
.SYNOPSIS
  Esegue il prompt unificato (single-agent) per Parallel Investigation con Claude Code CLI,
  SENZA Council Console e SENZA Agent Teams.

.DESCRIPTION
  - Rimuove CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS (il launcher del Council Console la imposta a "1").
  - Usa --bare per non auto-caricare CLAUDE.md del progetto.
  - Carica single-agent-unified-prompt.md come system prompt da file.
  - Passa --add-dir sulla root council-console cosi' il modello puo' leggere il codice se usa tool Read.

  Prerequisito: `claude` nel PATH e autenticazione (`claude auth login` o API key).

.EXAMPLE
  .\run-mono-agent-unified.ps1
  .\run-mono-agent-unified.ps1 -Topic "Perche' il gateway mostra latenza intermittente sotto load?"
  .\run-mono-agent-unified.ps1 -OutputFile .\findings-output.md
#>
[CmdletBinding()]
param(
  [string] $Topic = '',
  [string] $UserMessage = '',
  [string] $CouncilConsoleRoot = '',
  [string] $UnifiedPromptFile = '',
  [string] $OutputFile = ''
)

$ErrorActionPreference = 'Stop'

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $ScriptDir) { Write-Error "Impossibile determinare la cartella dello script." }

if (-not $CouncilConsoleRoot) {
  $CouncilConsoleRoot = (Resolve-Path (Join-Path $ScriptDir '..\..\')).Path
}
if (-not $UnifiedPromptFile) {
  $UnifiedPromptFile = Join-Path $ScriptDir 'single-agent-unified-prompt.md'
}

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  Write-Error "Comando 'claude' non trovato nel PATH. Installa Claude Code CLI."
}

if (-not (Test-Path -LiteralPath $UnifiedPromptFile)) {
  Write-Error "File non trovato: $UnifiedPromptFile"
}

# Se e' stato passato un topic, sostituisci {{TOPIC}} nel prompt
if ($Topic) {
  $promptContent = Get-Content -LiteralPath $UnifiedPromptFile -Raw
  $promptContent = $promptContent -replace '\{\{TOPIC\}\}', $Topic
  $tempPromptFile = Join-Path $env:TEMP "parallel-investigation-prompt-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"
  Set-Content -LiteralPath $tempPromptFile -Value $promptContent -Encoding UTF8
  $UnifiedPromptFile = $tempPromptFile
  Write-Host "Topic iniettato nel prompt. File temporaneo: $tempPromptFile"
}

if (-not $UserMessage) {
  $UserMessage = @"
Rispondi producendo UN SOLO documento markdown secondo la struttura della sezione 6 del prompt di sistema (Findings).
Regole: un solo flusso di risposta, nessuno spawn di sub-agenti, nessuna simulazione di round del consiglio.
Investiga il problema da tutte e tre le prospettive (Auth/SAML, Gateway/YARP, Data Layer), cerca evidenze concrete nel codebase, e produci findings con cross-reference.
"@
}

# Mono-agent: SENZA la variabile che abilita i Team Agents
Remove-Item Env:CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS -ErrorAction SilentlyContinue

$cliArgs = @(
  '-p'
  '--bare'
  '--dangerously-skip-permissions'
  '--system-prompt-file', $UnifiedPromptFile
  '--add-dir', $CouncilConsoleRoot
  $UserMessage
)

Write-Host "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: $(if ($env:CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS) { $env:CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS } else { '(non impostata - OK per mono-agent)' })"
Write-Host "Council console root: $CouncilConsoleRoot"
Write-Host "System prompt file: $UnifiedPromptFile"
if ($Topic) { Write-Host "Topic: $Topic" }
Write-Host ""

if ($OutputFile) {
  '' | & claude @cliArgs 2>&1 | Tee-Object -FilePath $OutputFile
} else {
  '' | & claude @cliArgs 2>&1
}

# Cleanup file temporaneo
if ($Topic -and $tempPromptFile -and (Test-Path -LiteralPath $tempPromptFile)) {
  Remove-Item -LiteralPath $tempPromptFile -Force -ErrorAction SilentlyContinue
}
