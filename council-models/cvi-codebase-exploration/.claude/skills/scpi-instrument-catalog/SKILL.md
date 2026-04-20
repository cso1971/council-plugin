---
name: scpi-instrument-catalog
description: SCPI command reference for instruments found in iMeazure codebase — SR830/SR850, E5062A, E4402B, Lakeshore 340, Keithley 2000, Agilent 33220A
---

# SCPI Instrument Catalog — iMeazure

## General SCPI Commands (IEEE 488.2 Common)

These commands are supported by all SCPI-compliant instruments:

| Command | Purpose |
|---------|---------|
| `*IDN?` | Identify instrument (manufacturer, model, serial, firmware) |
| `*RST` | Reset to factory defaults |
| `*CLS` | Clear status registers |
| `*OPC?` | Operation complete query (returns 1 when all pending operations done) |
| `*ESR?` | Event status register query |
| `*STB?` | Status byte query |
| `*TST?` | Self-test (returns 0 if passed) |

## Stanford Research SR830 / SR850 — Lock-in Amplifier

**Bus:** GPIB
**Purpose:** Measure amplitude and phase of AC signals buried in noise. Core instrument for lock-in measurement techniques.

**Key commands:**

| Command | Purpose | Response |
|---------|---------|----------|
| `FREQ?` | Query reference frequency | Frequency in Hz |
| `FREQ {f}` | Set internal reference frequency | — |
| `SLVL?` | Query sine output level | Voltage in V |
| `SLVL {v}` | Set sine output level | — |
| `OFLT?` | Query time constant | Integer index (0=10us, 1=30us, ..., 19=30ks) |
| `OFLT {i}` | Set time constant | — |
| `SENS?` | Query sensitivity | Integer index (0=2nV, ..., 26=1V) |
| `SENS {i}` | Set sensitivity | — |
| `OUTP? {i}` | Read single output (1=X, 2=Y, 3=R, 4=theta) | Float value |
| `SNAP? {i},{j}` | Simultaneous read of 2-6 outputs | Comma-separated floats |
| `DDEF {ch},{i},{j}` | Define channel display (ratio, expand) | — |
| `OAUX? {i}` | Read auxiliary input (1-4) | Voltage in V |

**Note:** SR830 and SR850 share the same command set. SR850 has higher frequency range (up to 102.4 kHz vs 102 kHz).

## Agilent E5062A — Vector Network Analyzer (VNA)

**Bus:** GPIB / LAN
**Purpose:** Measure S-parameters (S11, S21, etc.) — reflection and transmission characteristics of RF/microwave components.

**Key commands:**

| Command | Purpose |
|---------|---------|
| `:SENS:FREQ:STAR {f}` | Set start frequency |
| `:SENS:FREQ:STOP {f}` | Set stop frequency |
| `:SENS:FREQ:CENT {f}` | Set center frequency |
| `:SENS:FREQ:SPAN {f}` | Set frequency span |
| `:SENS:SWE:POIN {n}` | Set number of sweep points |
| `:SENS:BAND {bw}` | Set IF bandwidth |
| `:CALC:PAR:DEF {S-param}` | Define measurement parameter (S11, S21, etc.) |
| `:CALC:FORM {format}` | Set data format (MLOG, PHAS, GDEL, SLIN, etc.) |
| `:CALC:DATA:FDAT?` | Read formatted trace data |
| `:CALC:DATA:SDAT?` | Read complex (S-param) data |
| `:INIT:CONT {ON|OFF}` | Continuous/single sweep |
| `:TRIG:SOUR {BUS|INT|EXT}` | Set trigger source |
| `:SOUR:POW {dBm}` | Set source power |

## Agilent E4402B — Spectrum Analyzer (ESA-E Series)

**Bus:** GPIB
**Purpose:** Measure signal power spectrum. Used for frequency domain analysis.

**Key commands:**

| Command | Purpose |
|---------|---------|
| `:FREQ:CENT {f}` | Set center frequency |
| `:FREQ:SPAN {f}` | Set frequency span |
| `:FREQ:STAR {f}` | Set start frequency |
| `:FREQ:STOP {f}` | Set stop frequency |
| `:BAND:RES {bw}` | Set resolution bandwidth |
| `:BAND:VID {bw}` | Set video bandwidth |
| `:SWE:TIME {t}` | Set sweep time |
| `:DISP:WIND:TRAC:Y:RLEV {dBm}` | Set reference level |
| `:POW:ATT {dB}` | Set input attenuation |
| `:TRACE:DATA? TRACE1` | Read trace data |
| `:CALC:MARK:MAX` | Move marker to peak |
| `:CALC:MARK:X?` | Query marker frequency |
| `:CALC:MARK:Y?` | Query marker amplitude |
| `:INIT:CONT {ON|OFF}` | Continuous/single sweep |

## Lakeshore 340 — Temperature Controller

**Bus:** GPIB / RS-232
**Purpose:** Monitor and control cryogenic temperatures. Common in physics/materials science labs.

**Key commands:**

| Command | Purpose | Response |
|---------|---------|----------|
| `KRDG? {input}` | Query temperature in Kelvin (input: A or B) | Temperature in K |
| `SRDG? {input}` | Query sensor reading in sensor units | Sensor value |
| `SETP {loop},{value}` | Set temperature setpoint (loop: 1 or 2) | — |
| `SETP? {loop}` | Query setpoint | Temperature in K |
| `RANGE {loop},{range}` | Set heater range (0=off, 1-5) | — |
| `RANGE? {loop}` | Query heater range | Integer |
| `HTR?` | Query heater output percentage | Percentage |
| `PID {loop},{P},{I},{D}` | Set PID parameters | — |
| `PID? {loop}` | Query PID parameters | P,I,D values |
| `RAMP {loop},{on/off},{rate}` | Configure setpoint ramping | — |
| `RAMP? {loop}` | Query ramp status | on/off, rate, ramping |
| `INTYPE {input},{type},{range},{comp},{units}` | Configure sensor input | — |

## Keithley 2000 — Digital Multimeter (DMM)

**Bus:** GPIB / RS-232
**Purpose:** Precision voltage, current, resistance, temperature measurements.

**Key commands:**

| Command | Purpose |
|---------|---------|
| `:CONF:VOLT:DC {range}` | Configure DC voltage measurement |
| `:CONF:VOLT:AC {range}` | Configure AC voltage measurement |
| `:CONF:RES {range}` | Configure 2-wire resistance |
| `:CONF:FRES {range}` | Configure 4-wire resistance |
| `:CONF:CURR:DC {range}` | Configure DC current |
| `:CONF:TEMP` | Configure temperature measurement |
| `:MEAS:VOLT:DC?` | Measure and return DC voltage |
| `:MEAS:VOLT:AC?` | Measure and return AC voltage |
| `:MEAS:RES?` | Measure and return resistance |
| `:MEAS:CURR:DC?` | Measure and return DC current |
| `:SENS:VOLT:DC:NPLC {n}` | Set integration time in power line cycles |
| `:SENS:VOLT:DC:RANG:AUTO {ON|OFF}` | Auto-range on/off |
| `:INIT` | Initiate measurement |
| `:FETC?` | Fetch last measurement result |
| `:READ?` | Init + fetch in one command |

## Agilent 33220A — Function Generator

**Bus:** GPIB / USB / LAN
**Purpose:** Generate waveforms (sine, square, ramp, pulse, noise, arbitrary).

**Key commands:**

| Command | Purpose |
|---------|---------|
| `FUNC {SIN\|SQU\|RAMP\|PULS\|NOIS\|DC\|USER}` | Set waveform function |
| `FREQ {f}` | Set frequency |
| `VOLT {v}` | Set amplitude (Vpp) |
| `VOLT:OFFS {v}` | Set DC offset |
| `OUTP {ON\|OFF}` | Enable/disable output |
| `OUTP:LOAD {ohms\|INF}` | Set output load impedance |
| `BURS:MODE {TRIG\|GAT}` | Set burst mode |
| `BURS:NCYC {n}` | Set burst count |
| `TRIG:SOUR {IMM\|EXT\|BUS}` | Set trigger source |
| `PHAS {deg}` | Set phase offset |
| `FUNC:SQU:DCYC {pct}` | Set square wave duty cycle |
| `APPL:SIN {freq},{amp},{offset}` | Apply sine (shortcut) |
