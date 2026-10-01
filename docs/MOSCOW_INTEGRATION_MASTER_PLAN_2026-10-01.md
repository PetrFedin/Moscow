# Moscow — Spatial Heritage Integration Master Plan

**Status:** PLANNED  
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

## Issue order
1. MOSCOW-INT-00 Field proof gate
2. MOSCOW-INT-01 Destination Package v2
3. MOSCOW-INT-02 H3/Turf
4. MOSCOW-INT-03 GeoTIFF/Proj4
5. MOSCOW-INT-04 IIIF
6. MOSCOW-INT-05 Field Verification
7. MOSCOW-INT-06 3D admission
8. MOSCOW-INT-07 Routing
9. MOSCOW-INT-08 Spatial narrative
10. MOSCOW-INT-09 City-scale 3D gate

**Implementation instruction:** prove spatial truth and repeatability first; scale second.
