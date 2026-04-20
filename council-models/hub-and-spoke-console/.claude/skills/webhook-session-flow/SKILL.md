---
name: webhook-session-flow
description: "Session API and log pipeline for Council Console — sessions list/detail/stop, WebSocket streaming to the log viewer, and agent POST reporting. Use when topics involve /sessions routes, session persistence, or end-to-end operator visibility for runs."
---

# Session + log viewer flow

## Purpose

The **Council Console server** (`council-console/src/council-console-server/` or `council-console-server-dotnet/`) owns **sessions** and streams log lines. The **log viewer** (`council-console/src/log-viewer/`) calls the same REST + WebSocket API (`VITE_WEBHOOK_URL` base URL, typically console server on port 8002).

## Mental model

1. A council run creates or updates a **session** with a stable identifier.
2. Log lines and events are **appended** to that session’s store or stream.
3. The **log viewer** lists sessions and opens a detail view (polling + WebSocket).
4. **Report URLs** can be passed into agent prompts so intermediate output appears in the Council Console.

## What to verify in proposals

- **Correlation**: session id, run id, and external ids should remain traceable in logs.
- **Failure modes**: long-running council process; how errors surface to operators.
- **API contract**: REST + WebSocket shapes shared by TS and .NET console servers.

## Cross-package impact

Changes often touch **council-console-server** (or **council-console-server-dotnet**), **shared** modules, and **log-viewer** consumption. Mention all affected packages in architectural outputs.
