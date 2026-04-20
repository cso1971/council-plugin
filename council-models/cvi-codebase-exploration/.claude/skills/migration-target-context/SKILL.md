---
name: migration-target-context
description: Migration target mapping from CVI patterns to Web application architecture (backend .NET + frontend Angular) — complexity assessment and equivalence guide
---

# Migration Target Context

## Target Architecture

The migration target is a **Web application** with:
- **Backend:** .NET (ASP.NET Core) — handles hardware communication, business logic, data persistence, API layer
- **Frontend:** Angular — handles UI, data visualization, real-time status display
- **Communication:** REST API for request/response, SignalR (WebSocket) for real-time streaming

**Key architectural shift:** In CVI, the UI and hardware communication live in the same process on the same machine. In the target architecture, they are separated: the backend runs on the machine connected to instruments, the frontend runs in a browser (potentially on a different machine).

## Pattern Mapping

### Hardware Communication

| CVI Pattern | .NET Backend Equivalent | Migration Complexity |
|-------------|------------------------|---------------------|
| NI-VISA (`viOpen`, `viWrite`, `viRead`) | IVI.NET / `NationalInstruments.Visa` namespace, exposed via REST/WebSocket API | Medium-High — API is conceptually similar but needs web API layer |
| NI-488.2 (`ibwrt`, `ibrd`, global `ibsta`) | NI GPIB .NET / `Ivi.Visa`, global status replaced by return values/exceptions | Medium-High — global status pattern requires redesign |
| NI-DAQmx (`DAQmxCreateTask`, etc.) | NI-DAQmx .NET API (official wrapper), exposed via API | Medium — official .NET wrapper exists, but needs API layer |
| NI-Serial (`OpenComConfig`, `ComWrt`) | `System.IO.Ports.SerialPort`, exposed via API | Medium — different API, same concepts |
| SCPI command strings | Same strings, sent via .NET transport layer | Low — SCPI is transport-agnostic |

### UI

| CVI Pattern | Angular Frontend Equivalent | Migration Complexity |
|-------------|---------------------------|---------------------|
| `.uir` panels + callback C functions | Angular components + event handlers | High — complete redesign, no automated conversion |
| `GetCtrlVal` / `SetCtrlVal` | Angular data binding (signals, `[(ngModel)]`) | High — paradigm shift from imperative to declarative/reactive |
| `PlotY` / `PlotXY` on graph controls | Charting library (ngx-charts, Plotly.js, ECharts) | Medium — different API, same visualization concepts |
| `InstallCtrlCallback` event model | Angular event binding `(click)`, `(change)`, RxJS | High — from C function pointers to reactive streams |
| `RunUserInterface` blocking event loop | Angular change detection + Zone.js (automatic) | N/A — paradigm does not exist in Angular |
| `PostDeferredCall` (thread-safe UI update) | SignalR push -> Angular `NgZone.run()` or signals | Medium-High — new pattern, but cleaner |
| Timer callbacks | `setInterval`, RxJS `timer`, or Angular `signals` | Low-Medium |

### State Management

| CVI Pattern | Target Equivalent | Migration Complexity |
|-------------|------------------|---------------------|
| Global variables for app state | Backend: DI container + services. Frontend: Angular services + signals/stores | Medium — requires explicit design of state ownership |
| Global instrument handles | Backend: scoped services with `IDisposable` lifecycle | Medium — DI handles lifetime, but needs design |
| Shared data buffers (globals) | Backend: concurrent collections or channels. Frontend: RxJS BehaviorSubject or Angular signals | Medium — must decide where state lives |

### Threading and Concurrency

| CVI Pattern | Target Equivalent | Migration Complexity |
|-------------|------------------|---------------------|
| `CmtScheduleThreadPoolFunction` | Backend: `async/await`, `Task.Run`, `Channel<T>` | Medium-High — paradigm shift to async |
| `CmtGetLock` / `CmtReleaseLock` | Backend: `SemaphoreSlim`, `lock`, `Monitor` | Low-Medium — direct equivalents exist |
| `CmtNewTSQ` (thread-safe queue) | Backend: `Channel<T>`, `BlockingCollection<T>` | Low — direct equivalent |
| `PostDeferredCall` (UI thread dispatch) | Frontend: SignalR stream -> Angular zone | Medium — split across backend/frontend boundary |
| Polling loops (`while + Delay`) | Backend: `async` with `await Task.Delay`. Frontend: RxJS `interval` + `switchMap` | Medium |

### File I/O and Data

| CVI Pattern | Target Equivalent | Migration Complexity |
|-------------|------------------|---------------------|
| Custom binary/text data formats | Backend: `System.IO`, custom parsers. Frontend: download via API | Low-Medium |
| Excel export (programmatic) | Backend: EPPlus / ClosedXML / NPOI. Frontend: download link | Low-Medium |
| Calibration data files | Backend: JSON/YAML config + file service, exposed via API | Medium — may need format migration |
| `.ini` configuration files | Backend: `appsettings.json` + `IConfiguration`. Frontend: API-served config | Low-Medium |

### Integration

| CVI Pattern | Target Equivalent | Migration Complexity |
|-------------|------------------|---------------------|
| Shared memory / IPC | SignalR (real-time backend->frontend), gRPC (between backend services) | Medium |
| DLL exports | Backend: .NET class library, exposed via API | Medium |
| COM/DCOM | Backend: COM interop (if needed) or native .NET replacement | Medium-High |

### New Patterns (not in CVI)

The web architecture introduces patterns that have no CVI equivalent:

| Pattern | Purpose | Notes |
|---------|---------|-------|
| REST API layer | Expose backend functionality to frontend | Every hardware operation needs an API endpoint |
| SignalR hub | Real-time push (measurement streaming, status updates) | Replaces CVI's direct UI update from background thread |
| Angular routing | Multi-page navigation | CVI uses `DisplayPanel`/`HidePanel` |
| Authentication/authorization | Web security | CVI desktop apps typically have no auth |
| Instrument connection health monitoring | Show connection status in browser UI | Backend: health check service. Frontend: real-time via SignalR |
| Data visualization components | Charts, gauges, indicators | Replace CVI graph/LED/meter controls |

## Assessment Guidelines

When evaluating Migration Impact, consider:

1. **Separation score:** How cleanly separated is the code into (a) hardware communication, (b) business logic, (c) UI? Well-separated code migrates per-layer. Entangled code requires refactoring first.

2. **Abstraction level:** Code at Level 2 (generic instrument interface) migrates easiest. Level 0 (direct driver calls) requires wrapping in .NET equivalents.

3. **State coupling:** Code that relies on global state requires explicit state management design. The more globals, the more design work.

4. **Real-time requirements:** CVI's direct in-process communication has near-zero latency. Web architecture adds network latency. Tight timing loops may need to stay in the backend with only results streamed to frontend.

5. **UI complexity:** Simple forms migrate easily. Complex real-time graphs with interactive markers, zooming, and cursor tracking require significant Angular component design.
