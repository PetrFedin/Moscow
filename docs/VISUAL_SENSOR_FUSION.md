# Visual + Sensor Fusion v1

Issue: #123.

Canonical source: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` → Premium innovation wave → Visual + Sensor Fusion.

## Purpose

Visual recognition is not enough to establish where the visitor is.

This authority combines:

- admitted on-device visual candidate;
- current Sensor Quality Gate result;
- bounded candidate-vs-location compatibility;
- bounded candidate-vs-heading compatibility;
- exact active verified destination package;
- optional explicit user confirmation.

Flow:

`visual candidate + bounded sensor context + verified package -> confirmed / needs-user-confirmation / not-sure / blocked`.

## Privacy boundary

This layer does not accept:

- latitude/longitude;
- raw heading;
- camera frames;
- route history;
- biometric identity.

It consumes only bounded classes:

- sensor state;
- location compatibility;
- heading compatibility;
- canonical IDs.

## Automatic confirmation

Automatic fusion requires all conditions:

1. visual status = `strong-candidate`;
2. Sensor Quality = `precise`;
3. location compatibility = `compatible`;
4. heading compatibility = `compatible`;
5. active package state = `verified-active`;
6. active package ID exactly matches candidate package ID.

Only then output becomes:

`confirmed + confirmationMode=automatic`.

## User-assisted confirmation

User confirmation may resolve:

- an ambiguous visual candidate;
- a degraded but non-insufficient sensor state;
- unknown location/heading compatibility where there is no incompatibility.

It cannot override:

- visual `blocked`;
- visual `not-sure`;
- Sensor Quality `insufficient`;
- incompatible location;
- incompatible heading;
- missing/unverified package;
- package mismatch.

This keeps user assistance useful without turning it into a bypass.

## Outcomes

### confirmed

Candidate place/package context passed automatic fusion or explicit bounded user assistance.

This is still **not Instant Historical Reveal authority**.

### needs-user-confirmation

The candidate is plausible but automatic evidence is incomplete/degraded.

### not-sure

Visual layer itself cannot establish a usable candidate.

### blocked

A hard safety/truth boundary failed.

## Relationship to Sensor Quality Gate

`sensorQualityGate.ts` remains responsible for:

- AR/runtime availability;
- tracking quality;
- package/model readiness;
- orientation availability;
- location permission/uncertainty class;
- heading calibration class.

Visual + Sensor Fusion does not duplicate those rules. It consumes the resulting state and adds candidate-specific compatibility.

## Relationship to Instant Historical Reveal

A fused `confirmed` result establishes only:

> this visual candidate is consistent with the current bounded device/package context.

Historical Reveal still requires:

- Temporal Scene Authority;
- source/evidence bindings;
- appropriate reconstruction/confidence presentation;
- reveal-specific release rules.

## Current Moscow state

No current Romanov or Old English Court camera flow is promoted by this phase.

Without:

- real field PASS;
- released visual reference set;
- measured recognition-quality PASS;
- real local inference observation;

the fusion authority has no production candidate to confirm.

## Repository authority

- fusion contract: `src/spatial/visualSensorFusion.ts`;
- tests: `tests/visualSensorFusion.test.ts`;
- sensor gate: `src/spatial/sensorQualityGate.ts`;
- visual layer: `src/spatial/onDeviceVisualRecognition.ts`;
- this runbook: `docs/VISUAL_SENSOR_FUSION.md`.

## Next step

Only after this layer is merged and Temporal Scene Authority is available:

`confirmed fused site -> temporal scene selection -> evidence-bound Instant Historical Reveal gate`.

The reveal gate must remain closed for any site without real field/reference/recognition evidence.
