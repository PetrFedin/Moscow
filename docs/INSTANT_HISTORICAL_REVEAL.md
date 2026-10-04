# Instant Historical Reveal v1

Issue: #126.

Canonical source: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` → Premium innovation wave → Instant Historical Reveal.

## Purpose

Compose the already-separated truth authorities instead of allowing camera confidence to open historical content directly:

`On-device Visual Recognition -> Visual + Sensor Fusion -> Temporal Scene Authority -> evidence-bound reveal`.

Instant Reveal does not perform recognition, sensor fusion or historical research. It consumes their bounded decisions.

## Required upstream context

### Visual + Sensor Fusion

Reveal accepts only `VisualSensorFusionDecision`.

A historical reveal may proceed only when:

- `status=confirmed`;
- canonical site ID exists;
- exact verified-active package ID exists;
- reference-set/reference IDs exist;
- visual confidence is present;
- confirmation mode is `automatic` or `user-assisted`.

The upstream Fusion authority already prevents confirmation when:

- visual recognition is blocked/not sure;
- package is missing, unverified or mismatched;
- location is incompatible;
- heading is incompatible;
- Sensor Quality is insufficient.

Reveal cannot bypass those decisions.

### Temporal Scene Authority

Reveal also consumes:

- Temporal Scene records;
- the Temporal Scene registry validation result.

If the registry is invalid, reveal fails closed.

Only `production-candidate` temporal scenes for the exact fused site are eligible. `draft` and `superseded` scenes are excluded.

## Decision states

- `ready` — fused place/package context is confirmed and one explicit production temporal scene is safe to present;
- `needs-user-confirmation` — Sensor Fusion still requires explicit user confirmation;
- `needs-period-selection` — more than one production temporal state exists and no period was selected;
- `fallback-manual-selection` — upstream fusion is not sure;
- `blocked-fusion-context` — upstream hard blocker or malformed confirmed context;
- `blocked-temporal-authority` — temporal registry is invalid;
- `blocked-site-mismatch` — requested temporal scene belongs to another place;
- `blocked-scene-unavailable` — requested period is not production-eligible;
- `blocked-scene-selection-conflict` — explicit scene ID and Time Machine index resolve to different states.

## Automatic vs user-assisted context

A successful reveal preserves how place context was established:

- `sensor-fusion-automatic`;
- `sensor-fusion-user-assisted`.

A user-assisted fusion result is not silently relabelled automatic.

The payload also preserves bounded disclosure:

- sensor state;
- location compatibility class;
- heading compatibility class;
- visual confidence;
- reference-set/reference IDs.

No raw coordinates, raw heading or frame data enters the reveal contract.

## Period selection

The composition layer never guesses a preferred historical epoch.

If exactly one production temporal scene exists for the fused site, it may reveal directly.

If multiple production scenes exist, caller must provide either:

- an explicit Temporal Scene ID; or
- a Time Machine index already owned by Temporal Authority.

If both are supplied, they must resolve to the same scene.

## Reveal payload

A successful payload contains only authority-derived data.

### Canonical context

- site ID;
- active package ID;
- automatic vs user-assisted fusion provenance;
- bounded recognition/sensor disclosure.

### Temporal disclosure

- scene ID/version;
- RU/EN period labels;
- exact Temporal Extent object;
- confidence;
- reconstruction status;
- interpretation mode.

### Evidence

- source IDs;
- claim IDs;
- evidence-element IDs.

### Assets

Grouped bindings copied from Temporal Authority:

- archive/IIIF overlays;
- 3D reconstruction assets;
- optional audio;
- other bound assets.

Missing assets are not fabricated. Audio remains optional.

## Privacy boundary

This layer stores no:

- camera frame;
- face/person identity;
- biometric data;
- latitude/longitude;
- raw heading;
- precise route history;
- background tracking data.

It operates only on bounded decisions and authority metadata produced elsewhere.

## Current Moscow state

The composition contract exists before a real camera experience is activated.

No Romanov or Old English Court camera reveal is promoted by this phase because those sites still lack the complete real chain:

`physical field PASS -> released visual reference set -> measured recognition quality -> real local inference -> confirmed sensor fusion`.

Current user fallback remains map/manual place selection plus the existing Time Machine experience.

## Repository authority

- composition contract: `src/spatial/instantHistoricalReveal.ts`;
- contract tests: `tests/instantHistoricalReveal.test.ts`;
- fusion upstream: `src/spatial/visualSensorFusion.ts`;
- temporal upstream: `src/spatial/temporalSceneAuthority.ts`;
- runbook: this file.

## Next implementation step

Only after a real site reaches the complete upstream chain, connect native camera inference to the already-defined authority sequence.

The first live UI should be:

`camera candidate -> fusion confirmation/fallback -> period selection when required -> reveal -> evidence panel -> optional audio`.

If any upstream layer is uncertain or blocked, route back to manual place selection rather than forcing a match.
