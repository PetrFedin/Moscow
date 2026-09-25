# Old English Court — spatial package intake v1

## Why this stage exists

Old English Court is the repeatability test for the Moscow spatial pipeline.

Romanov Chambers already has a model pack, metric authority, control-point set and field-release machinery. Old English Court does not yet have those assets. Creating placeholder model, metric or survey identifiers only to satisfy `PublishedSpatialPackage` would destroy the evidence model.

The second object therefore starts one stage earlier:

`SpatialPackageIntake → accepted model/rights → object-specific metric authority → object-specific control points → PublishedSpatialPackage production candidate → survey/field/anchor proof → field-verified package`

## What is authoritative now

The intake is built from existing project authorities and content.

### Historical source ledger

- Park Zaryadye — Old English Court;
- Museum of Moscow — Old English Court history;
- Museum of Moscow — restoration and museum exhibition.

These URLs are used as factual provenance references. They are marked `reference-only`; this does **not** claim media-reuse rights.

### Historical layers

The intake reuses the same bilingual period records already shown in the tourist experience:

1. 1556 — English trading court — documented;
2. 1960s — monument rediscovered / scholarly restoration — reconstructed;
3. 1994 — museum opens — documented.

The package-intake layer does not maintain a second narrative copy.

### Audio

The RU and EN walk scripts already exist.

Both remain `recording-pending`; no human master is claimed.

Human audio is currently an experience-quality dependency, not a spatial-package promotion gate.

## Promotion blockers

A valid intake is not the same as a promotable spatial package.

Current mandatory blockers are:

- production GLB missing;
- model-rights evidence missing;
- Old English Court metric authority missing;
- Old English Court facade control-point authority missing.

A model candidate can clear only the first two blockers after it passes the existing Old English Court model-intake checks:

- stable identity/version/path;
- explicit rights evidence;
- metric units;
- verified scale;
- SHA-256;
- complete Old English Court provenance.

Passing model intake still does **not** open 3D/AR runtime and still does **not** create metric/control-point truth.

## Field-release blockers

After package promotion, field release will still require:

- approved survey evidence;
- cross-device field matrix;
- persistent-anchor proof.

Those requirements are visible now so the second object follows the same evidence discipline as Romanov.

## Tourist-experience blockers

The experience layer separately tracks:

- archive visual asset — missing;
- human audio — recording pending.

These do not get confused with metric/spatial authority.

## Isolation from Romanov

Old English Court must not borrow:

- Romanov model files;
- Romanov source IDs;
- Romanov metric authority;
- Romanov facade control-point set;
- Romanov survey/field sessions;
- Romanov persistent anchors.

Contract tests enforce source/authority isolation and verify that a candidate carrying Romanov provenance fails Old English Court model intake.

## Runtime state

The current application remains fail-closed:

- Time Machine: available;
- archive lens: needs asset;
- 3D: needs asset;
- spatial AR: needs asset;
- runtime: none.

Even a test model that passes asset intake does not automatically make the runtime available.

## Next real evidence

The next valuable work is not another schema layer. It is to obtain or create the first real Old English Court production asset with:

1. a defined reconstruction brief and era scope;
2. rights evidence for every reusable input;
3. a real GLB;
4. SHA-256 and versioned asset identity;
5. metric scale evidence;
6. then an object-specific metric authority and facade-control-point set.

Only after that should Old English Court become a `PublishedSpatialPackage` production candidate.
