# Visual Landmark Reference Set v1

Issue: #114.

Canonical source: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` → Premium innovation wave.

## Goal

Prepare the first safe, testable layer for:

`camera -> landmark candidate -> geographic/sensor check -> historical reveal`

without pretending that camera confidence is physical truth.

## Sequencing

The implementation order is fixed:

`field-proven package -> visual reference set -> on-device matcher -> sensor fusion -> historical reveal`.

Phase 1 implements only the first executable authority after field proof.

No real Romanov or Old English Court visual reference set is published in this phase.

## Reference-set contract

Each set belongs to one canonical public site and package and stores approved references with:

- viewpoint ID;
- source image reference and version;
- capture date;
- rights reference;
- optional heading/tolerance;
- descriptor engine;
- model/version;
- descriptor version;
- optional SHA-256 descriptor checksum.

The contract intentionally does not contain a self-asserted `fieldVerified=true` flag.

Admission receives field-verified site IDs from the independent field authority.

## Candidate decision

Runtime candidate input contains only derived recognition metadata:

- reference-set/reference ID;
- site ID;
- confidence;
- geographic compatibility;
- heading compatibility.

Decision outcomes:

- `matched`;
- `needs-user-confirmation`;
- `not-sure`;
- `blocked-unverified-site`.

Rules:

1. candidate site must be externally field-verified;
2. geographically impossible candidates are rejected;
3. heading-incompatible candidates are rejected;
4. low-confidence candidates become `not-sure`;
5. ambiguous candidates require user confirmation;
6. only a strict-confidence candidate with sufficient margin may produce `matched`.

A visual match still does not itself satisfy Romanov/OEC field proof.

## Recognition quality evidence

Per-site measured evidence includes:

- sample count;
- true-match rate;
- false-positive rate;
- unknown/failure rate;
- viewpoint coverage;
- lighting coverage;
- tested device-class count;
- p95 inference latency;
- evidence reference;
- build ID;
- measurement timestamp.

The current Phase 1 thresholds are repository pilot defaults, not external standards:

- at least 50 samples;
- true-match rate >= 0.90;
- false-positive rate <= 0.02;
- unknown rate <= 0.15;
- viewpoint coverage >= 0.70;
- lighting coverage >= 0.60;
- at least 2 device classes;
- p95 latency <= 1200 ms.

Thresholds are configurable for future pilots, but evidence remains mandatory.

## Release gate

A reference set is releasable only when both are true:

- the canonical site is admitted by external field verification;
- the measured recognition quality gate passes for the same site.

Missing evidence fails closed.

## Privacy boundary

Phase 1 stores no camera frames.

Future camera implementation must preserve:

- no face recognition;
- no identity inference for passers-by;
- no biometric profile;
- no continuous camera upload by default;
- no background person tracking;
- ephemeral frames unless the user explicitly saves/captures.

Recognition telemetry should prefer bounded derived metrics over raw imagery.

## Fallback

If visual recognition is unavailable, unsupported, ambiguous or below quality threshold:

`map/manual place selection -> existing destination package -> historical experience`.

The premium feature must never make the core guide unusable.

## Repository authority

- contract + decision + quality gate: `src/spatial/visualLandmarkReference.ts`;
- tests: `tests/visualLandmarkReference.test.ts`;
- runbook: this file.

## Next step

Only after a real site/package has field PASS:

1. create the first approved reference set;
2. capture multiple verified viewpoints/light conditions;
3. benchmark an on-device matcher;
4. collect measured quality evidence;
5. connect coarse location/heading as sensor fusion;
6. expose historical reveal only after a safe match/confirmation decision.
