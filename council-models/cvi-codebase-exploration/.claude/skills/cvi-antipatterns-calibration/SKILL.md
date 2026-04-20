---
name: cvi-antipatterns-calibration
description: Calibrated thresholds for evaluating C/CVI code quality — distinguishes normal CVI idioms from genuine migration-blocking problems
---

# CVI Anti-Patterns Calibration

## Purpose

Standard code quality metrics and heuristics from modern software engineering are **miscalibrated** for C/CVI codebases. This skill provides calibrated criteria so agents avoid false positives (flagging normal CVI patterns as problems) and false negatives (missing real issues because they look like "normal C").

## What Is NORMAL in C/CVI — Do NOT Flag as Problems

### Cyclomatic complexity 20-30 per function
C procedural code handles all control flow explicitly (no polymorphism, no exceptions, no pattern matching). A function that initializes 6 instruments with error checking for each will naturally have CC 25+. **Threshold for concern: CC > 40** for non-initialization functions.

### Functions 200-500+ lines
Initialization routines, acquisition loops, and UI setup functions are commonly this long. The issue is not length per se but **whether the function does one coherent thing**. A 400-line `InitializeAllInstruments()` is fine. A 400-line function that initializes instruments AND runs an acquisition AND saves data is a problem.

### Global variables for state
CVI applications commonly use global variables for:
- Instrument handles (`ViSession`, `int` for GPIB)
- Panel handles (`int panelHandle`)
- Application state (running/stopped, current mode)
- Shared data buffers

This is standard CVI practice. The issue is not globals per se but **undocumented globals** or **globals modified from multiple threads without synchronization**.

### `goto cleanup` for error handling
This is the **recommended C pattern** for resource cleanup:
```c
int DoSomething(void)
{
    int error = 0;
    char *buffer = NULL;

    buffer = malloc(1024);
    if (!buffer) { error = -1; goto cleanup; }

    error = SomeOperation(buffer);
    if (error) goto cleanup;

    error = AnotherOperation(buffer);
    if (error) goto cleanup;

cleanup:
    if (buffer) free(buffer);
    return error;
}
```
This is **not** an anti-pattern. It is idiomatic C and explicitly recommended by NI documentation. Do NOT flag it.

### Hardcoded SCPI command strings
`viPrintf(instr, "*IDN?\n")` is standard practice. SCPI commands are static strings defined by instrument standards. Extracting them to constants adds noise without value.

### Cast expressions and pointer arithmetic
Normal in C. Only flag if the cast hides a type mismatch bug or the pointer arithmetic is unbounded.

### `#define` for constants
C89 (which CVI targets) does not have `const` with the same guarantees as C99+. Using `#define` for constants is standard practice.

## What IS a Problem — Flag with Severity

### Critical

**Business logic mixed with SCPI commands in the same function:**
```c
// BAD: measurement logic and instrument communication interleaved
double MeasureAndCalculate(ViSession instr)
{
    double voltage;
    viQueryf(instr, ":MEAS:VOLT:DC?\n", "%lf", &voltage);
    double corrected = voltage * calibrationFactor + offset;  // business logic
    viPrintf(instr, ":CONF:VOLT:AC\n");  // instrument setup
    double acVoltage;
    viQueryf(instr, ":MEAS:VOLT:AC?\n", "%lf", &acVoltage);
    return sqrt(corrected * corrected + acVoltage * acVoltage);  // more business logic
}
```
**Why critical for migration:** Impossible to test business logic without hardware. Impossible to swap instrument driver. Must be separated before migration.

**GPIB bus shared without mutex/lock:**
Multiple threads sending commands on the same GPIB bus without synchronization can cause data corruption, instrument hangs, or bus lockups. This is a **runtime bug**, not just a migration concern.

### High

**Timeout values hardcoded without configuration:**
`viSetAttribute(instr, VI_ATTR_TMO_VALUE, 5000);` — if the timeout needs to change per deployment or instrument, this requires recompilation.

**No error handling after hardware communication:**
```c
viPrintf(instr, "MEAS:VOLT?\n");
viScanf(instr, "%lf", &voltage);  // What if viPrintf failed? What if timeout?
```

**God file — single `.c` exceeding 2000 lines** containing unrelated functionality (UI callbacks + instrument communication + data processing + file I/O all in one file).

### Medium

**Copy-paste instrument driver code:** Same communication pattern duplicated across multiple instrument files with only command strings changed. Indicates missing abstraction layer.

**Memory allocation without consistent cleanup pattern:** Mix of `malloc`/`free`, `calloc`, and CVI-specific allocation with no clear ownership or lifetime management.

**Thread safety with ad-hoc locks:** Lock/unlock patterns that are not consistently applied, or locks created but sometimes bypassed.

### Low

**Naming convention inconsistent between modules:** `SR830_ReadVoltage` vs `keithley_read_voltage` vs `ReadVNA`. Not a functional problem but increases cognitive load during migration.
