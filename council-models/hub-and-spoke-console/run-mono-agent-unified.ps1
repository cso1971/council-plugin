<#
.SYNOPSIS
  Esegue il prompt unificato (single-agent) con Claude Code CLI, SENZA Council Console e SENZA Agent Teams.

.DESCRIPTION
  - Rimuove CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS (il launcher del Council Console la imposta a "1").
  - Usa --bare per non auto-caricare CLAUDE.md del progetto.
  - Carica single-agent-unified-prompt-codice-interno.md come system prompt da file.
  - Passa --add-dir sulla root council-console cosi' il modello puo' leggere il codice se usa tool Read.

  Prerequisito: `claude` nel PATH e autenticazione (`claude auth login` o API key).

.EXAMPLE
  .\run-mono-agent-unified.ps1
  .\run-mono-agent-unified.ps1 -UserMessage "Produci solo la sezione 10 (artefatto decisione) in markdown."
#>
[CmdletBinding()]
param(
  [string] $UserMessage = @"
Rispondi producendo UN SOLO documento markdown secondo la struttura della sezione 10 del prompt di sistema (Decisione/Specifica per il topic «Codice Interno»).
Regole: un solo flusso di risposta, nessuno spawn di sub-agenti, nessuna simulazione di round del consiglio.
"@,
  [string] $CouncilConsoleRoot = '',
  [string] $UnifiedPromptFile = '',
  [string] $OutputFile = ''
)

$ErrorActionPreference = 'Stop'

# $PSScriptRoot e' vuoto in alcuni contesti (es. invocazioni indirette); usa la cartella dello script.
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $ScriptDir) { Write-Error "Impossibile determinare la cartella dello script." }

if (-not $CouncilConsoleRoot) {
  $CouncilConsoleRoot = (Resolve-Path (Join-Path $ScriptDir '..\..\')).Path
}
if (-not $UnifiedPromptFile) {
  $UnifiedPromptFile = Join-Path $ScriptDir 'single-agent-unified-prompt-codice-interno.md'
}

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  Write-Error "Comando 'claude' non trovato nel PATH. Installa Claude Code CLI."
}

if (-not (Test-Path -LiteralPath $UnifiedPromptFile)) {
  Write-Error "File non trovato: $UnifiedPromptFile"
}

# Mono-agent: stesso binario 'claude' ma SENZA la variabile che abilita i Team Agents (vedi src/shared/claude-launcher.ts)
Remove-Item Env:CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS -ErrorAction SilentlyContinue

$args = @(
  '-p'
  '--bare'
  '--dangerously-skip-permissions'
  '--system-prompt-file', $UnifiedPromptFile
  '--add-dir', $CouncilConsoleRoot
  $UserMessage
)

Write-Host "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: $(if ($env:CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS) { $env:CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS } else { '(non impostata — OK per mono-agent)' })"
Write-Host "Council console root: $CouncilConsoleRoot"
Write-Host "System prompt file: $UnifiedPromptFile"
Write-Host ""

# Pipe vuota: evita il warning "no stdin data" su alcune versioni del CLI
if ($OutputFile) {
  '' | & claude @args 2>&1 | Tee-Object -FilePath $OutputFile
} else {
  '' | & claude @args 2>&1
}
