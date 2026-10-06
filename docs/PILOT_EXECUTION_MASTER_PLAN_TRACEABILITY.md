# Pilot Execution — Master Plan / Tech Radar Traceability

This matrix must be reviewed before each pilot-readiness wave.

Sources:

- `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`
- `docs/GITHUB_TECH_RADAR_AND_CITY_PRODUCT.md`

## Pre-pilot dispositions

| Capability / idea | Source status | Pre-pilot disposition | Reason / guardrail |
|---|---|---|---|
| Romanov physical field proof | mandatory Phase 0 | **IN PRE-PILOT** | Primary spatial truth gate |
| Old English Court second-object repeatability | mandatory Phase 0 | **IN PRE-PILOT** | Proves pipeline is not Romanov-only |
| Supervised visitor pilot 20–50 | mandatory Phase 0 | **IN PRE-PILOT** | Real usability/product evidence |
| Government evidence package | mandatory Phase 0 | **IN PRE-PILOT** | Acceptance / handover path |
| YCLIENTS real provider proof | parallel provider track | **IN PRE-PILOT** | Does not unlock spatial scale |
| Sensor Quality Gate | ADOPT / implementing | **REQUIRED IN FIELD BUILD** | Runtime safety only; cannot set field PASS |
| Sentry field-pilot observability | ADOPT | **PRE-PILOT OPERATIONAL DECISION** | Privacy-safe diagnostics only; not acceptance evidence |
| AprilTag-assisted calibration | ADOPT / implementing | **OPTIONAL AUXILIARY** | Cannot mutate survey, set session PASS or unlock Phase 0 |
| Street-level reference imagery / Mapillary | conditional adapt | **OPTIONAL PRE-FIELD CONTEXT** | Hypothesis/orientation only; field verification wins |
| Accessibility Route Profile | Phase 1 implementing | **OBSERVE IN USER PILOT WHERE REAL FACTS EXIST** | Unknown/stale accessibility remains unknown |
| Audio/subtitle package | Phase 1 implementing | **TEST EXISTING APPROVED CONTENT ONLY** | No fake recorded-human/timed-caption readiness |
| Signed Destination Package manifest | ADOPT with Destination Package v2 | **DEFERRED UNTIL PHASE 1** | Do not invert Phase 0 sequencing |
| H3 + Turf | Phase 2 | **DEFERRED** | No value before field proof gate |
| GeoTIFF / Proj4 historical map authority | Phase 3 | **DEFERRED** | Not required for pilot launch |
| IIIF / Mirador | Phase 4 | **DEFERRED** | Not required for pilot launch |
| Valhalla routing | Phase 7 | **DEFERRED** | Curated route remains authoritative |
| Cesium / 3D Tiles tooling | Phase 9 | **DEFERRED** | No two-object pilot dependency |
| Filament second renderer | watch | **OUT OF P0** | Viro stays main spatial runtime |
| MapLibre migration | watch | **OUT OF P0** | Yandex remains primary renderer |
| Crowd photogrammetry / Tirtha pattern | future | **OUT OF PILOT** | Separate rights/moderation/product programme |

## Mandatory review rule

Before adding anything to Pilot Execution Pack:

1. check both source documents above;
2. classify the item in this matrix;
3. prove it reduces current pilot risk or strengthens evidence;
4. do not promote Phase 1+ work into Phase 0 unless the canonical master plan is explicitly changed;
5. preserve existing truth boundaries.

## Current pre-pilot additions adopted

### Sensor Quality Gate
Required in the field build. It may route to precise/degraded/insufficient experience, but it is not physical accuracy evidence.

### Field observability
A pre-field decision must explicitly state whether privacy-safe Sentry is enabled or disabled with reason. If enabled, no precise routes, camera content or PII.

### AprilTag
May improve calibration diagnostics. It remains auxiliary evidence with reviewer status and can never directly set `RomanovFieldSession.passed`.

### Street-level reference
May be used to prepare likely entrances/facade/accessibility questions. Capture date/freshness must be visible. Direct field evidence remains authoritative.

### Package signing
Explicitly deferred to Destination Package v2 after Phase 0. A pre-pilot GO cannot depend on a fake signed-package implementation.
