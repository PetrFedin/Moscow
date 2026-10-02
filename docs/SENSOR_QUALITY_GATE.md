# Sensor Quality Gate

Canonical source: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` → Additional wave — anchor calibration, temporal scenes and accessibility routing.

Issue: #94.

## Purpose

The Sensor Quality Gate prevents Moscow from presenting an AR placement as precise when the device/runtime cannot support that claim.

It is a **runtime safety gate**, not field evidence and not a substitute for MOSCOW-INT-00.

## States

### precise

All mandatory runtime inputs are ready and location/heading uncertainty is within the current pilot threshold.

The internal state name is `precise`, but user-facing UI must display **SENSOR READY**, not "physically precise". The runtime may attempt an anchored workflow while field verification remains a separate release authority.

### degraded

The AR runtime and model are usable, but one or more quality inputs are weak or unknown.

The runtime may continue with guided/manual alignment, but must not claim precise sensor placement.

### insufficient

A hard prerequisite is unavailable, for example:

- AR runtime/tracking not ready;
- model not loaded;
- current scene/model package missing/unverified.

In Phase 0 this means the current embedded Romanov scene/model bundle required for the field workflow. It does **not** mean Destination Package v2 has been published or signed; that remains locked behind MOSCOW-INT-00.

Anchor placement is blocked and the user should remain in a non-precise story/3D fallback.

## Current pilot thresholds

- precise location uncertainty: <= 20 m;
- compass calibration level: >= 2;
- AR tracking: normal;
- model/package: ready.

These are product guardrails for the pilot, not proof of physical placement accuracy.

## Privacy boundary

Sensor refresh may read the current location and compass reading in memory, but only these bounded quality fields are retained in React state:

- location permission class;
- location uncertainty radius;
- compass calibration level.

Do not persist or emit:

- latitude/longitude;
- raw magnetic/true heading;
- route history;
- camera frames.

## Evidence boundary

The gate answers: "is the runtime allowed to attempt a precise or manual spatial experience?"

It does **not** answer:

- whether the model is physically aligned within tolerance;
- whether the Romanov field campaign passed;
- whether Old English Court repeatability passed;
- whether provider proof passed.

Those remain under their existing evidence authorities.
