# Parallel Investigation Council

This folder contains the **Parallel Investigation** (Swarm) council: three investigators explore **different hypotheses** on the same problem in parallel (e.g. gateway latency, intermittent failures). The Coordinator moderates, instructs **peer-to-peer evidence exchange** between investigators, and writes consolidated findings.

## Protocol

- **CLAUDE.md** — Shared protocol: Round 1 = initial hypotheses; Round 2+ = peer-to-peer direct messages with evidence that supports/refutes others' hypotheses; synthesis = `findings.md`. No voting.
- **agents/coordinator.md** — Lead: spawns investigators, runs rounds, instructs direct messages between them, writes `round-{n}.md` and `findings.md`.

## Agents

| Agent | Spawn prompt | Focus |
|-------|--------------|-------|
| Investigator SAML | `agents/investigator-saml.md` | Auth, SAML, timing, token validation |
| Investigator YARP | `agents/investigator-yarp.md` | Gateway, YARP routing, proxy, load |
| Investigator Data | `agents/investigator-data.md` | Database, Qdrant, connection pool, latency |

All must send **direct messages** to each other from Round 2 onward when they find evidence that supports or refutes another's hypothesis. The Coordinator must state this explicitly in the round instructions.

## Output

- `council-log/{topic-slug}/round-{n}.md` — Each investigator's hypothesis, evidence, **Messages to other investigators** (formatted as "To Investigator X: ..."), and updated view per round.
- `council-log/{topic-slug}/findings.md` — Coordinator's synthesis. **findings.md** includes: (1) **Peer-to-Peer Communications** — full trace of all direct messages between investigators by round (extracted from round files); (2) Hypotheses Explored; (3) Evidence Summary; (4) Conclusion / Recommendation.

## Council Console reporting

Each investigator markdown (`investigator-saml.md`, `investigator-yarp.md`, `investigator-data.md`) includes a **"## Council Console reporting"** section: when the run is started from the Council Console, teammates receive the **Report URL** in their spawn prompt (injected by the server). They must send multiple POSTs per round (start of round, intermediate steps with `"intermediate": true`, final response) to that URL so the UI panels stream live. Same pattern as the default council (Product Analyst, Architect, QA Strategist).

## Run

**CLI** (from repo root):

```powershell
pnpm council -- --config parallel-investigation/council.config.json --topic "Perché il gateway mostra latenza intermittente? Esplorare ipotesi SAML, YARP, Qdrant, connection pool."
```

**Council Console**: Start the backend (port 8002) and UI (port 3003), open http://localhost:3003, set **Config path** to `parallel-investigation/council.config.json`, enter the topic, and click **Launch council**. The Coordinator will execute the protocol immediately (spawn investigators, run rounds, write `findings.md`).

See the main [README](../README.md) for prerequisites and CLI options.
