# Field Day Pack — Romanov + Old English Court

## Goal

Produce physical evidence sufficient for the existing spatial authorities. This pack does not weaken any code gate.

## Romanov minimum matrix

Current code authority requires:

- **2 independent iOS devices**;
- **2 independent Android devices**;
- distance buckets: **5 m / 10 m / 15 m**;
- **5 measured control points per session**;
- minimum complete matrix: **12 sessions**;
- mean residual target: **≤ 35 cm**;
- max residual target: **≤ 60 cm**.

Also required:

- one approved/current survey packet;
- one exact current calibration placement per device bundle;
- current metric authority;
- field conditions recorded;
- daylight or overcast-daylight evidence;
- independent persistent-anchor resolve on another physical device;
- restart/recovery evidence.

## Before leaving for site

- freeze app build and record build identifier;
- record device model / OS / platform label;
- charge devices + power banks;
- confirm current survey packet;
- confirm current calibration/metric authority;
- prepare evidence folders;
- confirm site permission/access;
- assign field lead and reviewer;
- do not pre-create PASS JSON.

## Evidence naming

Recommended:

`evidence/romanov/<date>/<device-label>/<distance>m/<session-id>/`

For OEC:

`evidence/old-english-court/<date>/<device-label>/<session-id>/`

Every artifact should be attributable to:
site, object, device, build, timestamp, authority version and reviewer.

## Romanov fail conditions

Fail closed on:

- stale/missing survey or metric authority;
- missing measured control point;
- wrong distance bucket;
- incomplete field conditions;
- residual threshold failure;
- insufficient iOS/Android coverage;
- missing independent anchor resolve;
- missing restart/recovery proof.

Do not “average away” a failed required session.

## Old English Court

OEC must prove repeatability **without Romanov evidence reuse**.

Required independent refs:

- model evidence;
- metric authority;
- control-point authority;
- survey evidence;
- field matrix;
- persistent-anchor evidence.

A second object that depends on Romanov-specific exceptions does not prove generic repeatability.

## After field day

Romanov:
`npm run validate:romanov-p0-evidence -- <manifest.json> <output.json>`

Phase 0 bundle:
`npm run integration:validate-phase0 -- <phase0-evidence-manifest.json>`

Only validators/reviewers may determine PASS.
