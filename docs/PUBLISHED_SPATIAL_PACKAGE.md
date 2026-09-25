# PublishedSpatialPackage v1

## Purpose

`PublishedSpatialPackage` is the machine-readable heritage passport for one spatial historical object.

It is not only a 3D manifest. It binds the chain:

`source → historical claim → evidence element → exact model artifact → metric/control-point authority → field proof → release state`

The package is intended to be portable across mobile 3D, AR, VR, museum, web and future archival/API surfaces without losing provenance or release authority.

## Two independent gates

The validator deliberately separates:

1. **structural validity** — whether the package is internally coherent and traceable;
2. **publication readiness** — whether external publication dependencies such as unresolved rights are cleared.

A production candidate may therefore be structurally valid while still not publishable.

For Romanov Chambers today this is expected:

- the package is structurally traceable;
- field release evidence is not yet supplied;
- one source remains `review-required`;
- Romanov human audio masters remain `recording-pending`.

Those facts are explicit rather than hidden.

## Evidence graph

### Sources

Every source has a stable ID, HTTPS reference, access date and rights state.

### Claims

Every non-draft package must contain historical claims. A claim must reference:

- one or more source IDs;
- one or more evidence-element IDs;
- an explicit trust class.

### Evidence elements

Elements are the publishable reconstruction concepts such as:

- masonry core;
- pre-restoration facade;
- Richter window treatment;
- timber terem;
- porch / ceremonial stair.

Every element must:

- belong to one or more eras;
- carry its evidence class;
- reference its source set;
- be covered by at least one claim.

### Models

A model may only declare an evidence element when its source binding covers the sources required by that element.

Each GLB is bound to the exact repository object through:

- repository path;
- Git blob SHA;
- portable SHA-256 of the binary bytes;
- byte size.

Git blob SHA is the repository-object identity; SHA-256 is the portable integrity identity that can be checked after the package leaves GitHub. The contract tests read every bundled Romanov GLB and recompute SHA-256, so metadata drift cannot pass CI.

A filename alone is not model authority.

## Metric and control-point authority

A non-draft package carries explicit bindings to:

- model-pack version;
- metric-authority ID/version;
- metric model-pack binding;
- model units;
- metric scale status;
- control-point-set ID/version;
- required control-point count;
- required alignment-point count.

For Romanov these bindings come directly from the existing metric and facade-control-point authorities.

## Field release

`field-verified` is not a manually selectable presentation label.

For Romanov, promotion is performed only by:

`buildRomanovPublishedPackageFromEvidence(...)`

The builder receives the actual:

- survey packet;
- field sessions;
- calibration;
- persistent-anchor records.

It delegates truth to the existing Romanov release gate.

A field-verified package must then carry:

- survey packet ID;
- at least the required field-session evidence;
- calibration version and its exact metric/model-pack binding;
- verified persistent-anchor proof ID(s);
- field-verification timestamp derived only from evidence bound to that calibration;
- empty release blockers;
- explicit publication timestamp.

Boolean flags alone are insufficient.

## Current Romanov requirements

The Romanov package keeps the current P0 release contract:

- five facade control points;
- 5 / 10 / 15 m field distances;
- at least two complete iOS devices;
- at least two complete Android devices;
- at least twelve complete device-distance sessions;
- verified calibration placement;
- metric-authoritative scale;
- persistent-anchor host continuity;
- internally consistent anchor evidence;
- independent resolve on another physical device.

Until those evidence packages exist, the Romanov package remains `production-candidate`.

## Audio authority

The package also exposes the Romanov RU/EN route-audio authority.

Current state:

- 2 expected Romanov tracks;
- human recording masters pending;
- TTS remains fallback;
- audio is not currently a blocker for the spatial release state.

If a future deployment makes human audio mandatory, `requiredForPublication` can be promoted to `true`; the generic package validator will then fail closed until all declared tracks are production-ready.

## Rights

Rights are independent from geometry/field proof.

A source marked `review-required` prevents the package from becoming externally publishable even if all field-verification gates pass.

This is deliberate: successful AR calibration must never be interpreted as rights clearance.

## Serialization

`serializePublishedSpatialPackage` exports only structurally valid packages.

`parsePublishedSpatialPackage` revalidates imports and rejects tampered packages instead of normalizing them into valid state.

`assertPublishedSpatialPackageCanPublish` additionally enforces publication-readiness blockers.

## Next evolution

The next package version should be driven by real field evidence, not schema expansion for its own sake.

The useful next steps are:

1. ingest the approved Romanov survey packet;
2. ingest the 12+ real field sessions;
3. ingest the verified persistent-anchor proof;
4. close the Naidenov rights review;
5. attach production audio masters when recorded;
6. emit the first genuinely field-verified Romanov package;
7. apply the same package pipeline to Old English Court.

The key success criterion is repeatability: Old English Court must be able to satisfy the same package contract without borrowing Romanov assets or evidence.
