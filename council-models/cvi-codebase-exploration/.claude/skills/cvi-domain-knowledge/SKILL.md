---
name: cvi-domain-knowledge
description: NI LabWindows/CVI API patterns, function signatures, and library reference for all agents analyzing CVI codebases
---

# LabWindows/CVI Domain Knowledge

## NI-VISA (Virtual Instrument Software Architecture)

NI-VISA provides a unified I/O layer for communicating with instruments regardless of bus type (GPIB, serial, TCP/IP, USB).

**Key functions:**
| Function | Purpose | Signature |
|----------|---------|-----------|
| `viOpenDefaultRM` | Open default resource manager | `ViStatus viOpenDefaultRM(ViPSession sesn)` |
| `viOpen` | Open instrument session | `ViStatus viOpen(ViSession sesn, ViRsrc rsrcName, ViAccessMode accessMode, ViUInt32 openTimeout, ViPSession vi)` |
| `viClose` | Close session | `ViStatus viClose(ViObject vi)` |
| `viWrite` | Write raw bytes | `ViStatus viWrite(ViSession vi, ViBuf buf, ViUInt32 cnt, ViPUInt32 retCnt)` |
| `viRead` | Read raw bytes | `ViStatus viRead(ViSession vi, ViPBuf buf, ViUInt32 cnt, ViPUInt32 retCnt)` |
| `viPrintf` | Formatted write (like printf) | `ViStatus viPrintf(ViSession vi, ViString writeFmt, ...)` |
| `viScanf` | Formatted read (like scanf) | `ViStatus viScanf(ViSession vi, ViString readFmt, ...)` |
| `viQueryf` | Combined write+read | `ViStatus viQueryf(ViSession vi, ViString writeFmt, ViString readFmt, ...)` |
| `viSetAttribute` | Set session attribute | `ViStatus viSetAttribute(ViObject vi, ViAttr attrName, ViAttrState attrValue)` |
| `viGetAttribute` | Get session attribute | `ViStatus viGetAttribute(ViObject vi, ViAttr attrName, ViPAttrState attrValue)` |

**Resource string format:** `"GPIB0::12::INSTR"`, `"TCPIP::192.168.1.1::INSTR"`, `"ASRL1::INSTR"`

## NI-488.2 (GPIB)

Low-level GPIB (IEEE-488) communication. Older API than VISA, still common in legacy code.

**Key functions:**
| Function | Purpose |
|----------|---------|
| `ibfind` | Open device by name (configured in NI MAX) |
| `ibdev` | Open device by board/address |
| `ibwrt` | Write string to device |
| `ibrd` | Read string from device |
| `ibclr` | Send device clear |
| `ibloc` | Set device to local mode |
| `ibconfig` | Configure device settings |
| `ibsta` | Status word (global) |
| `iberr` | Error code (global) |
| `ibcnt` / `ibcntl` | Byte count of last operation (global) |

**Note:** NI-488.2 uses global status variables (`ibsta`, `iberr`, `ibcnt`), not return codes. This is a key difference from VISA.

## NI-DAQmx (Data Acquisition)

Used for analog/digital I/O with NI hardware (PCI, PXI, USB DAQ devices).

**Key functions:**
| Function | Purpose |
|----------|---------|
| `DAQmxCreateTask` | Create a new task |
| `DAQmxCreateAIVoltageChan` | Add analog input voltage channel |
| `DAQmxCreateAOVoltageChan` | Add analog output voltage channel |
| `DAQmxCreateDIChan` | Add digital input channel |
| `DAQmxCreateDOChan` | Add digital output channel |
| `DAQmxCfgSampClkTiming` | Configure sample clock timing |
| `DAQmxStartTask` | Start the task |
| `DAQmxStopTask` | Stop the task |
| `DAQmxClearTask` | Clear the task and release resources |
| `DAQmxReadAnalogF64` | Read analog data as float64 |
| `DAQmxWriteAnalogF64` | Write analog data as float64 |
| `DAQmxReadDigitalLines` | Read digital lines |

**Pattern:** Create -> Configure channels -> Configure timing -> Start -> Read/Write loop -> Stop -> Clear

## NI-Serial

Serial communication (RS-232/RS-485) via CVI library functions.

**Key functions:**
| Function | Purpose |
|----------|---------|
| `OpenComConfig` | Open and configure COM port (baud, parity, data bits, stop bits) |
| `CloseCom` | Close COM port |
| `ComWrt` | Write bytes to serial port |
| `ComRd` | Read bytes from serial port |
| `ComWrtByte` | Write single byte |
| `ComRdByte` | Read single byte |
| `FlushInQ` | Flush input queue |
| `FlushOutQ` | Flush output queue |
| `GetInQLen` | Get input queue length |
| `InstallComCallback` | Install event-driven callback for serial events |

## CVI UI Functions

CVI uses `.uir` files (binary) for UI definition and C callbacks for event handling.

**Key functions:**
| Function | Purpose |
|----------|---------|
| `LoadPanel` | Load a panel from .uir file |
| `LoadPanelEx` | Load panel with callback map |
| `DisplayPanel` | Show a panel |
| `HidePanel` | Hide a panel |
| `DiscardPanel` | Destroy a panel |
| `RunUserInterface` | Enter UI event loop (blocks until `QuitUserInterface`) |
| `QuitUserInterface` | Exit UI event loop |
| `GetCtrlVal` | Read a control's value |
| `SetCtrlVal` | Set a control's value |
| `GetCtrlAttribute` | Read a control attribute (color, visibility, etc.) |
| `SetCtrlAttribute` | Set a control attribute |
| `InstallCtrlCallback` | Install callback for a control |
| `InstallMenuCallback` | Install callback for a menu item |
| `SetCtrlIndex` | Set list/ring control index |
| `InsertListItem` | Add item to list control |
| `DeleteListItem` | Remove item from list control |
| `PlotY` / `PlotXY` | Plot data on a graph control |
| `DeleteGraphPlot` | Remove a plot from graph |

**Callback signature:**
```c
int CVICALLBACK PanelName_ControlCB(int panel, int control, int event,
    void *callbackData, int eventData1, int eventData2)
```

**Common events:** `EVENT_COMMIT` (button click, value change confirmed), `EVENT_VAL_CHANGED`, `EVENT_LEFT_CLICK`, `EVENT_TIMER_TICK`

## CVI Threading

| Function | Purpose |
|----------|---------|
| `CmtScheduleThreadPoolFunction` | Schedule function on thread pool |
| `CmtGetLock` | Acquire lock |
| `CmtReleaseLock` | Release lock |
| `CmtNewLock` | Create new lock |
| `CmtDiscardLock` | Destroy lock |
| `CmtNewTSQ` | Create thread-safe queue |
| `CmtWriteTSQData` | Write data to TSQ |
| `CmtReadTSQData` | Read data from TSQ |
| `PostDeferredCall` | Execute function on UI thread (thread-safe UI update) |

**Critical pattern:** UI controls can only be accessed from the main thread. Background threads must use `PostDeferredCall` to update UI.

## CVI Utility Functions

| Function | Purpose |
|----------|---------|
| `SetBreakOnLibraryErrors` | Enable/disable automatic breakpoint on library errors |
| `GetCurrentDateTime` | Get current date/time |
| `Fmt` | Formatted string building (CVI-specific, similar to sprintf) |
| `Scan` | Formatted string parsing (CVI-specific, similar to sscanf) |
| `MakeDir` | Create directory |
| `GetDir` | Get current directory |
| `FileSelectPopup` | File open/save dialog |
| `MessagePopup` | Message box dialog |
| `ConfirmPopup` | Yes/No dialog |
| `SetWaitCursor` | Show/hide wait cursor |
| `ProcessSystemEvents` | Process pending UI events (keep UI responsive during long operations) |
