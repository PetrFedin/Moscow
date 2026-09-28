# Old English Court — production GLB acquisition brief

## Goal

The next real deliverable for Old English Court is not “a beautiful 3D model”.

It is a **versioned, rights-cleared, mobile-ready GLB with inspectable provenance and metric-scale evidence** that can pass the existing Old English Court model intake and then become the basis for object-specific metric/control-point authority.

No 3D/AR runtime should be enabled before this gate passes.

## Important evidence rule

A documented historical event is not automatically documented geometry.

For example, the project has source-backed historical authority for the English trading court in 1556. That does not by itself prove every facade opening, roof form, stair, material or dimension for a 1556 reconstruction.

The contractor must label every reconstructed geometry decision according to the evidence actually supplied.

Unsupported visual completion must never be presented as documented fact.

## Required delivery

### 0. One self-contained submission bundle

The contractor delivers one directory. Submission v2 does not accept evidence by arbitrary repository or filesystem paths.

Recommended structure:

```text
old-english-court-current-restored-v1/
├── submission.json
├── old-english-court-current-restored-v1.glb
├── binary-report.json
├── provenance.json
├── rights.json
└── metric-scale.json
```

All paths in `submission.json` are relative to this directory. Absolute paths and `../` traversal are rejected.

Validation command:

```bash
npm run validate:oec-model-submission -- ./old-english-court-current-restored-v1/submission.json
```

A successful command verifies the actual GLB bytes, binary report, checksum and structured evidence identity. It does **not** create metric/control-point/field authority automatically.

### 1. One self-contained GLB 2.0 file

Naming convention:

`old-english-court-<scope>-v<version>.glb`

The first accepted file must be a static heritage scene.

External buffers and external image files are not allowed.

### 2. Generated binary report

Run from the repository root:

`npm run report:glb -- <path-to-file.glb> > <path-to-binary-report.json>`

The reporter reads the actual bytes and produces:

- filename;
- SHA-256;
- byte size;
- GLB version;
- declared-length integrity;
- node / mesh / primitive counts;
- triangle count;
- materials / textures / images;
- animation / skin counts;
- external buffer / image counts.

Do not hand-edit the generated report.

The model intake cross-checks report filename and SHA-256 against the candidate declaration.

### 3. Provenance evidence

Provide `provenance.json`, bound to the exact `modelId`, `modelVersion` and GLB SHA-256.

Minimum content:

- model version;
- scope of the model;
- every source ID used;
- which geometry decisions each source supports;
- which parts are direct evidence;
- which parts are restoration-based reconstruction;
- which parts remain hypothesis;
- what was deliberately excluded because evidence was insufficient.

The project source IDs currently available are:

- `zaryadye-old-english-court`;
- `museum-of-moscow-history`;
- `museum-of-moscow-restoration`.

Passing intake requires complete Old English Court provenance. Romanov source IDs are not accepted as substitutes.

### 4. Rights evidence

Provide `rights.json`, bound to the exact `modelId`, `modelVersion` and GLB SHA-256.

It must state the rights basis for the model, the rights holder, explicit permission for publication use, and every reusable third-party input with its own verified evidence reference.

Factual citation of a museum webpage is not the same as a license to copy an image, scan, texture or 3D mesh.

The model cannot pass intake with `unknown` or merely `restricted` rights status.

### 5. Metric-scale evidence

The GLB must use meters.

Provide `metric-scale.json`, bound to the exact `modelId`, `modelVersion` and GLB SHA-256.

It must contain at least one positive measured reference with:

- label;
- source reference;
- measured real-world meters;
- corresponding model distance in meters.

A statement from the artist that the model is “approximately to scale” is not sufficient.

Suitable evidence can include a survey/measurement packet or another approved measured source. A statement from the artist that “the model is approximately to scale” is not sufficient.

This evidence becomes an input to the later Old English Court metric authority; it is not itself the final field-release authority.

### 6. Versioned submission manifest

Deliver a JSON manifest with:

- `kind = old-english-court-model-submission`;
- `version = 1`;
- candidate id and model version;
- repo-relative `assetPath`;
- repo-relative `binaryReportPath`;
- all three required Old English Court source IDs;
- repo-relative provenance evidence file;
- verified rights status + repo-relative rights evidence file;
- `modelUnits = meters`;
- verified metric-scale status + repo-relative metric-scale evidence file;
- the SHA-256 produced from the real GLB.

Example structure:

```json
{
  "kind": "old-english-court-model-submission",
  "version": 1,
  "id": "old-english-court-current-restored-v1",
  "modelVersion": 1,
  "assetPath": "assets/models/old-english-court-current-restored-v1.glb",
  "binaryReportPath": "assets/models/old-english-court-current-restored-v1.binary-report.json",
  "sourceIds": [
    "zaryadye-old-english-court",
    "museum-of-moscow-history",
    "museum-of-moscow-restoration"
  ],
  "provenanceEvidenceRef": "evidence/oec/provenance-v1.md",
  "rightsStatus": "verified",
  "rightsEvidenceRef": "evidence/oec/rights-v1.md",
  "modelUnits": "meters",
  "metricScaleStatus": "verified",
  "metricScaleEvidenceRef": "evidence/oec/metric-scale-v1.md",
  "checksumSha256": "<64 hex characters from the generated report>"
}
```

The three evidence references must resolve to real files inside the repository at validation time. Do not use the example paths unless those files actually exist and contain the stated evidence.

### 7. Automated acceptance

After all files are placed at their declared repository-relative paths, run:

`npm run validate:oec-model-submission -- <path-to-submission.json>`

The validator:

1. parses the versioned submission manifest;
2. checks the exact Old English Court source ledger;
3. reads the declared GLB bytes;
4. regenerates the binary report from those bytes;
5. compares every generated report field with the supplied report;
6. verifies that provenance, rights and metric-scale evidence files actually exist;
7. validates SHA-256, mobile budgets, GLB integrity and the submission declarations;
8. runs the existing Old English Court model intake.

Exit code `0` + `accepted: true` clears only model asset / model rights intake.

It does **not** create metric authority, control points, survey evidence or field verification.

## Mobile budgets

The shared heritage-mobile ceiling is:

| Metric | Maximum |
|---|---:|
| GLB file size | 5 MiB |
| Nodes | 500 |
| Meshes | 250 |
| Primitives | 500 |
| Triangles | 150,000 |
| Materials | 64 |
| Textures | 32 |
| Images | 32 |
| Animations | 0 |
| Skins | 0 |
| External buffers | 0 |
| External images | 0 |

These are acceptance ceilings, not optimization targets. A materially lighter model is preferable when visual/metric quality is unchanged.

## Coordinate and geometry requirements

- GLB 2.0.
- Model units: meters.
- Static scene.
- Stable documented local origin.
- Stable documented axes/orientation.
- No hidden world-scale correction required to make the object approximately fit.
- No geometry whose only purpose is to disguise an unresolved alignment error.
- Transform/origin conventions must be documented so the later metric authority can bind them explicitly.

Do not silently bake survey corrections into an unversioned mesh after acceptance. Any geometry change produces a new model version, checksum and binary report.

## Texture/material requirements

- All runtime textures must be embedded in the GLB.
- No network texture dependencies.
- Avoid oversized texture resolution that provides no visible mobile benefit.
- Reusable third-party texture/photo inputs require rights evidence.
- Artistic texture completion must not change the evidence class of geometry.

## Historical-state scope

The intake currently contains three historical layers:

1. `1556-documented` — English trading court history;
2. `1960s-restoration-reconstructed` — rediscovery/restoration;
3. `1994-museum-documented` — museum opening.

The model submission must state which layer(s) it represents.

If a historical appearance cannot be supported to the required confidence, submit a narrower metric/current-restored base rather than inventing a complete historic facade.

## Automatic rejection

The asset will be rejected when any of the following applies:

- not a GLB 2.0 file;
- declared GLB length does not match the bytes;
- SHA-256 is absent or differs from the generated binary report;
- report filename differs from the submitted asset path;
- mobile complexity budget is exceeded;
- animations or skins are present in the static scene;
- external buffers/images exist;
- rights evidence is missing;
- metric units/verified-scale evidence is missing;
- required Old English Court provenance is incomplete;
- provenance mapping itself is missing.

An accepted model still does **not** automatically enable 3D/AR.

## What happens after model acceptance

Passing the GLB/model gate only clears:

- model asset;
- model rights.

The next independent authorities remain mandatory:

1. Old English Court metric authority;
2. Old English Court facade control-point set;
3. approved physical survey;
4. cross-device field matrix;
5. persistent-anchor host/independent-resolve proof;
6. then PublishedSpatialPackage promotion;
7. only then spatial runtime/release decisions.

## Contractor handoff checklist

Deliver together:

- `*.glb`;
- `binary-report.json` generated by `npm run report:glb`;
- versioned `submission.json`;
- provenance evidence reference/document;
- rights evidence reference/document;
- metric-scale evidence reference/document;
- model version and scope;
- list of intentionally unresolved/hypothesis geometry.

Before handoff, run `npm run validate:oec-model-submission -- <submission.json>`.

A submission is not accepted by screenshots, renders or a video demo alone.


## Submission v2 manifest

Minimal shape:

```json
{
  "kind": "old-english-court-model-submission",
  "version": 2,
  "id": "old-english-court-current-restored-v1",
  "modelVersion": 1,
  "assetPath": "old-english-court-current-restored-v1.glb",
  "binaryReportPath": "binary-report.json",
  "sourceIds": [
    "zaryadye-old-english-court",
    "museum-of-moscow-history",
    "museum-of-moscow-restoration"
  ],
  "provenanceEvidenceRef": "provenance.json",
  "rightsStatus": "verified",
  "rightsEvidenceRef": "rights.json",
  "modelUnits": "meters",
  "metricScaleStatus": "verified",
  "metricScaleEvidenceRef": "metric-scale.json",
  "checksumSha256": "<actual 64-char SHA-256>"
}
```

### Provenance JSON

Must map every required source to the geometry/history decisions it supports and label each mapping:

- `documented`;
- `reconstructed`;
- `hypothesis`.

It must also explicitly list unresolved geometry. An empty unresolved list is allowed only when that is genuinely the contractor/research conclusion; omission of the field is rejected.

### Rights JSON

Must contain:

- rights basis: owned / commissioned / licensed / public-domain;
- rights holder;
- `publicationUseVerified=true`;
- all third-party embedded inputs and evidence refs.

### Metric-scale JSON

Must contain:

- `modelUnits=meters`;
- `metersPerModelUnit=1`;
- at least one measured reference.

All three evidence files must carry the same model ID, model version and checksum as `submission.json` and the real GLB bytes.

## Meaning of validator output

`accepted: true` means only:

- real GLB bytes passed the binary contract;
- supplied report exactly matches those bytes;
- checksum matches;
- model intake metadata passed;
- structured provenance/rights/metric evidence is internally coherent and version-bound.

It does **not** mean:

- Old English Court metric authority exists;
- facade control points are approved;
- survey exists;
- 5/10/15 field proof exists;
- persistent anchor exists;
- the object is field-verified;
- public AR is enabled.
