# Moscow — Spatial Heritage Integration Master Plan

**Status:** EXECUTING — MOSCOW-INT-00 BLOCKED ON REAL FIELD / USER EVIDENCE  
**Date:** 2026-10-01  
**Canonical file:** `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`

## Purpose
Evolve the Moscow "city as a time machine" product after proving the first Varvarka/Zaryadye objects in the field.

## Mandatory product gate
Do not scale to hundreds of places before proving:
- Romanov Chambers field experience;
- Old English Court second-object repeatability;
- physical spatial accuracy;
- supervised user pilot;
- government/evidence package.

Yandex MapKit remains the primary renderer unless a separate migration decision is made.

## Integration map

| Capability | Source | Decision |
|---|---|---|
| Offline patterns | Organic Maps | REFERENCE/ADAPT |
| Vector packages | Tippecanoe / PMTiles | ADAPT |
| Spatial index | H3 | ADOPT |
| Geometry operations | Turf | ADOPT |
| Historical raster | GeoTIFF.js | ADOPT |
| Coordinate conversion | Proj4js | ADOPT |
| Walking routing | Valhalla | SIDECAR/ADAPT |
| 3D validation | glTF Validator | ADOPT/CI |
| 3D processing | glTF-Transform | ADOPT |
| Compression | Draco / meshoptimizer | ADAPT |
| Historical imagery | IIIF / Mirador | ADAPT |
| City-scale 3D | Cesium | DEFER |

## Phase 0 — Field proof
Complete Romanov anchor/pose/performance/user-orientation evidence and second Old English Court package. No mass ingestion before this gate.

## Phase 1 — Destination Package v2
Version POIs, geometry, narrative, media, 3D assets, anchors, routes, historical sources, localisations, publication state and checksums. Package must be reproducible and offline-capable.

## Phase 2 — H3 + Turf
H3 indexes discovery/coverage/pilot cells. Turf provides distance, bearing, route corridor, point-in-polygon, proximity and geometry validation. Rendering stays Yandex.

## Phase 3 — Historical Map Authority
GeoTIFF.js supports georeferenced archival rasters. Proj4js transforms source CRS to current coordinates.

Every map stores archive/source, date/period, CRS, georeference method, confidence, rights and processing version. Historical alignment uncertainty must be visible.

## Phase 4 — IIIF historical media
Use IIIF/Mirador where archives support it. Link source image/region directly to story/scene evidence and respect rights.

## Phase 5 — Field Verification Mode
Staff/editor capture:
- object/site;
- GPS/heading;
- anchor check;
- evidence;
- measured offset;
- device/build;
- issue;
- pass/fail;
- reviewer.

Field evidence changes a package only after review/publish.

## Phase 6 — 3D admission
Run glTF Validator for every asset. Use glTF-Transform for dedup/texture/metadata/simplification; Draco/meshoptimizer only if device tests prove benefit.

Admission records size, triangles, textures, validation errors, load time and target-device performance.

## Phase 7 — Curated routing
Valhalla proposes pedestrian routes between curated stops. Moscow chooses final thematic sequence; route engine does not own editorial experience.

## Phase 8 — Spatial Trigger Narrative
After anchor quality is proven:
`approach -> context -> reveal -> interaction -> continuation`

Must degrade safely when GPS/compass accuracy is poor.

## Phase 9 — Cesium gate
Only for real multi-district/city-scale 3D tiles use case. Do not add Cesium for two pilot objects.

## External provider boundary
Real booking/event providers require authorised credentials and permitted test companies. Never fabricate provider access, state or receipts.

## Prohibited
- scaling before field proof;
- replacing Yandex without a reason;
- letting routing decide editorial sequence;
- publishing unvalidated 3D;
- presenting approximate historical alignment as exact;
- inventing live provider data;
- bypassing rights/localisation.

## Execution authority

The plan is enforced by `src/spatial/integrationMasterPlanGate.ts`.

Current repository state on 2026-10-01:

- `MOSCOW-INT-00`: active and blocked;
- `MOSCOW-INT-01...09`: locked by Phase 0;
- Romanov field tooling: ready, real field evidence archive: missing;
- Old English Court: intake only, repeatability proof: missing;
- supervised visitor pilot tooling: ready, reviewed real pilot evidence: missing;
- government technical-pilot artifact package: structurally ready;
- Yandex MapKit remains the primary renderer.

Run `npm run integration:status` for the machine-readable gate report.

## Parallel external-provider proof

The Live Destination / YCLIENTS proof remains a parallel external-provider track and does not unlock spatial scaling.

Current provider sequence remains:

`YCLIENTS access → Render secrets → real API call → raw response → SHA-256 → admission → controlled record → real webhook → provider state change → Journey Runtime replan-required → verified replacement route → continuation → terminal provider receipt → immutable archive → provider PASS`.

No provider PASS may be claimed from mock/synthetic receipts.

Evidence Signing Authority remains explicitly deferred until the first real provider PASS. Signing a pre-proof package would prove integrity of an unproven scenario, not real provider execution.

## Issue order
1. [MOSCOW-INT-00 Field proof gate — #78](https://github.com/PetrFedin/Moscow/issues/78)
2. [MOSCOW-INT-01 Destination Package v2 — #79](https://github.com/PetrFedin/Moscow/issues/79)
3. [MOSCOW-INT-02 H3/Turf — #80](https://github.com/PetrFedin/Moscow/issues/80)
4. [MOSCOW-INT-03 GeoTIFF/Proj4 — #81](https://github.com/PetrFedin/Moscow/issues/81)
5. [MOSCOW-INT-04 IIIF — #82](https://github.com/PetrFedin/Moscow/issues/82)
6. [MOSCOW-INT-05 Field Verification — #83](https://github.com/PetrFedin/Moscow/issues/83)
7. [MOSCOW-INT-06 3D admission — #84](https://github.com/PetrFedin/Moscow/issues/84)
8. [MOSCOW-INT-07 Routing — #85](https://github.com/PetrFedin/Moscow/issues/85)
9. [MOSCOW-INT-08 Spatial narrative — #86](https://github.com/PetrFedin/Moscow/issues/86)
10. [MOSCOW-INT-09 City-scale 3D gate — #87](https://github.com/PetrFedin/Moscow/issues/87)

**Implementation instruction:** prove spatial truth and repeatability first; scale second.

## Additional wave — signed offline packages and field observability

### Signed Destination Package manifest — ADOPT

Reference: https://github.com/panva/jose

Each Published Spatial / Destination Package should carry a signed manifest covering:

- package ID/version;
- publication timestamp;
- app compatibility version;
- hashes of POI/narrative/geometry/media/3D/route payloads;
- localisation set;
- key ID/signature algorithm.

Flow:

`reviewed package -> deterministic manifest -> signature -> upload/distribution -> mobile verification -> local activation`

The mobile client must reject/treat as untrusted a package whose manifest/signature/hash validation fails.

This is especially important once packages are cached/offline and updated independently of the app binary.

Do not put private signing keys in the mobile bundle.

### Sentry React Native field-pilot observability — ADOPT

Reference: https://github.com/getsentry/sentry-react-native

Instrument privacy-safe pilot failures:

- destination package download/verify;
- model load;
- AR session initialization;
- anchor placement failure class;
- location/compass permission/state;
- offline cache failure;
- route screen crash.

Attach:

- app/build version;
- device/OS class;
- package ID/version;
- scene/object ID;
- error class.

Do not capture camera frames, exact user routes or precise location histories by default.

Field Verification evidence remains the product truth; Sentry is operational diagnostics.

### 3D Tiles tooling — DEFER with Cesium gate

Reference: https://github.com/CesiumGS/3d-tiles-tools

If/when the existing Cesium city-scale gate is opened, use 3D Tiles tooling for validation/processing of city-scale datasets rather than inventing a proprietary tile format.

This does not move local object GLB/AR assets out of the current glTF admission pipeline.

### Acceptance extension

- offline package activation is cryptographically integrity-checked;
- a stale/tampered package cannot silently replace an approved package;
- field crashes can be resolved to exact app + package version;
- privacy rules prohibit collecting unnecessary visitor location/camera content.

**Sequencing:** package signing belongs with Destination Package v2; field observability can start during the Romanov/Old English Court pilot; 3D Tiles remains behind the city-scale gate.

## Additional wave — anchor calibration, temporal scenes and accessibility routing

This wave is aimed at the exact pilot problem: making the physical-to-digital scene more repeatable, testable and accessible before content scale.

### AprilTag-assisted field calibration — ADOPT/CONDITIONAL TOOLING

Reference: https://github.com/AprilRobotics/apriltag

Use temporary printed AprilTags during authoring/field calibration, not necessarily in the public visitor experience.

Calibration workflow:

known physical marker pose -> device camera observation -> estimated camera/site transform -> compare expected AR anchor -> record offset/error -> adjust/review package

Persist:

- site/object;
- marker/calibration set ID;
- device/build;
- observed pose;
- expected pose;
- translation/rotation error;
- capture timestamp;
- pass/fail threshold;
- evidence media/reference.

This can provide repeatable anchor measurements instead of relying only on visual judgement.

Remove/ignore calibration markers from published visitor logic unless a deliberate operational decision says otherwise.

### Sensor Quality Gate — ADOPT

Before launching a spatial scene, calculate a client-side quality state from available signals:

- location accuracy;
- heading accuracy;
- motion/orientation availability;
- AR tracking state;
- downloaded package/version;
- device capability.

States such as:

- precise/ready;
- degraded;
- insufficient.

Narrative/AR behavior must adapt:

- precise -> full anchored experience;
- degraded -> guided fallback/manual alignment;
- insufficient -> map/media/story fallback.

Do not pretend a precise placement when sensors say otherwise.

### Temporal Scene Model — ADOPT

Add explicit valid-time relationships:

- scene/asset;
- historical period;
- valid_from / valid_to or approximate period;
- confidence;
- source evidence;
- reconstruction status.

A location can therefore expose multiple historically distinct states without treating them as simultaneous truth.

Flow:

place -> epoch/period -> historical evidence -> reconstructed scene -> publication version

UI can support a time slider/epoch switch only after the underlying temporal records exist.

### Accessibility Route Profile — ADOPT

Extend curated walks with accessibility constraints:

- step-free preference;
- stairs;
- steep slope where known;
- surface/temporary obstruction;
- entrance accessibility;
- lift/ramp availability where verified;
- rest point;
- accessible toilet/amenity where sourced.

Valhalla or another router may provide route candidates, but Moscow retains verified accessibility metadata and curated route approval.

If accessibility status is unknown or stale, show it as unknown rather than asserting accessibility.

### Audio/subtitle narrative package — ADOPT

For eligible stories/scenes, package:

- narration audio;
- transcript;
- subtitle/caption timings;
- language;
- narrator/source;
- version;
- rights.

Use standard WebVTT-compatible caption assets where practical.

This provides an accessible low-visual-attention path and supports offline narration without requiring AR.

### Additional acceptance

- calibration error can be reproduced with a known marker/setup;
- sensor degradation triggers an explicit fallback rather than false precision;
- every historical scene has period/evidence/confidence metadata;
- accessibility claims identify source/verification freshness;
- audio/captions remain synchronized and versioned inside Destination Package.

**Sequencing:** Field Verification -> AprilTag calibration + sensor gate -> temporal scene model -> accessibility/audio layers -> larger spatial-trigger rollout.

