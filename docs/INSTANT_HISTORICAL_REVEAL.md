# Instant Historical Reveal v1

Issue: #126.

Canonical source: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` → Premium innovation wave → Instant Historical Reveal.

## Purpose

Compose two existing authorities instead of inventing a third truth system:

`Visual Landmark Authority -> Temporal Scene Authority -> evidence-bound reveal`.

The reveal layer does not perform recognition itself and does not own historical truth.

## Required upstream authorities

### Visual

The reveal consumes an already-derived `VisualLandmarkDecision`.

A visual candidate can proceed only when the separate recognition release gate is `releasable=true`.

That release gate already requires:

- external field-verified site admission;
- measured recognition quality evidence;
- site/evidence consistency.

A high model confidence alone is never enough.

Recognition release results are site-bound. Instant Reveal rejects a green release result when its canonical `siteId` differs from the visual candidate site.

### Temporal

The reveal consumes:

- Temporal Scene records;
- the Temporal Scene registry validation result.

If the registry is invalid, reveal fails closed.

Only `production-candidate` temporal scenes are eligible. `draft` and `superseded` scenes are excluded.

## Decision states

- `ready` — visual context and one explicit temporal scene are safe to reveal;
- `needs-user-confirmation` — review-band visual candidate needs explicit same-site confirmation;
- `needs-period-selection` — more than one production temporal state exists and no period was selected;
- `fallback-manual-selection` — visual recognition is not sure;
- `blocked-unverified-site` — physical/site admission is absent;
- `blocked-recognition-quality` — recognition release gate is not green;
- `blocked-temporal-authority` — temporal registry is invalid;
- `blocked-site-mismatch` — visual and temporal context point to different places;
- `blocked-scene-unavailable` — requested period is not production-eligible;
- `blocked-scene-selection-conflict` — explicit scene ID and Time Machine index resolve to different states.

## Ambiguous recognition

`needs-user-confirmation` may become revealable only when:

1. recognition release is already green;
2. user confirms the exact same site ID returned by the candidate.

User confirmation cannot override:

- unverified field state;
- failed recognition quality;
- temporal validation failure.

## Period selection

The composition layer does not guess a preferred epoch.

If exactly one production temporal scene exists, it may reveal directly.

If multiple production scenes exist, caller must provide either:

- an explicit Temporal Scene ID; or
- a Time Machine index already owned by Temporal Authority.

If both are supplied, they must resolve to the same scene.

## Reveal payload

A successful payload contains only authority-derived data:

### Visual context

- canonical site ID;
- strict-match vs user-confirmed context;
- optional reference ID;
- optional recognition confidence.

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

No missing asset is fabricated. Audio is optional.

## Privacy boundary

This layer stores no:

- camera frame;
- face/person identity;
- biometric data;
- precise route history;
- background tracking data.

It operates only on bounded decisions and authority metadata produced elsewhere.

## Current Moscow state

The composition contract exists before a real camera experience is activated.

That is intentional.

No Romanov or Old English Court visual reveal is promoted by this phase because the repository still does not contain a genuinely released, field-proven visual reference dataset for those sites.

Current fallback remains the existing map/manual place selection and Time Machine experience.

## Repository authority

- composition contract: `src/spatial/instantHistoricalReveal.ts`;
- contract tests: `tests/instantHistoricalReveal.test.ts`;
- visual upstream: `src/spatial/visualLandmarkReference.ts`;
- temporal upstream: `src/spatial/temporalSceneAuthority.ts`;
- runbook: this file.

## Next implementation step

After a real site reaches:

`field proof -> visual reference-set release -> recognition quality PASS`

connect the native camera matcher to this authority.

The first live UI should expose:

`facade recognised -> site confirmation when required -> period selection when required -> reveal -> evidence panel -> optional audio`.

If recognition is uncertain, immediately route to manual place selection rather than forcing a match.
