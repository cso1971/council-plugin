# Adversarial Debate Council

This folder contains the **Adversarial Debate** council: two Software Architects debate **microservices vs monolith/monorepo** on a given topic. The Coordinator moderates, instructs peer-to-peer counter-arguments, and writes a balanced recommendation.

## Protocol

- **CLAUDE.md** — Shared protocol: 4-phase cycle (initial position → peer-to-peer exchange → revised positions → synthesis), response format (Position, Evidence, Counter-argument, Conclusion), quality rules. No voting.
- **agents/coordinator.md** — Lead: spawns both debaters, runs rounds, instructs direct messages between them, writes `round-{n}.md` and `recommendation.md`.

## Agents

| Agent | Spawn prompt | Skill |
|-------|--------------|-------|
| Architect Microservices | `agents/architect-microservices.md` | `.claude/skills/microservices-advocate/SKILL.md` |
| Architect Monolith | `agents/architect-monolith.md` | `.claude/skills/monolith-advocate/SKILL.md` |

Both must send **direct messages** to each other from Round 2 onward (see tip: peer instructions). The Coordinator must state this explicitly in the round instructions.

## Output

- `council-log/{topic-slug}/round-{n}.md` — Both positions and conclusions per round.
- `council-log/{topic-slug}/recommendation.md` — Coordinator’s synthesis: summary of positions, trade-offs, balanced recommendation (when to prefer which approach).

## Run

From the repo root:

```powershell
pnpm council -- --config adversarial-debate/council.config.json --topic "Your architectural topic"
```

See the main [README](../README.md) for prerequisites and CLI options.
