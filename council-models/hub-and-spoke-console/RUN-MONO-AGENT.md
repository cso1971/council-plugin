# Eseguire il prompt unificato in modalità mono-agent (senza Council Console)

## Cosa garantisce il mono-agent

| Meccanismo | Ruolo |
|------------|--------|
| Nessun `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Il launcher del Council Console imposta questa variabile a `1` per abilitare i team agent nel CLI. Per una run **diretta** con `claude`, **non** va impostata (lo script la rimuove). |
| `--bare` | Riduce il caricamento automatico di contesto progetto (CLAUDE.md, ecc.) così non si mischia con altri protocolli. Il contesto arriva da `--system-prompt-file`. |
| Prompt unificato | Un solo system prompt con ruoli internalizzati; nessuno spawn di Product Analyst / Architect / QA come processi separati. |

**Nota:** “Mono-agent” qui significa **un solo processo `claude -p`**, non più agenti orchestrati dal runtime. Comportamenti interni del modello restano responsabilità del prompt.

## Claude Code (CLI)

1. Autenticazione: `claude auth login` (o API key come da documentazione Anthropic).
2. Dalla cartella del modello:

```powershell
cd c:\Repos\ai-dlc\council-console\council-models\hub-and-spoke-console
.\run-mono-agent-unified.ps1
```

Output su stdout. Per salvare su file:

```powershell
.\run-mono-agent-unified.ps1 -OutputFile ..\..\..\mono-agent-codice-interno-out.txt
```

Messaggio utente personalizzato:

```powershell
.\run-mono-agent-unified.ps1 -UserMessage "Solo sintesi esecutiva + user stories, in italiano."
```

## Cursor (chat / agent)

Qui **non** si usa il terminale `claude` a meno che tu non lo lanci tu stesso. Per restare mono-agent in Cursor:

1. Apri **una singola chat** (o Composer con un solo modello), non una sessione Council Console.
2. Incolla come contesto il file `single-agent-unified-prompt-codice-interno.md` (o solo le sezioni 1–2 e 10 + appendici se serve ridurre token).
3. Chiedi esplicitamente: *un solo artefatto in markdown, nessuna simulazione di round o voti multipli.*

Cursor non imposta `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`; l’equivalente “mono” è **non** usare funzioni che avviano più agenti paralleli se la tua versione le offre.

## Limitazione ambiente CI / agente remoto

Un agente che esegue comandi al posto tuo può fallire con `Not logged in` se sulla macchina non c’è sessione Claude Code. In quel caso esegui lo script **localmente** dopo login.
