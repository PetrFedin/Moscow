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

This is now enforced by `src/integrations/providerProofGate.ts`.

Machine-readable check:

`npm run provider:proof-status`

The gate distinguishes four states that must not be conflated:

`runtime credentials configured → admission validated → real evidence run PASS → Evidence Signing Authority AVAILABLE`.

Credentials or admission alone never unlock signing. A real archived provider PASS can remain historically valid after credentials are later rotated or removed.

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

### AprilTag-assisted field calibration — ADOPT / PHASE 1 IMPLEMENTING (#96)

Reference: https://github.com/AprilRobotics/apriltag

Use temporary printed AprilTags during authoring/field calibration, not necessarily in the public visitor experience.

Calibration workflow:

known physical marker authority -> detector observation -> normalize into explicit common site frame -> compare expected/observed pose -> record translation/rotation error -> reviewer decision -> optional calibration refinement

Phase 1 repository authority:

- evidence contract: `src/spatial/aprilTagCalibrationEvidence.ts`;
- integrity tests: `tests/aprilTagCalibrationEvidence.test.ts`;
- runbook: `docs/APRILTAG_CALIBRATION_EVIDENCE.md`;
- detector integration: adapter boundary only until a real supported native/authoring detector path is proven.

Persist:

- site/object;
- marker/calibration set ID/version;
- tag family/ID and measured physical size;
- survey packet reference;
- device/build;
- detector ID/version;
- observed pose;
- expected pose;
- explicit common frame ID;
- translation/rotation error;
- capture timestamp;
- confidence class;
- evidence references;
- reviewer status/identity/time.

Guardrail: accepted AprilTag evidence is an auxiliary calibration record. It cannot set `RomanovFieldSession.passed`, mutate survey points automatically, verify a persistent anchor or unlock `MOSCOW-INT-00`.

The current official AprilTag implementation is not treated as a ready-made React Native API. The mobile detector remains conditional until a real supported adapter/backend is selected and tested.

Remove/ignore calibration markers from published visitor logic unless a deliberate operational decision says otherwise.

### Sensor Quality Gate — ADOPT / IMPLEMENTING (#94)

Before launching or re-anchoring a spatial scene, calculate a client-side quality state from available signals:

- location uncertainty radius;
- compass calibration quality;
- motion/orientation availability;
- AR tracking state;
- model/package readiness;
- device AR capability.

Runtime states are now explicit:

- `precise`;
- `degraded`;
- `insufficient`.

Narrative/AR behavior must adapt:

- `precise` -> sensor-ready anchored workflow may proceed;
- `degraded` -> guided/manual alignment only; no precise-placement claim;
- `insufficient` -> anchor placement blocked; use 3D/story fallback.

Current pilot implementation authority:

- pure deterministic gate: `src/spatial/sensorQualityGate.ts`;
- native Romanov integration: `src/features/spatial/MoscowSpatialJourney.native.tsx`;
- contract tests: `tests/sensorQualityGate.test.ts`;
- runbook: `docs/SENSOR_QUALITY_GATE.md`.

Privacy boundary: only permission class, location uncertainty radius and compass calibration level may enter gate state. Latitude/longitude, raw heading, route history and camera content are not persisted or emitted by this gate.

This is a runtime safety layer only. It cannot mark Romanov/Old English Court field evidence PASS and cannot unlock `MOSCOW-INT-00`.

Do not pretend a precise placement when sensors say otherwise.

### Temporal Scene Model — ADOPT / PHASE 1 IMPLEMENTING (#98)

Temporal authority now distinguishes:

- exact date;
- exact year;
- bounded range;
- approximate range;
- non-contiguous reference points;
- undated state.

Each temporal scene binds:

- place + scene/version;
- period label/extent;
- confidence, including explicit `not-assessed`;
- source evidence;
- claim/evidence-element IDs;
- model/media asset IDs;
- reconstruction status;
- interpretation mode;
- publication state;
- optional supersession/alternative relationships.

Current implementation authority:

- generic contract/validator: `src/spatial/temporalSceneAuthority.ts`;
- Romanov bindings: `src/spatial/romanovTemporalScenes.ts`;
- Time Machine runtime routing: `src/spatial/placeExperienceRegistry.ts`;
- tests: `tests/temporalSceneAuthority.test.ts`;
- runbook: `docs/TEMPORAL_SCENE_AUTHORITY.md`.

The existing Romanov `1859 / 1883` research state is represented as two **reference points**, not a fabricated continuous `1859–1883` interval.

Flow:

place -> temporal scene authority -> historical evidence/claims -> asset binding -> runtime era -> publication state

A location can therefore expose multiple historically distinct states without treating them as simultaneous truth. Overlapping active states fail closed unless they are explicitly identified as alternative interpretations.

Time Machine UI is navigation only; it does not own historical truth.

This layer does not add unsupported dates, promote field verification or unlock `MOSCOW-INT-00`.
### Accessibility Route Profile — ADOPT / PHASE 1 IMPLEMENTING (#100)

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

Phase 1 repository authority:

- generic evidence-bound contract: `src/travel/accessibilityRouteProfile.ts`;
- fail-closed tests: `tests/accessibilityRouteProfile.test.ts`;
- Personal Trip step-free intent persistence: `tests/tripAccessibilityPreference.test.ts`;
- runbook: `docs/ACCESSIBILITY_ROUTE_PROFILE.md`.

Current Phase 1 adds no real Moscow accessibility facts. `step-free required` is a user intent, not evidence. Missing, stale or conflicting required facts return `needs-accessibility-authority` rather than a fabricated accessible route.

### Audio/subtitle narrative package — ADOPT / PHASE 1 IMPLEMENTING (#118)

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

Phase 1 does not duplicate the existing recorded-human-first audio system. It adds the missing timed-caption authority:

- exact narration track/version/master SHA-256/duration binding;
- ordered non-overlapping cue validation;
- full approved-transcript parity;
- deterministic WebVTT rendering;
- rights/source/version metadata;
- measured synchronization evidence;
- fail-closed `captioned` vs `transcript-only` release decision.

Repository authority:

- timed captions and sync gate: `src/features/audio/timedNarrativePackage.ts`;
- contract tests: `tests/timedNarrativePackage.test.ts`;
- runbook: `docs/TIMED_NARRATIVE_PACKAGE.md`;
- existing master/TTS authority remains `src/features/audio/varvarkaAudioCatalog.ts` + `docs/PRODUCTION_AUDIO.md`.

No current Varvarka track is promoted by Phase 1. All real narration masters remain recording-pending, so timed captions remain fail-closed until real human masters, human-reviewed cue timing, and measured sync evidence exist.
### Additional acceptance

- calibration error can be reproduced with a known marker/setup;
- sensor degradation triggers an explicit fallback rather than false precision;
- every historical scene has period/evidence/confidence metadata;
- accessibility claims identify source/verification freshness;
- audio/captions remain synchronized and versioned inside Destination Package.

**Sequencing:** Field Verification -> AprilTag calibration + sensor gate -> temporal scene model -> accessibility/audio layers -> larger spatial-trigger rollout.

## Additional wave — street-level reference imagery for field verification

This wave adds a practical authoring/review tool for entrances, facades, approach paths and accessibility checks without replacing field evidence.

### Mapillary JS reference viewer — CONDITIONAL ADAPT

Reference: https://github.com/mapillary/mapillary-js

Use Mapillary JS only as a bounded reviewer/authoring surface when provider access and imagery terms permit.

Possible uses:

- compare current street-level context with the Moscow destination package;
- verify likely approach direction/entrance before field visit;
- identify facade/streetscape changes that require package review;
- pre-screen accessibility/route questions;
- support editorial orientation for a historical scene.

The imagery is external contextual evidence, not the authoritative current-site state.

### Street-level Reference Record — ADOPT

When an editor uses an external street-level image, store only the necessary reference metadata:

- provider;
- external image/sequence ID;
- capture date where supplied;
- coordinates/heading where supplied;
- reviewed_at;
- reviewer;
- linked site/entrance/route;
- note/status.

Do not copy or redistribute imagery outside provider terms.

### Field Verification comparison workflow — ADOPT

Flow:

external/reference imagery -> pre-field hypothesis -> actual field verification -> discrepancy -> destination-package update/review

Examples:

- expected entrance no longer accessible;
- facade changed;
- temporary obstruction;
- current path differs from archived assumptions.

Only direct field verification or an explicitly trusted live source may confirm current operational state.

### Freshness / Staleness rule — ADOPT

Street-level imagery can be months or years old. UI/editor tooling should always expose capture date/freshness where available and support statuses such as:

- current enough for orientation;
- stale/context only;
- conflicts with field evidence;
- no usable reference.

Never assert accessibility, closure or current entrance availability solely from old imagery.

### Existing offline map boundary

Keep the current Tippecanoe/PMTiles and Yandex MapKit plan unchanged. Mapillary is an optional reference viewer, not the base map or offline route authority.

### Additional acceptance

- external imagery references have capture/provider metadata where available;
- field evidence overrides conflicting street-level reference imagery;
- no external image is redistributed beyond provider permissions;
- stale imagery is visibly labeled;
- the optional provider can be disabled without breaking published Destination Packages.

**Sequencing:** Field Verification Mode first -> optional street-level reference reviewer -> discrepancy workflow -> package updates.

**Dependency note:** the Mapillary JS repository is MIT-licensed, but service/API/data usage has separate provider terms and credentials that must be reviewed before adoption.

## Additional wave — personal day itinerary, reservations and multimodal routing

This wave implements the product direction: a visitor should be able to build a real day or multi-day plan for Moscow, combine things they want to see with already purchased/booked activities, and later understand what they actually visited.

### Personal Itinerary Authority — ADOPT

Create native entities:

- trip/visit;
- day;
- itinerary item;
- place/event/restaurant/theatre/activity reference;
- fixed vs flexible item;
- planned start/end;
- opening-hours constraint snapshot;
- reservation/ticket reference;
- priority;
- travel segment;
- status;
- notes;
- visited/completed evidence.

Item types:

- attraction/place;
- historical scene/walk;
- museum/exhibition;
- theatre/show;
- restaurant/bar/cafe;
- booked activity;
- personal/free-time block;
- imported ticket/reservation.

Moscow remains the itinerary authority.

### Fixed vs Flexible Planning — ADOPT

A purchased ticket or confirmed restaurant/theatre booking becomes a **fixed constraint**.

A wishlist place is flexible.

Planner therefore solves around:

- fixed ticket time;
- opening hours;
- visit duration;
- travel time;
- user priority;
- geography;
- meal/rest windows;
- day start/end;
- accessibility preference;
- already visited places;
- weather/temporary conditions only when an authoritative provider is integrated.

Do not silently move a confirmed reservation.

### OpenTripPlanner multimodal routing — CONDITIONAL SIDECAR

Reference:

https://github.com/opentripplanner/OpenTripPlanner

Use only when GTFS/transit/street data quality and deployment requirements justify it.

Possible role:

- public-transport route candidate;
- walking+transit travel-time estimate;
- transfer count;
- accessibility-related routing attributes where data supports them.

Architecture:

Moscow itinerary -> routing request -> candidate journeys -> Moscow planner selects/combines -> itinerary travel segment

OpenTripPlanner does not own the itinerary or destination catalogue.

Yandex may remain the primary map/rendering/navigation handoff even if OTP provides analytical route candidates.

### Time-window Itinerary Optimisation — ADAPT

Reuse Google OR-Tools patterns already evaluated elsewhere in the portfolio for a bounded itinerary scenario solver.

Inputs:

- flexible places;
- fixed reservations;
- opening windows;
- expected visit duration;
- travel-time matrix;
- priority/interest;
- start/end location;
- accessibility constraints.

Output:

- feasible ordered candidate plan;
- skipped items with reason;
- expected arrival/departure;
- buffer;
- total travel/visit time.

Human/user acceptance writes the actual plan. Solver output never silently replaces it.

### Ticket / Reservation Import — ADOPT

Allow the user to add an already purchased booking manually or from supported structured inputs.

Store:

- provider;
- venue/event;
- booking/ticket reference;
- date/time;
- party size/seats;
- address/location;
- QR/barcode attachment where appropriate;
- source document/email/file;
- verification status;
- notes.

Do not claim provider verification unless a real provider API/receipt has been checked.

Sensitive ticket QR/barcodes must not appear in public/social surfaces.

### Plan Reconciliation / Visited History — ADOPT

After the day:

planned -> actually visited / skipped / rescheduled -> evidence/source -> personal history

Possible evidence:

- explicit user confirmation;
- app check-in/QR;
- verified booking attendance/provider receipt;
- field/location event with consent and sufficient accuracy.

Do not mark a place visited merely because the user passed nearby.

History can then answer:

- what I have already seen;
- neighbourhoods/epochs visited;
- places saved but not visited;
- what fits my next free day.

### Day Replan — ADOPT

When a fixed item changes/cancels or the user skips something:

current time/location + remaining fixed constraints + remaining flexible items -> proposed replacement plan

This builds directly on the existing Journey Runtime / replan-required concepts.

### Additional acceptance

- fixed reservations are never moved without explicit user action;
- itinerary solver records input snapshot/config;
- every travel-time source/provider is identifiable;
- imported ticket/provider verification state is explicit;
- visit history distinguishes user-confirmed, provider-verified and inferred/location-assisted evidence;
- replanning preserves future fixed commitments;
- itinerary works without requiring continuous precise-location history.

**Sequencing:** destination/place catalogue + field-proven content -> Personal Itinerary -> fixed ticket/reservation import -> route-time adapters -> optional OR-Tools planning -> Journey Runtime replan -> visited-history loop.

**Dependency note:** OpenTripPlanner upstream is active, but license/data/GTFS deployment requirements must be reviewed before adoption; it remains a replaceable routing sidecar.

## Product wave — Personal Trip OS

Issue: #101. Detailed contract: `docs/PERSONAL_TRIP_OS.md`.

### Goal

Move the consumer product from a single destination-day prototype to a persistent personal trip layer:

`Trip -> Day -> Plan item -> Ticket/Reservation -> Visit -> History -> What next`.

The user must be able to plan several Moscow days, combine published Moscow inventory with their own tickets/reservations, record actual visits and understand what remains unseen.

### Architecture boundary

Personal Trip is a visitor-owned layer above the existing authorities:

- `DestinationPackage` remains source-backed destination content authority;
- `DestinationJourneyRuntime` remains live execution/replan authority;
- provider receipts remain the only way to promote a booking to provider-confirmed;
- field verification remains independent of personal trip state;
- #74/#73 provider PASS remains required before Evidence Signing Authority.

Manual ticket/reservation entry is useful personal data but must remain `user-declared`; it cannot satisfy provider proof.

### First slice — IMPLEMENTING

- multi-day local-first trip;
- day timeline;
- saved-place quick add;
- manual museum/restaurant/theatre/bar/event/activity entries;
- manual ticket/reservation capture;
- visit ledger;
- completed in-app route stop -> trip history sync;
- source-backed "what else to see";
- RU / EN / ZH UI;
- contract tests.

### Next sequence

After the first slice is green:

1. reorder and move items across days;
2. detect fixed-time conflicts;
3. introduce routing-authority travel slots;
4. import provider receipt/deep-link return;
5. add stay/hotel anchors;
6. trusted live opening-hours/weather context;
7. free-window recommendations;
8. multi-day trip recap.

Do not use the absence of provider access as a reason to stop product development, but do not fabricate live availability, prices, opening status, bookings or ticket outcomes.


### Trip Scheduler v2 — IMPLEMENTING (#103)

Build the editable multi-day layer on top of Personal Trip OS:

- explicit day ordering;
- move unvisited items between trip days;
- preserve ticket/reservation verification state when a planned item moves;
- refuse moves that would rewrite recorded visit history;
- detect overlap between fixed confirmed commitments;
- derive schedule-only free windows from all timed plan items;
- keep every free-window feasibility claim at `routingVerified=false` until routing authority is connected;
- capture start/end time, stay/transport items, booking source, order reference and HTTPS confirmation link.

Do not convert a user-entered ticket, booking source or URL into provider-confirmed evidence.

### Tourist Today cockpit — IMPLEMENTING (#105)

Expose the active-day operating view:

`Now -> Next commitment -> Remaining plan -> Free windows -> Seen today -> What else`.

Current implementation authority:

- pure clock/plan derivation: `src/travel/touristToday.ts`;
- contract tests: `tests/touristToday.test.ts`;
- user-facing cockpit: `src/features/trip/TouristTodayCard.tsx`;
- browser journey coverage remains in `tests/personalTrip.e2e.spec.ts`.

The cockpit derives the current Moscow trip day, current planned item, next item, next fixed ticket/reservation, completed/remaining progress, visits today, schedule-only free window and time-conflict count.

This layer may use the user's clock and stored plan immediately. It must not claim:

- route feasibility without routing authority;
- current opening status without trusted live hours;
- current ticket availability without provider authority.

User-entered tickets/reservations remain `user-declared`. The absence of live routing/opening/provider authorities must degrade the claim, not block the personal trip product.


### Moscow Passport — IMPLEMENTING (#107)

Complete the Personal Itinerary / Plan Reconciliation loop with a semantic personal history:

`plan -> actual visit -> evidence -> semantic category -> day recap -> trip passport`.

Repository authority:

- semantic model: `src/travel/moscowPassport.ts`;
- visit kind persistence: `src/travel/personalTrip.ts`;
- UI: `src/features/trip/MoscowPassportCard.tsx`;
- contract tests: `tests/moscowPassport.test.ts`;
- browser journey: `tests/personalTrip.e2e.spec.ts`.

Categories distinguish what the tourist saw, where they ate, nightlife, culture, activities, shopping, stay and transport.

Guardrails:

- semantic grouping does not change evidence class;
- old v1 visits without a semantic kind resolve from their linked plan item or DestinationPackage node;
- user-confirmed remains user-confirmed;
- route-completed remains route-completed;
- provider-receipt remains provider-receipt;
- no continuous GPS history is required;
- the passport itself is not physical-presence proof.

This implements the current master-plan requirement that visited history answer what the user has already seen and where they have actually spent their trip.


### Trip Booking Wallet — IMPLEMENTING (#110)

Implements the current Ticket / Reservation Import direction inside Personal Trip OS.

Data captured for a user-supplied commitment may include:

- provider/source;
- booking/ticket reference;
- planned date/time;
- party size;
- seats/row/sector;
- address/meeting point;
- source reference;
- HTTPS confirmation link;
- verification state.

Repository authority:

- commitment contract/validation: `src/travel/personalTrip.ts`;
- trip-wide wallet UI: `src/features/trip/BookingWalletCard.tsx`;
- day integration: `src/features/trip/PersonalTripPlanner.tsx`;
- contract tests: `tests/bookingWallet.test.ts`;
- browser journey: `tests/personalTrip.e2e.spec.ts`.

Guardrails:

- manual import remains `user-declared`;
- detail fields cannot upgrade a commitment to provider-confirmed;
- provider-confirmed still requires receipt/evidence reference;
- raw QR/barcode payloads are not persisted in this first slice;
- QR/barcode data must never enter public/social surfaces;
- complete confirmed time intervals remain fixed scheduling constraints;
- fixed commitments are never silently moved by planner/solver logic.

This does not satisfy #74/#73 and does not create live provider validity.

## Premium innovation wave — camera-based visual positioning and instant historical reveal

This wave creates a signature time-machine interaction: the visitor points the camera at a verified landmark/facade, Moscow recognizes the place/context and opens the correct historical layer even where GPS/compass are noisy.

### Visual Landmark Reference Set — ADOPT / PHASE 1 IMPLEMENTING (#114)

For field-proven places store approved reference imagery/descriptors:

- site/object/facade;
- viewpoint/heading;
- source image/version;
- capture date;
- reference feature metadata;
- field verification state;
- rights;
- descriptor/model version.

Only verified public landmarks/facades enter the set.

Phase 1 repository authority:

- evidence-bound set and descriptor metadata: `src/spatial/visualLandmarkReference.ts`;
- external field-verification admission: a reference set cannot self-declare physical PASS;
- strict candidate decision: `matched / needs-user-confirmation / not-sure / blocked-unverified-site`;
- geographic and heading incompatibility rejection;
- contract tests: `tests/visualLandmarkReference.test.ts`;
- runbook: `docs/VISUAL_LANDMARK_REFERENCE_SET.md`.

No real Romanov or Old English Court visual reference set is activated by Phase 1. The existing physical field gates remain authoritative.

### On-device Visual Recognition — ADAPT / PHASE 1 IMPLEMENTING (#121)

Candidate libraries:

- https://github.com/google-ai-edge/mediapipe
- https://github.com/opencv/opencv

Flow:

camera frame -> local feature/model inference -> candidate landmark -> confidence/geometry check -> package lookup -> user confirmation or strict-threshold reveal

Prefer on-device processing to avoid uploading continuous camera video.

Phase 1 repository authority:

- bounded local-inference observation: `src/spatial/onDeviceVisualRecognition.ts`;
- exact engine/model/modelVersion/descriptorVersion binding to the approved reference;
- only field-admitted + Recognition Quality PASS reference sets may participate;
- canonical site/package lookup from the admitted reference set;
- deterministic outcomes: `strong-candidate / needs-user-confirmation / not-sure / blocked`;
- privacy contract requires `processing=on-device`, `framePersisted=false`, `frameUploaded=false`, `faceRecognitionUsed=false`;
- contract tests: `tests/onDeviceVisualRecognition.test.ts`;
- runbook: `docs/ON_DEVICE_VISUAL_RECOGNITION.md`.

A `strong-candidate` is deliberately **not** Sensor Fusion PASS and is not Instant Historical Reveal authority. No real Romanov/OEC camera recognition is activated until their field/reference/quality evidence exists.
### Visual + Sensor Fusion — ADOPT / PHASE 1 IMPLEMENTING (#123)

Combine:

- visual candidate;
- coarse GPS;
- heading;
- orientation;
- known destination package;
- optional AprilTag calibration in authoring mode.

Reject visually plausible but geographically impossible matches.

Phase 1 repository authority:

- fusion contract: `src/spatial/visualSensorFusion.ts`;
- input is the admitted On-device Visual Recognition decision plus the existing Sensor Quality Gate;
- candidate-specific location/heading context is bounded to `compatible / incompatible / unknown`; raw coordinates/headings never enter the authority;
- automatic confirmation requires strong visual candidate + `precise` sensor state + compatible location + compatible heading + exact `verified-active` package match;
- degraded/unknown but non-incompatible context requires explicit user confirmation;
- user confirmation cannot override incompatible location/heading, insufficient sensors, visual blockers or package mismatch;
- contract tests: `tests/visualSensorFusion.test.ts`;
- runbook: `docs/VISUAL_SENSOR_FUSION.md`.

A fused `confirmed` site/context is still not Instant Historical Reveal authority; the Temporal Scene/evidence gate remains a separate next layer.
### Instant Historical Reveal — ADOPT

After confirmed place/context:

current facade -> matched historical scene/period -> overlay/reconstruction -> evidence panel -> optional audio narrative

Show historical period, reconstruction confidence and source evidence.

### Privacy Boundary — REQUIRED

Do not implement face recognition or identify passers-by.

Default:

- no continuous camera upload;
- no biometric profile;
- no background person tracking;
- ephemeral frames unless user explicitly saves/captures.

### Recognition Quality Gate — ADOPT / PHASE 1 IMPLEMENTING (#114)

Per site measure:

- true-match rate;
- false-positive rate;
- unknown/failure rate;
- viewpoint/lighting coverage;
- device performance;
- inference latency.

If insufficient, fall back to map/manual selection.

Phase 1 quality authority records measured sample count, true-match/false-positive/unknown rates, viewpoint and lighting coverage, tested device classes and p95 inference latency. Missing evidence fails closed. Pilot thresholds are repository-configurable and are not presented as external standards.

Release requires both external field admission and quality evidence for the same canonical site.

### Additional acceptance

- recognized place resolves to field-verified canonical site ID;
- impossible geographic matches are rejected;
- false positives produce safe not-sure behavior;
- historical reveal shows evidence/period/confidence;
- camera flow works without face identification;
- unsupported devices degrade gracefully.

**Sequencing:** field-proven packages -> visual reference set -> on-device matching -> sensor fusion -> historical reveal -> broader rollout.

## Premium commercial wave — governed AI City Concierge

This wave turns the existing itinerary, routing, booking/ticket and historical-content stack into one natural-language premium interface.

### City Concierge Agent — ADOPT

Typed-agent pattern candidate:

https://github.com/pydantic/pydantic-ai

The agent may use only explicit Moscow tools such as:

Read:
- search places/events/content;
- inspect opening hours/source freshness;
- inspect current itinerary;
- inspect imported tickets/reservations;
- calculate travel-time candidates;
- inspect visited-history;
- fetch historical/source context.

Propose:
- day plan;
- replacement item;
- route;
- restaurant/theatre/activity candidate;
- ticket/reservation addition;
- itinerary replan.

Side effects:
- itinerary changes;
- booking/provider actions;
- notifications/reminders;

require explicit user approval unless they are harmless reversible local edits the user directly requested.

### Source-grounded Answers — REQUIRED

Every factual answer about:

- opening hours;
- ticket time;
- booking;
- address;
- historical fact;
- accessibility;
- temporary closure;

must identify the source/verification state used by Moscow.

If current data is unavailable, say it is unknown/stale instead of inventing availability.

### Conversational Constraint Capture — ADOPT

The user can say:

- I have a theatre ticket at 19:00;
- I want architecture, no museums;
- lunch around 14:00;
- I have already seen the Kremlin;
- keep walking under 8 km;
- step-free route;
- two days with children.

Translate these into visible itinerary constraints that the user can edit.

Do not hide inferred constraints inside the model.

### Plan Explanation — ADOPT

For each proposed item show why it is there:

- requested interest;
- near a fixed booking;
- fits opening window;
- new vs already visited;
- route efficiency;
- historical/theme relation;
- accessibility match where verified.

### Live Replan — ADOPT

When the user says:

- we are late;
- skip this;
- I am here now;
- restaurant cancelled;
- I have 90 free minutes;

invoke the existing replan authority and preserve future fixed constraints.

### Concierge Memory Boundary — ADOPT

Persist only useful user-approved travel preferences/history according to account/privacy policy.

Do not infer religion, politics, health or other sensitive traits from visited places or questions.

### Additional acceptance

- agent cannot invent provider availability;
- every itinerary mutation has structured diff/approval;
- fixed tickets/reservations are preserved unless user explicitly changes them;
- answers link to canonical/source data;
- no booking action executes without configured provider + user approval;
- service degrades to ordinary search/itinerary UI without AI.

**Sequencing:** Personal Itinerary + source authority + provider boundaries -> read-only concierge -> plan proposals -> replan -> approved booking/action tools.

**Commercial framing:** Moscow becomes a personal city operating system, not a directory or static guide.


### Trip Preferences — IMPLEMENTING (#112)

Implements user-level planning constraints from the current Personal Itinerary / Fixed vs Flexible / Time-window optimisation direction without pretending external facts.

Persisted user intent:

- pace: relaxed / balanced / intensive;
- preferred day start/end;
- step-free intent: none / preferred / required;
- maximum continuous walking minutes;
- optional lunch window;
- priority mode: must-see / balanced / discover-more.

Immediate bounded execution:

- Trip Scheduler uses configured day bounds;
- lunch is treated as a reserved preference window and removed from schedule-only free time;
- Tourist Today uses the same day bounds;
- step-free intent is ready for Accessibility Route Profile evaluation.

Guardrails:

- preferences are not venue, route or provider facts;
- lunch preference is not a restaurant reservation;
- walking limit is not route travel-time evidence;
- day bounds are not opening-hours evidence;
- step-free intent does not make a route verified accessible;
- pace/priority cannot silently move fixed bookings;
- no optimisation solver is allowed to claim feasibility until routing/opening/accessibility inputs are authoritative;
- any future solver proposal requires explicit user acceptance before mutating the trip.

Repository authority:

- domain/defaults/validation: `src/travel/personalTrip.ts`;
- editor: `src/features/trip/TripPreferencesCard.tsx`;
- free-time constraints: `src/travel/tripScheduler.ts`;
- active-day consumption: `src/travel/touristToday.ts`;
- contract tests: `tests/tripPreferences.test.ts`;
- browser coverage: `tests/personalTrip.e2e.spec.ts`.


### Day Replan — ADOPT / PHASE 1 IMPLEMENTING (#116)

When a fixed item changes/cancels or the user skips something:

current time/location + remaining fixed constraints + remaining flexible items -> proposed replacement plan

This builds directly on the existing Journey Runtime / replan-required concepts.

Phase 1 repository authority:

- schedule-only proposal/apply engine: `src/travel/personalTripReplan.ts`;
- visitor UI: `src/features/trip/DayReplanCard.tsx`;
- contract tests: `tests/personalTripReplan.test.ts`;
- browser flow: `tests/personalTrip.e2e.spec.ts`.

Phase 1 preserves confirmed fixed commitments exactly, consumes Personal Trip day/lunch preferences, and only moves remaining flexible items with known duration. Missing-duration and no-window items stay unscheduled rather than receiving invented values.

Every proposal records `routingVerified=false`, `openingHoursVerified=false`, `accessibilityVerified=false`, and `weatherVerified=false`. Creating a proposal does not mutate the trip. Applying it requires an unchanged baseline and explicit user acceptance.

This personal schedule layer does not weaken `DestinationJourneyRuntime`: live/provider invalidation still requires the existing `replan-required` state and routing proof.

## Premium enterprise wave — hotel / concierge white-label guest journeys

This wave turns Moscow into a B2B2C city-experience product for hotels, premium residences, conference organisers and concierge services while preserving one core itinerary engine.

### Partner Organisation Authority — ADOPT

Create a bounded partner profile:

- hotel/residence/concierge/event organiser;
- brand/display settings;
- allowed staff;
- service scope;
- attribution/referral configuration;
- approved place/event collections;
- contact/escalation rules;
- status.

Partners do not own Moscow place/history/provider data.

### Concierge Workspace — ADOPT

Staff can create a guest plan from the same Personal Itinerary authority:

guest request -> constraints -> proposed itinerary -> share -> guest accepts/edits -> live replan

Inputs:

- stay dates;
- fixed tickets/reservations;
- guest interests;
- time windows;
- mobility/accessibility needs explicitly provided;
- hotel start/end point;
- dining/event preferences.

### Guest Handoff — ADOPT

Generate a privacy-minimised guest link/QR:

- itinerary;
- selected reservations/tickets;
- maps/routes;
- concierge notes;
- language;
- expiry/revoke.

The guest can continue in Moscow app/web without exposing the hotel's internal notes.

### White-label Presentation — ADOPT

Allow bounded presentation theming:

- partner logo;
- welcome text;
- concierge contact;
- selected curated collections.

Core Moscow UI, historical-source truth and provider states remain consistent.

Do not create a forked app per hotel.

### Partner-curated Collections — ADOPT

Examples:

- 24 hours near the hotel;
- architecture walk;
- rainy-day plan;
- family morning;
- theatre evening;
- business guest 3-hour route.

Partner-curated ordering is explicitly labeled; Moscow canonical place metadata stays authoritative.

### Attribution / Commercial Evidence — ADOPT

Where agreements allow:

- guest plan opened;
- booking/ticket handoff;
- provider conversion/receipt if verified;
- partner attribution;
- concierge intervention.

Do not claim revenue/conversion without real provider evidence.

### Additional acceptance

- partner staff cannot see unrelated guest/account data;
- guest link is revocable/expiring;
- fixed reservations remain governed by itinerary/provider authority;
- partner theme cannot rewrite historical/provider facts;
- one canonical itinerary engine serves direct and white-label users;
- attribution distinguishes click/handoff from verified purchase.

**Sequencing:** Personal Itinerary + AI Concierge + provider boundaries -> partner org -> concierge workspace -> guest handoff -> white-label collections -> attribution.

**Commercial framing:** sell Moscow as a digital concierge infrastructure layer for hospitality and premium visitor services, not only a direct-to-consumer guide.

## Moat wave — verified accessibility graph and inclusive journey engine

The current project correctly treats step-free intent as a preference, not verified accessibility truth. This wave creates the missing factual authority.

### Accessibility Fact Authority — ADOPT

For each relevant place/entrance/route segment store objective facts where known:

- entrance ID/type;
- level;
- step count;
- threshold/kerb height;
- ramp;
- door width/type;
- automatic door;
- elevator/lift;
- path surface;
- slope/gradient where measured;
- accessible toilet;
- accessible parking/drop-off;
- seating/rest point;
- temporary obstruction;
- source;
- observed_at;
- verifier;
- confidence/status.

Prefer objective measurements over a single yes/no accessible label.

### External Data Projection — ADAPT

OpenStreetMap may provide candidate facts such as:

- entrance=*;
- wheelchair=*;
- level=*;
- width=*;
- automatic_door=*;
- highway=elevator;
- access=*.

OSM is a useful external source, not Moscow's final verification authority.

All imported facts retain source/version/fetch time and may be superseded by field evidence.

### Field Accessibility Verification — ADOPT

Extend Field Verification Mode with an accessibility checklist:

- exact entrance;
- steps/threshold;
- ramp;
- lift;
- door;
- route obstacle;
- toilet;
- surface;
- photo/evidence;
- timestamp.

A field-verified state must expire/review after a configured period or material venue change.

### Personal Accessibility Profile — ADOPT

Allow the user to explicitly specify needs such as:

- step-free required/preferred;
- wheelchair width;
- maximum acceptable kerb/step;
- avoid steep slopes;
- lift required;
- limited walking;
- stroller;
- rest-stop preference.

Do not infer disability from behaviour/history.

### Inclusive Route Evaluation — ADOPT

route candidate -> accessibility facts -> personal constraints -> pass / caution / unknown / reject

Unknown required facts must remain unknown, not be treated as accessible.

### Venue Accessibility Card — ADOPT

Show:

- verified entrance;
- key measurements;
- route from street/transport;
- lift/toilet availability;
- freshness;
- source;
- known unknowns.

This is more useful than a generic wheelchair icon.

### Accessibility Change / Incident — ADOPT

Support temporary changes:

- lift out of service;
- construction;
- entrance closed;
- temporary ramp;
- route obstruction.

Changes can trigger Journey Runtime replan.

### B2B/B2G Accessibility Product — ADOPT

Create privacy-safe aggregate outputs for:

- hotels/concierges;
- event organisers;
- city/cultural institutions;
- accessibility audits.

Examples:

- verified accessible routes/venues;
- stale/missing evidence;
- priority verification queue.

Do not publish individual user accessibility profiles.

### Additional acceptance

- step-free routing requires factual source evidence;
- unknown fact never becomes yes;
- field verification overrides conflicting stale external data;
- user accessibility preferences are explicit and editable;
- temporary lift/entrance outage can invalidate route;
- no medical diagnosis is inferred;
- every accessibility claim shows freshness/source.

**Sequencing:** Field Verification + Itinerary + routing -> Accessibility Facts -> user profile -> inclusive route evaluation -> venue cards -> live change/replan -> B2B/B2G reporting.

**Commercial framing:** opens hospitality, city-government, cultural and inclusive-tourism markets while creating a hard-to-replicate field-verified accessibility dataset.

## Platform economics wave — Destination Intelligence and Concierge API

This wave packages Moscow's verified place, itinerary, accessibility, historical and provider capabilities as infrastructure for hotels, events, mobility partners, cultural institutions and city-facing products.

### Destination API — ADOPT

Expose approved resources:

- canonical places;
- verified entrances;
- opening-hours/provider state where available;
- historical scenes/periods;
- accessibility facts/freshness;
- curated routes;
- event/activity metadata;
- rights-safe media;
- Destination Package version.

### Itinerary / Concierge API — ADOPT

Partner submits:

- start/end;
- date/time windows;
- interests;
- fixed tickets/reservations;
- accessibility preferences;
- duration/walking constraints;
- language.

Return:

- itinerary proposal;
- reason codes;
- route/time estimates;
- stale/unknown facts;
- alternatives.

Proposal does not become user's itinerary until accepted.

### Journey Replan API — ADOPT

Inputs:

- current time/location supplied by user/partner;
- remaining fixed commitments;
- provider change/cancellation;
- skipped item.

Return a structured replan preserving future fixed constraints.

### Accessibility Verification API — ADOPT

Authorised institutions/partners may:

- fetch verified facts;
- submit candidate corrections;
- submit facility status;
- request re-verification;
- subscribe to change events.

Candidate corrections enter field/review workflow.

### Destination SDK — ADOPT

Embeddable modules:

- place card;
- verified accessibility card;
- mini itinerary;
- route/day planner;
- historical scene card;
- concierge replan action;
- guest handoff QR.

Partner UI must show source/freshness for current operational facts.

### Partner Sandbox — ADOPT

Synthetic city data and demo journeys for integration testing.

No live user itineraries or ticket QR data.

### Destination Certification / Data Freshness SLA — ADOPT

For premium partners define measurable service contracts:

- dataset version;
- freshness targets by data type;
- provider outage status;
- accessibility re-verification age;
- API uptime/support target.

This is product/service certification, not city/government accreditation.

### Usage Metering — ADAPT

Potential metered units:

- itinerary computations;
- concierge active guest;
- replan calls;
- accessibility data package;
- destination content feed.

### Additional acceptance

- current operational facts always identify source/freshness;
- partner cannot create a verified fact directly;
- fixed bookings cannot be silently moved;
- API output preserves unknown vs verified state;
- guest/private itinerary data remains partner/user-scoped;
- direct Moscow app and partner SDK use one canonical engine.

**Sequencing:** verified destination data + itinerary + accessibility + hotel workspace -> APIs -> SDK -> sandbox -> freshness/SLA -> metering.

**Commercial framing:** Moscow becomes destination operating infrastructure for hospitality, mobility, events and city partners, not only a consumer app.

