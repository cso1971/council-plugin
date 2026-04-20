---
name: test-verification
description: "Verification command patterns for Claude Code task prompts — Vitest, dotnet test, build checks, curl-based integration tests, and structured expected output. Use when the Test Verifier needs to define how to confirm a task is correctly implemented, what commands to run, and what output to expect."
---

# Test Verification — Proving Tasks Are Done

Use this skill when defining verification commands for decomposed task prompts.

---

## Verification Principle

Every task must have a command that answers: "Did this task produce the correct result?"

The command must be:
- **Automated**: no manual inspection
- **Reproducible**: same result every time on the same code
- **Isolated**: doesn't depend on other tasks' verification having run
- **Fast**: completes in under 60 seconds (preferably under 10)

---

## Verification Patterns by Task Type

### TypeScript source code tasks

#### New module or function

```bash
# 1. Type check passes
npx tsc --noEmit

# 2. Tests pass (if tests are part of this task)
npx vitest run src/shared/__tests__/config-loader.test.ts
```

**Expected output template**:
```
✓ src/shared/__tests__/config-loader.test.ts (12 tests)
 Tests  12 passed (12)
```

#### Modified module

```bash
# 1. Type check still passes
npx tsc --noEmit

# 2. Existing tests still pass + new tests pass
npx vitest run src/shared/__tests__/config-loader.test.ts
```

**Expected**: same or higher test count, zero failures.

#### Test-only task

```bash
npx vitest run src/shared/__tests__/config-loader.test.ts --reporter=verbose
```

**Expected**: specific test names listed, all passing. Example:
```
 ✓ loadConfig > returns typed CouncilConfig for valid JSON
 ✓ loadConfig > throws ConfigError for missing maxRounds
 ✓ loadConfig > throws ConfigError for malformed JSON
 ✓ toSlug > normalizes basic text
 ✓ toSlug > handles accented characters
 ✓ toSlug > truncates long text to 80+8 chars
```

### .NET tasks

#### New project scaffold

```bash
dotnet build src/CouncilConsole.Server/CouncilConsole.Server.csproj
```

**Expected**:
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

#### Ported logic with tests

```bash
dotnet test src/CouncilConsole.Server.Tests/ --verbosity normal
```

**Expected**:
```
Passed!  - Failed:     0, Passed:    12, Skipped:     0, Total:    12
```

#### Specific test class

```bash
dotnet test src/CouncilConsole.Server.Tests/ --filter "FullyQualifiedName~ConfigLoaderTests"
```

### JavaScript/Node.js tasks (shim, scripts)

#### Script execution

```bash
echo '{"configPath":"test","topic":"test"}' | node src/council-console-server/shim/claude-shim.js 2>/dev/null; echo "Exit: $?"
```

**Expected**: specific exit code and/or output format.

#### Module import check

```bash
node -e "import('./src/council-console-server/shim/claude-shim.js').then(() => console.log('OK')).catch(e => { console.error(e.message); process.exit(1) })"
```

### Build and type check tasks

#### Full type check

```bash
npx tsc --noEmit 2>&1 | tail -1
```

**Expected**: no output (clean) or specific expected output.

#### .NET build

```bash
dotnet build --no-restore 2>&1 | grep -E "(Build succeeded|Error)"
```

### Integration / API tasks

#### Health check

```bash
curl -sf http://localhost:8002/health | jq -r .status
```

**Expected**: `ok`

#### Route exists and responds correctly

```bash
curl -sf -X POST http://localhost:8002/council/start \
  -H "Content-Type: application/json" \
  -d '{"topic":"verify","configPath":"council-models/hub-and-spoke-console/council.config.json"}' \
  -o /dev/null -w "%{http_code}"
```

**Expected**: `201` (or `400` for specific error test)

#### Error response shape

```bash
curl -sf -X POST http://localhost:8002/council/start \
  -H "Content-Type: application/json" \
  -d '{}' 2>&1 | jq -r .error
```

**Expected**: `topic is required`

---

## Expected Output Specification

### Be specific about counts

```
# Good
Expected: 12 tests passed, 0 failed

# Bad
Expected: tests pass
```

### Be specific about output format

```
# Good
Expected output contains: "Build succeeded" and "0 Error(s)"

# Bad
Expected: build works
```

### Handle non-deterministic output

Some verification output varies (timestamps, UUIDs). Specify what to check:

```
# Good
Expected: response body has fields: runId (UUID string), streamUrl (string starting with /council/stream/), speakers (array of 4 strings)

# Bad
Expected: response body matches exact JSON
```

---

## Failure Indicators

For each verification, also define what failure looks like:

| Verification type | Success indicator | Failure indicators |
|-------------------|-------------------|-------------------|
| `vitest run` | "Tests {N} passed ({N})" | "FAIL", "Error:", any non-zero exit code |
| `tsc --noEmit` | No output, exit code 0 | "error TS", any output on stderr |
| `dotnet build` | "Build succeeded" | "Build FAILED", "error CS" |
| `dotnet test` | "Passed!" with 0 failed | "Failed!", non-zero failed count |
| `curl` | Expected HTTP status code | Different status code, connection refused, timeout |

---

## Untestable Task Patterns

Some tasks resist automated verification. Handle them:

### UI-only changes (no tests yet)

```
Verification: Manual — open http://localhost:3003 and verify:
- [ ] Panel shows speaker name in header
- [ ] Intermediate lines are indented
- [ ] Status badge color matches RunStatus

Note: Consider adding a Playwright test if this is a recurring pattern.
```

### Process supervision (Claude CLI spawning)

```
Verification: Mock-based unit test only.
The real Claude CLI cannot be invoked in verification (costs tokens, non-deterministic).
Use the mock-claude helper from Story 01's test infrastructure.
```

### Docker image changes

```bash
# Build check (doesn't require running)
docker compose build council-console-server 2>&1 | tail -3
```

**Expected**: contains "Successfully built" or "exporting to image"

---

## Verification Prerequisites

Always document what must be true before the verification command works:

| Prerequisite | Example |
|-------------|---------|
| **Dependencies installed** | `pnpm install` has been run |
| **Build completed** | `dotnet build` for .NET tasks |
| **Server running** | For `curl`-based checks: `pnpm start:console-server` |
| **Test infrastructure exists** | Story 01 tasks must be completed first |
| **Config file exists** | Specific council.config.json path must be valid |

Include prerequisites in the task prompt's Verification section:

```markdown
## Verification

**Prerequisites**: `pnpm install` completed, no server needs to be running.

```bash
npx vitest run src/shared/__tests__/config-loader.test.ts
```
```
