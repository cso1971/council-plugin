# Catalogo dei Pattern di Interazione fra Agenti AI
### Compatibilità con Claude Code Agent Teams

> Legenda: ✅ Nativo | ⚠️ Workaround necessario | ❌ Non supportato / framework esterno

---

## Vincoli architetturali di Agent Teams (da documentazione ufficiale + issue GitHub, marzo 2026)

Prima di valutare i pattern, è essenziale conoscere i constraint fissi:

| Vincolo | Dettaglio |
|---|---|
| **No nested teams** | I teammates non possono spawnare sub-team o altri teammates. Solo il lead gestisce il team. |
| **Topologia reale** | Tecnicamente hub-and-spoke con messaggistica laterale opzionale — non full mesh nativo |
| **Tool rimossi ai teammates** | `AgentTool`, `TeamCreate`, `TeamDelete`, `CronCreate/Delete/List` non disponibili ai teammates (20 tool vs 25 dei subagent standalone) |
| **No session resumption** | `/resume` e `/rewind` non ripristinano i teammates. Il team è **efimero per design** |
| **No memoria persistente** | Nessuna memoria cross-sessione nativa. Ogni team riparte da zero |
| **Modello unico** | Tutti gli agenti usano Opus 4.6 — nessuna selezione per ruolo |
| **Un team per sessione** | Il lead gestisce un solo team alla volta |
| **Lead fisso** | Non si può trasferire la leadership durante la sessione |
| **Permessi uniformi** | Tutti i teammates ereditano i permessi del lead — non configurabili per singolo agente |

---

## Categoria 1 — Orchestrazione Gerarchica

### 1.1 Hub-and-Spoke ✅ Nativo

**Supporto Agent Teams:** Pieno — è di fatto l'architettura interna di Agent Teams. Il lead è l'hub, i teammates sono gli spoke.

**Come implementarlo:**
```
Create an agent team. Spawn three teammates:
- Teammate A: analizza il modulo auth
- Teammate B: analizza il layer database  
- Teammate C: analizza gli endpoint API
All report findings to the lead on completion.
```

**Note:** Il pattern naturale — non serve configurazione speciale.

---

### 1.2 Sequential Pipeline ⚠️ Workaround

**Supporto Agent Teams:** Parziale — Agent Teams è ottimizzato per il parallelismo, non per la sequenzialità. Una pipeline sequenziale si può fare ma non è il fit naturale.

**Come implementarlo:** Usare la **dipendenza tra task** nella shared task list. Il task B dichiara dipendenza da A — si sblocca automaticamente quando A completa.

```
Create tasks with dependencies:
- Task 1: "Write API spec" (no dependencies)
- Task 2: "Implement endpoints" (blocked by Task 1)
- Task 3: "Write integration tests" (blocked by Task 2)
Spawn one teammate per task.
```

**Alternativa migliore:** Per pipeline strettamente sequenziali, i **subagent classici** o n8n sono più appropriati — meno overhead.

**Limitazione nota:** Task status può laggarsi — un task può apparire bloccato anche se il lavoro è già completato. Richiede intervento manuale occasionale.

---

### 1.3 Hierarchical Decomposition ❌ Non supportato nativamente

**Supporto Agent Teams:** Non implementabile — i teammates non possono spawnare sub-team o altri agenti. Il vincolo "no nested teams" lo blocca per design.

**Workaround:** Eseguire team separati in sequenza (dissolvi il primo team, crea il secondo) — ma perdi la coordinazione cross-livello.

**Alternativa corretta:** n8n con nodi Claude annidati, LangGraph, Semantic Kernel AgentGroupChat. Per il tuo stack, Semantic Kernel gestisce questa topologia nativamente.

---

## Categoria 2 — Collaborazione Peer-to-Peer

### 2.1 Adversarial Debate ✅ Nativo (con configurazione esplicita)

**Supporto Agent Teams:** Ottimo — è uno degli use case primari citati da Anthropic. Il mailbox peer-to-peer è progettato esattamente per questo.

**Caveat importante:** Il peer-to-peer non è automatico — va istruito esplicitamente nel prompt. Senza istruzioni il comportamento naturale degli agenti è riportare al lead, non confrontarsi direttamente.

**Come implementarlo:** Vedi pattern Adversarial Debate nel documento precedente — il protocollo in 4 fasi funziona nativamente.

**Limitazione:** Tutti gli agenti usano Opus 4.6 — non puoi usare un modello più economico per i worker e uno più potente per il moderatore.

---

### 2.2 Collaborative Refinement ⚠️ Workaround

**Supporto Agent Teams:** Implementabile ma richiede sincronizzazione esplicita tramite file. Il passaggio dell'artefatto da un agente all'altro va coordinato manualmente tramite task dependency o messaggi.

**Come implementarlo:**
```
Teammate A: scrivi draft in spec-v1.md. Notifica lead al completamento.
Teammate B: attendi spec-v1.md. Revisiona dal punto di vista sicurezza → spec-v2.md.
Teammate C: attendi spec-v2.md. Revisiona compliance FINMA → spec-final.md.
```

**Nota:** È una pipeline sequenziale (vedi 1.2) applicata a un artefatto. Stessi limiti.

---

### 2.3 Swarm / Parallel Investigation ✅ Nativo

**Supporto Agent Teams:** Eccellente — è il caso d'uso più forte. Task paralleli indipendenti senza dipendenze tra loro.

**Come implementarlo:**
```
Spawn 4 teammates to investigate why the EPD connector fails intermittently.
Each investigates a different hypothesis:
- Teammate 1: SAML assertion timing issue
- Teammate 2: X.509 cert validation race condition
- Teammate 3: YARP routing under load
- Teammate 4: Qdrant vector store latency spike
Have them message each other if they find evidence that supports/refutes another's hypothesis.
Converge on findings.md.
```

**Sweet spot dichiarato:** 2-4 agenti paralleli. Oltre 5 il coordinamento overhead supera il beneficio.

---

### 2.4 Negotiation / Interface Contract ✅ Nativo (con attenzione al file ownership)

**Supporto Agent Teams:** Implementabile nativamente tramite messaggistica diretta e file condivisi. La negoziazione si realizza come scambio esplicito di messaggi prima che chiunque scriva codice.

**Come implementarlo:**
```
Teammate "backend": proponi il contratto API in api-contract.md.
Poi messaggio diretto a "frontend": "Contract proposal ready, review needed."
Teammate "frontend": leggi api-contract.md. Messaggio diretto a "backend" 
con obiezioni o approvazione.
Nessuno implementa finché entrambi non hanno confermato il contratto.
```

**Regola critica:** File ownership esplicita — nessun agente modifica il file dell'altro.

---

## Categoria 3 — Controllo e Qualità

### 3.1 Builder / Validator ✅ Nativo

**Supporto Agent Teams:** Supportato nativamente. Si può anche usare il **Delegate Mode** del lead per fare in modo che il lead si occupi solo di orchestrare il ciclo build→validate senza scrivere codice.

**Come implementarlo:**
```
Spawn two teammates:
- Builder: implementa il nuovo endpoint FINMA-compliant in src/api/
- Validator: attendi completion da Builder, poi verifica:
  (1) test coverage >80%, (2) nessun dato patient in log, 
  (3) audit trail su ogni operazione. 
  Se fallisce, messaggio a Builder con feedback strutturato.
Enable delegate mode on lead.
```

**Variante Multi-Validator:** Spawna 3 validator specializzati in parallelo (sicurezza, performance, compliance) → lead sintetizza. Funziona nativamente.

---

### 3.2 Plan / Execute / Verify ✅ Nativo (con Plan Approval)

**Supporto Agent Teams:** Supportato — anzi, Agent Teams ha una funzionalità dedicata chiamata **Plan Approval**: un teammate lavora in read-only mode finché il lead (o l'umano) non approva il piano.

**Come implementarlo:**
```
Spawn architect teammate in plan-only mode.
Require plan approval before any file modification.
After approval, spawn executor teammate with the approved plan.
Spawn verifier teammate after execution to compare result vs plan.
```

**HITL integrato:** Il Plan Approval è di fatto un gate umano — il lead presenta il piano all'utente che approva/rigetta prima che l'esecuzione inizi. Molto rilevante per contesti regolamentati.

---

### 3.3 Critic / Refine Loop ⚠️ Workaround

**Supporto Agent Teams:** Implementabile ma con limitazioni. Il loop iterativo richiede che il Producer e il Critic si alternino — non è un flusso parallelo. Agent Teams non ha un meccanismo nativo per loop con numero di iterazioni predefinito.

**Come implementarlo:** Istruire esplicitamente il lead a orchestrare N round e a terminare dopo K iterazioni o quando il Critic approva.

**Limitazione:** Rischio che il lead termini prima del previsto ("lead shutting down too early" è una limitazione nota). Istruire esplicitamente: "do NOT synthesize until Critic outputs APPROVED".

---

## Categoria 4 — Pattern Specializzati

### 4.1 Specialist Router ⚠️ Workaround

**Supporto Agent Teams:** Parziale. Il lead può fare da router, ma non può spawnare agenti diversi in risposta a input diversi in modo dinamico — il team viene definito all'avvio. Non esiste routing runtime su input imprevedibili.

**Come implementarlo:** Pre-definire tutti gli specialisti possibili all'avvio e lasciare che il lead indirizzi i task al teammate giusto tramite messaggi.

**Alternativa migliore:** n8n con nodo di classificazione + routing condizionale. Più flessibile per input eterogenei in produzione.

---

### 4.2 Map / Reduce ✅ Nativo

**Supporto Agent Teams:** Eccellente — è concettualmente identico allo Swarm (parallelo) + sintesi del lead (reduce). La shared task list gestisce la distribuzione, il lead fa il reduce.

**Come implementarlo:**
```
[Map] Spawn N teammates, uno per modulo del codebase.
Ogni teammate analizza il suo modulo e scrive findings-{module}.md.
[Reduce] Lead legge tutti i findings e produce security-report.md aggregato.
```

---

### 4.3 Ensemble / Voting ✅ Nativo (con isolamento esplicito)

**Supporto Agent Teams:** Implementabile — ma richiede attenzione. Gli agenti devono essere isolati nella fase di risposta (non leggere il file degli altri prima di aver scritto il proprio). Il lead fa da Voter.

**Caveat:** Isolare gli agenti in Agent Teams richiede istruzioni esplicite — il sistema di messaggistica potrebbe portare contaminazione involontaria se non gestita.

---

### 4.4 Memory-Augmented Agent ❌ Non supportato nativamente

**Supporto Agent Teams:** Non supportato — è la limitazione più significativa. Agent Teams è **efimero per design**: nessuna memoria cross-sessione, nessun `/resume` che ripristini i teammates, nessuna integrazione nativa con vector store.

**Workaround documentato dalla community:** Scrivere la memoria su file nel progetto (es. `memory/decisions.md`, `memory/context.md`) che i teammates leggono all'avvio tramite CLAUDE.md. È una memoria povera — testuale, non semantica.

**Alternativa corretta:** Per memoria persistente e semantica (RAG su Qdrant), serve un'architettura esterna. Nel tuo stack: Semantic Kernel + Qdrant gestisce questo nativamente e si integra con Agent Teams tramite file di contesto.

---

### 4.5 Human-in-the-Loop ✅ Nativo (Plan Approval + Delegate Mode)

**Supporto Agent Teams:** Supportato con due meccanismi dedicati:
- **Plan Approval**: il teammate presenta un piano, nessun codice viene scritto senza approvazione umana
- **Delegate Mode** (Shift+Tab): il lead si limita a orchestrare, non implementa — l'umano mantiene il controllo sull'esecuzione complessiva
- **Interazione diretta con teammates**: Shift+Down permette di interrompere o reindirizzare un singolo teammate mid-task

---

## Matrice di Compatibilità — Riepilogo

| Pattern | Agent Teams | Note |
|---|---|---|
| Hub-and-Spoke | ✅ Nativo | Pattern base della piattaforma |
| Sequential Pipeline | ⚠️ Workaround | Task dependency + gestione lag manuale |
| Hierarchical Decomposition | ❌ Non supportato | No nested teams per design |
| Adversarial Debate | ✅ Nativo | Richiede istruzioni peer-to-peer esplicite |
| Collaborative Refinement | ⚠️ Workaround | Pipeline sequenziale su artefatto |
| Swarm / Parallel Investigation | ✅ Nativo | Use case primario |
| Negotiation / Interface Contract | ✅ Nativo | File ownership esplicita obbligatoria |
| Builder / Validator | ✅ Nativo | Ottimo con Delegate Mode |
| Plan / Execute / Verify | ✅ Nativo | Plan Approval è HITL nativo |
| Critic / Refine Loop | ⚠️ Workaround | Rischio early termination del lead |
| Specialist Router | ⚠️ Workaround | No routing dinamico runtime |
| Map / Reduce | ✅ Nativo | Swarm + sintesi lead |
| Ensemble / Voting | ✅ Nativo | Isolamento esplicito necessario |
| Memory-Augmented Agent | ❌ Non supportato | Solo workaround testuale su file |
| Human-in-the-Loop | ✅ Nativo | Plan Approval + Delegate Mode |

---

## Conclusione: Agent Teams vs Framework Esterni

Agent Teams è uno strumento **interattivo ed esplorativo**, non un framework di produzione. La distinzione chiave:

**Agent Teams è la scelta giusta quando:**
- Il task è esplorativo, one-shot, non ripetibile
- Vuoi zero boilerplate e velocità di setup
- I pattern sono nella zona ✅ della matrice
- Non hai bisogno di audit trail strutturato

**Un framework esterno (n8n + Semantic Kernel) è necessario quando:**
- Il workflow deve girare in modo ripetibile e schedulato (CI/CD, nightly)
- Hai bisogno di memoria persistente cross-sessione (Qdrant)
- Il contesto è FINMA/EPD — ogni decisione inter-agente deve essere auditabile
- Hai bisogno di Hierarchical Decomposition o routing dinamico
- Vuoi selezionare modelli diversi per ruoli diversi (cost optimization)

Per il tuo Council of Agents: Agent Teams può essere usato come **prototipazione rapida** di nuovi pattern prima di implementarli su n8n — è il suo vero valore nel tuo contesto.