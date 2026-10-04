# On-device Visual Recognition v1

Issue: #121.

Canonical source: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` → Premium innovation wave → On-device Visual Recognition.

## Purpose

This layer converts a **local** camera inference result into a validated landmark candidate without pretending that visual similarity alone proves place/context.

Flow:

`ephemeral frame -> on-device inference -> reference candidate -> release/model validation -> strong-candidate / confirm / not-sure / blocked`.

It sits after Visual Landmark Reference Set and before Visual + Sensor Fusion.

## Privacy contract

Every accepted observation must declare:

- `processing=on-device`;
- `framePersisted=false`;
- `frameUploaded=false`;
- `faceRecognitionUsed=false`.

The authority stores only bounded derived inference metadata:

- inference observation ID/time;
- engine/model/model version;
- descriptor version;
- inference latency;
- reference IDs;
- confidence scores.

It does not accept or retain:

- camera bytes;
- faces/biometric identity;
- latitude/longitude;
- raw heading;
- visitor route history.

## Reference admission

A candidate reference may participate only when its complete Visual Landmark Reference Set already passes:

1. external field-verified site admission;
2. Recognition Quality Gate for the same site;
3. exact reference lookup.

A visually strong candidate from an unreleased set is blocked.

## Descriptor compatibility

Local inference must bind to the exact approved reference descriptor contract:

- engine;
- model ID;
- model version;
- descriptor version.

Any mismatch fails closed. This prevents stale local models from being silently compared with a newer reference-set version.

## Candidate outcomes

### strong-candidate

Requires:

- released reference set;
- exact descriptor contract;
- top confidence at/above strict threshold;
- sufficient margin from second candidate.

The result resolves canonical:

- site ID;
- package ID;
- reference-set ID;
- reference ID.

It **does not** authorize Instant Historical Reveal.

### needs-user-confirmation

Used for review-band or ambiguous candidates.

### not-sure

Used when:

- local inference returns no candidates;
- top confidence stays below review threshold.

### blocked

Used for:

- privacy-contract violation;
- unknown reference;
- unreleased reference set;
- descriptor/model mismatch;
- invalid observation/threshold configuration.

## Default candidate thresholds

Phase 1 keeps the same repository defaults as the current landmark candidate gate:

- review confidence: 0.70;
- strict confidence: 0.88;
- minimum margin: 0.08.

These are pilot configuration values, not external standards.

## Relationship to Sensor Fusion

This authority deliberately does **not** consume:

- coarse GPS;
- heading;
- orientation;
- AR tracking state.

Those belong to the next Master Plan layer: Visual + Sensor Fusion.

A `strong-candidate` therefore means:

> the released local visual reference appears to match strongly under the admitted model contract.

It does **not** mean:

> the visitor is physically at this site.

## Current Moscow state

No real Romanov or Old English Court local recognition is activated by this implementation.

Both still require their independent field evidence gates and a real measured visual reference/recognition dataset before a production candidate may exist.

## Repository authority

- local admission/candidate logic: `src/spatial/onDeviceVisualRecognition.ts`;
- tests: `tests/onDeviceVisualRecognition.test.ts`;
- Visual Landmark authority: `src/spatial/visualLandmarkReference.ts`;
- this runbook: `docs/ON_DEVICE_VISUAL_RECOGNITION.md`.

## Next step

After a real field-proven landmark reference set exists:

1. choose/benchmark a native local matcher (MediaPipe/OpenCV/custom);
2. bind its exact model/descriptor version to the approved reference set;
3. emit only the bounded observation contract above;
4. collect real recognition-quality evidence;
5. pass the strong/confirm/not-sure candidate into Visual + Sensor Fusion;
6. only then evaluate Instant Historical Reveal.
