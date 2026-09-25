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

### 1. One self-contained GLB 2.0 file

Naming convention:

`old-english-court-<scope>-v<version>.glb`

The first accepted file must be a static heritage scene.

External buffers and external image files are not allowed.

### 2. Generated binary report

Run:

`npm run report:glb -- <path-to-file.glb> > binary-report.json`

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

Provide one versioned provenance document/reference.

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

Provide an explicit rights/reuse evidence reference for the delivered model and every reusable third-party asset embedded in it.

Factual citation of a museum webpage is not the same as a license to copy an image, scan, texture or 3D mesh.

The model cannot pass intake with `unknown` or merely `restricted` rights status.

### 5. Metric-scale evidence

The GLB must use meters.

Provide an inspectable metric-scale evidence reference showing why the delivered scale is accepted as verified.

Suitable evidence can include a survey/measurement packet or another approved measured source. A statement from the artist that “the model is approximately to scale” is not sufficient.

This evidence becomes an input to the later Old English Court metric authority; it is not itself the final field-release authority.

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
- `binary-report.json` generated by the repository CLI;
- provenance evidence reference/document;
- rights evidence reference/document;
- metric-scale evidence reference/document;
- model version and scope;
- list of intentionally unresolved/hypothesis geometry.

A submission is not accepted by screenshots, renders or a video demo alone.
