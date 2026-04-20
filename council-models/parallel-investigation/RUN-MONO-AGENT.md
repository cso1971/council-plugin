# Eseguire il prompt unificato Parallel Investigation in modalità mono-agent

## Cosa garantisce il mono-agent

| Meccanismo | Ruolo |
|------------|--------|
| Nessun `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Lo script la rimuove; non si avviano investigatori separati. |
| `--bare` | Non si carica il CLAUDE.md del progetto (che definisce il protocollo multi-agente). Il contesto arriva dal system prompt. |
| Prompt unificato | Un solo system prompt con le tre prospettive investigative internalizzate; nessuno spawn di Investigator SAML / YARP / Data come processi separati. |
| `{{TOPIC}}` injection | Lo script sostituisce `{{TOPIC}}` nel prompt con il topic passato via `-Topic`. |

**Nota:** "Mono-agent" qui significa **un solo processo `claude -p`**. Il modello copre internamente le tre prospettive investigative (Auth/SAML, Gateway/YARP, Data Layer) senza round o peer-to-peer messaging.

## Differenze strutturali vs consiglio

| Proprietà | Consiglio (3 investigatori) | Mono-agente |
|-----------|----------------------------|-------------|
| Contraddittorio | Reale: P2P evidence exchange | Simulato: cross-reference interno |
| Specializzazione | Ogni agente carica solo la propria prospettiva | Un agente carica tutto |
| Output | `round-{n}.md` + `findings.md` | Solo `findings.md` equivalente |
| Costo | ~3× token (3 agenti × N round) | ~1× token |
| HITL | Non previsto nel protocollo attuale | `ask_operator` quando il problema è vago |

## Claude Code (CLI)

1. Autenticazione: `claude auth login` (o API key).
2. Dalla cartella del modello:

```powershell
cd c:\Repos\ai-dlc\council-console\council-models\parallel-investigation
.\run-mono-agent-unified.ps1 -Topic "Perche' il gateway mostra latenza intermittente sotto load?"
```

Output su stdout. Per salvare su file:

```powershell
.\run-mono-agent-unified.ps1 -Topic "Latenza intermittente sul gateway" -OutputFile .\findings-output.md
```

User message personalizzato:

```powershell
.\run-mono-agent-unified.ps1 -Topic "Errore 503 sporadico" -UserMessage "Concentrati solo sulle ipotesi YARP e Data Layer."
```

Senza `-Topic` (il placeholder `{{TOPIC}}` resta nel prompt — utile se vuoi passare il topic nel user message):

```powershell
.\run-mono-agent-unified.ps1 -UserMessage "Il problema e': errori 401 intermittenti dopo deploy. Investiga."
```

## Cursor (chat / agent)

1. Apri **una singola chat**, non una sessione Council Console.
2. Incolla come contesto il file `single-agent-unified-prompt.md` (sostituendo `{{TOPIC}}` con il problema).
3. Chiedi: *un solo artefatto findings in markdown, nessuna simulazione di round.*
