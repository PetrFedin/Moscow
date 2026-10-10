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

## Defensibility wave — Verified Destination Package Standard and contributor trust network

This wave turns Moscow's field-proven content, accessibility and itinerary data into a proprietary destination-data standard that partners can consume and verify.

### Destination Package Standard — ADOPT

Define a versioned package profile containing, where applicable:

- place/site identity;
- geo/entrance geometry;
- current operational source/freshness;
- verified accessibility facts;
- historical scenes/evidence;
- media rights;
- route/approach notes;
- field-verification state;
- provider/bookable references;
- safety/unknown fields;
- package version/hash.

A package can be partially complete; unknown remains unknown.

### Verification Levels — ADOPT

Possible dimensions:

- metadata verified;
- field visited;
- entrance verified;
- accessibility measured;
- historical evidence reviewed;
- booking/provider verified;
- media rights verified.

Do not collapse these into one "official" badge.

### Field Verifier Credential — ADOPT

Issue scoped credentials for trained/approved contributors:

- Field Verifier;
- Accessibility Verifier;
- Historical Content Reviewer;
- Partner Data Contributor.

Credential scope includes:

- allowed verification type;
- training/process version;
- issuer;
- issued/review date;
- status.

It is not a government licence.

### Contributor Trust Graph — ADOPT

Graph:

contributor/partner -> package -> submitted fact -> reviewed/accepted/rejected -> re-verification history

Useful dimensions:

- identity/organisation verified;
- accepted contribution count;
- correction rate;
- freshness;
- verification scope.

No public social ranking.

### Partner Venue Credential — CONDITIONAL

A venue may receive a narrow status such as:

- Moscow Data Integration Active;
- Accessibility Data Verified at date T;
- Booking Provider Verified;
- Destination Package Maintained.

This does not mean city/government endorsement.

### Package Verification API — ADOPT

Partners can verify:

- package version;
- verification dimensions;
- freshness;
- source classes;
- revoked/superseded state.

### Additional acceptance

- every verified dimension has evidence/source;
- expired/stale verification becomes visibly stale;
- contributor mistakes do not silently alter historical versions;
- venue credential wording cannot imply government certification;
- package remains useful with partial/unknown dimensions;
- contributor trust never exposes private user itinerary data.

**Sequencing:** Field Verification + Accessibility + Destination API -> package standard -> verifier credentials -> contributor graph -> venue/partner verification.

**Moat:** a field-verified, versioned destination dataset plus a contributor network is much harder to clone than a scraped city guide.



## Institutional adoption wave — Urban Destination Data Network

This wave turns Moscow's verified destination packages, itinerary engine and contributor trust layer into destination infrastructure for hotels, cultural institutions, restaurants, mobility providers, tour operators and city programmes.

### Moscow Destination Interchange Specification — ADOPT

Define a versioned profile for:

- place/venue identity;
- entrance/geo geometry;
- operating-state source/freshness;
- accessibility facts;
- event/session;
- booking/provider reference;
- media rights;
- field-verification state;
- historical/cultural evidence references;
- temporary closure/change;
- supersession/withdrawal.

Unknown remains an explicit valid state.

### Reference District Dataset — ADOPT

Publish a synthetic/public reference district demonstrating:

`place -> verified entrance -> opening state -> accessibility -> event -> booking -> itinerary insertion -> visit evidence -> stale/reverify cycle`

### Venue / Institution Self-service Publishing — ADOPT

Approved organisations may maintain scoped data:

- venue facts;
- operating hours;
- accessibility updates;
- event/programme feed;
- booking endpoint/reference;
- entrances;
- temporary closures;
- media.

Self-published fields remain distinguished from field-verified and third-party verified facts.

### Approved Destination Partner Network — ADOPT

Participant classes:

- museums/theatres;
- restaurants/bars;
- hotels;
- mobility providers;
- attractions;
- tour operators;
- event operators;
- accessibility organisations;
- destination-content integrators.

Qualification is integration/process specific, not a quality endorsement.

### Hospitality / Concierge Embedded Distribution — ADOPT

Offer Moscow through:

- hotel concierge portal;
- white-label itinerary widget;
- API/SDK;
- QR/deep-link itinerary handoff;
- corporate/event guest portal.

All channels use the same canonical itinerary/booking truth.

### Visit Evidence / Personal Travel Ledger — ADOPT

With user consent, preserve:

- planned;
- booked;
- ticketed;
- visited;
- skipped;
- rescheduled;
- rated/saved privately.

This creates continuity across visits without exposing personal travel history to venues by default.

### Destination Demand Intelligence — CONDITIONAL

With privacy-safe aggregation, derive:

- search/demand gaps;
- itinerary inclusion;
- booking conversion;
- day/time pressure;
- district demand;
- accessibility demand;
- unserved route/availability patterns.

Do not expose identifiable individual movement history.

### City / District Institutional Publishing — CONDITIONAL

Approved public/civic programmes may publish:

- verified programme/event feeds;
- route closures;
- district campaigns;
- public-space changes;
- temporary access information.

Government status must be source-attributed; Moscow must not imply official endorsement where none exists.

### Enterprise Bundles — ADOPT

Potential packages:

- Destination API;
- Hospitality Concierge;
- Verified Venue Data;
- Accessibility Layer;
- Event/Booking Integration;
- Demand Intelligence;
- District/City Partner Console.

### Legitimate Switching Cost — ADOPT

Compounding assets:

- verified entrance/accessibility history;
- venue change history;
- contributor network;
- provider connectors;
- user-consented travel ledger;
- itinerary execution data;
- institutional feeds.

### Additional acceptance

- venue self-service cannot mark itself field-verified;
- stale operational data visibly degrades;
- user visit history is private by default;
- fixed booking constraints remain authoritative in replanning;
- institutional sources and platform verification remain distinct;
- all embedded channels use the same canonical engine.

**Sequencing:** Destination Package Standard -> reference dataset -> venue publishing -> partner network -> embedded hospitality distribution -> demand intelligence -> institutional feeds.

**Moat:** Moscow becomes a continuously maintained destination graph and itinerary execution rail, not a static tourist guide.


## Product reset — Moscow City OS / citywide journey authority

**Decision:** the project is not scoped around Varvarka, Romanov Chambers or Old English Court. Those assets remain a bounded heritage / spatial-verification lane only.

The primary product is a citywide operating system for a visitor who can plan and execute any Moscow day or multi-day trip across:

- restaurants, cafes, bars and nightlife;
- theatres, cinemas, concerts and performances;
- museums, galleries and exhibitions;
- historical places, landmarks and architecture;
- parks, viewpoints and walks;
- shopping and markets;
- family / kids activities;
- sport and wellness;
- events and temporary programmes;
- hotels / stay context;
- transport and transfer constraints.

### Citywide Discovery Graph — ADOPT / IMPLEMENTING

A canonical Moscow experience node must not require heritage/spatial proof to exist.

Common node authority now supports broad city kinds and optional planning metadata:

- district;
- address;
- venue / parent venue;
- indoor / outdoor / mixed;
- price band;
- audience;
- tags;
- booking handoff when available.

Heritage-specific fields remain optional and apply only where relevant.

### Citywide planning entry — ADOPT / IMPLEMENTING

The primary Discover CTA becomes:

`Discover Moscow -> choose interests -> build day / trip -> preserve tickets and reservations -> execute -> record visits -> replan`

The historic walk is retained as a secondary experience, not the product home.

### Planning intent categories

The city planner supports at least:

- Culture: museum / gallery / exhibition / theatre / cinema / concert;
- History: heritage / historical site / landmark;
- Food: restaurant / cafe / bar / market;
- Night: bar / nightlife / concert / event;
- Events: event / concert / exhibition / theatre;
- Parks: park / nature / activity / viewpoint;
- Shopping: shopping / market;
- Family;
- Wellness / sport;
- Views / scenic places.

These are intent filters, not claims of live availability.

### Multi-day city journey

The existing Personal Trip authority remains the main execution ledger:

`planned -> ticketed/reserved -> confirmed -> completed/skipped/cancelled -> visit ledger`

A user may:

- start from a blank day;
- add a place manually;
- import an already purchased ticket/reservation;
- add source-backed places;
- fix hard commitments;
- leave flexible windows;
- move items between days;
- record where they actually went;
- ask for alternatives when plans change.

### Live truth boundary

City scale must not fabricate:

- opening hours;
- sold-out / available state;
- table availability;
- ticket inventory;
- event cancellation;
- price;
- travel time;
- accessibility.

Those fields must remain source/version/freshness-bound and degrade to unknown when evidence is absent.

### Heritage lane boundary

Romanov / Old English Court / spatial Phase 0 remain useful for:

- historical evidence;
- 3D / AR;
- field calibration;
- spatial verification;
- heritage publication standard.

They **must not** gate:

- restaurant planning;
- theatre / museum planning;
- exhibitions;
- city events;
- trip calendar;
- booking imports;
- manual tickets/reservations;
- visit history;
- general city discovery.

### Near-term citywide sequence

1. Citywide Experience taxonomy + filters.
2. Discover home centred on city planning, not Varvarka.
3. District / category / time / price / audience filters.
4. Real provider/source ingestion for places, events, restaurants and tickets.
5. Day Composer: fixed vs flexible.
6. Route/travel-time authority across the city.
7. Opening-hours / live-status authority.
8. Reservation / ticket handoff and verified receipt where supported.
9. Personal Visit Ledger and "what have I already seen?" logic.
10. What-next engine using free time, current district, interests and unseen places.
11. Multi-day optimizer.
12. Hotel / concierge and partner distribution on the same city graph.

**Product framing:** Moscow is a complete personal city operating system. Heritage is one differentiated content layer inside it, not the perimeter of the product.


## Day Composer v2 — IMPLEMENTING

Day Composer becomes the primary projection of one trip day. It does **not** create a parallel itinerary store.

Authority chain:

`PersonalTrip -> TripScheduler -> PersonalTripReplan -> Day Composer projection`

### Projection states

For each day expose, from existing truth only:

- fixed / flexible;
- ticketed / reserved / none;
- provider-confirmed / user-declared / none;
- planned / completed / skipped / cancelled;
- free windows;
- fixed-time conflicts;
- alternative-eligible slots.

### Timeline rule

One ordered timeline combines:

`scheduled items + free windows + conflicts`

The timeline is a projection. It must not mutate the trip by itself.

### Quick Add

Primary add intents:

- Place;
- Restaurant;
- Ticket;
- Reservation;
- Event.

These intents reuse the existing PersonalTrip mutation path. User-entered tickets and reservations remain `user-declared` until real provider receipt evidence exists.

### Alternative slots

A free window can become an alternative slot, but schedule-only evidence may assert only the time window.

Until authoritative sources exist, alternative slots must keep:

- routingVerified=false;
- openingHoursVerified=false;
- availabilityVerified=false;
- accessibilityVerified=false.

### Acceptance

- no duplicate trip/day store;
- fixed commitments derive from confirmed ticket/reservation intervals;
- conflict state derives from TripScheduler;
- free windows derive from TripScheduler and trip preferences;
- Day Composer cannot upgrade provider truth;
- moving/replanning remains governed by existing scheduler/replan authorities;
- browser E2E proves Day Composer is visible in the normal My Trip flow.

**Sequencing:** Day Composer projection -> timeline UI -> Quick Add -> alternative slots -> contract tests -> browser E2E -> citywide routing authority.


## Citywide Routing Authority v1 — IMPLEMENTING

Routing is an external truth-layer for Day Composer. It does not write travel duration into PersonalTrip.

Authority chain:

`routing provider observation -> freshness validation -> route projection -> feasibility decision -> Day Composer travel edge`

### Observation contract

Each route observation binds:

- from endpoint;
- to endpoint;
- travel mode;
- duration;
- optional distance;
- provider;
- source URL;
- observedAt;
- validFrom when applicable;
- expiresAt.

Supported modes:

- walk;
- transit;
- car;
- taxi;
- mixed.

### Feasibility states

For the time window between two scheduled trip items:

- SAFE — verified route fits with configured buffer;
- TIGHT — verified route fits but buffer is below the safe threshold;
- IMPOSSIBLE — verified route duration exceeds the available window;
- UNKNOWN — no fresh route evidence exists.

UNKNOWN is mandatory when routing evidence is absent, stale or not yet valid.

### Day Composer integration

Travel appears as a projection entry between consecutive scheduled items:

`item A -> travel edge -> item B`

The travel edge may show:

- mode;
- verified duration;
- available window;
- remaining buffer;
- source-backed feasibility.

PersonalTrip remains free of provider-derived travel-time fields.

### Acceptance

- stale route observations cannot remain verified;
- missing route evidence cannot produce estimated travel duration;
- route feasibility is deterministic from the observed duration and schedule window;
- Day Composer exposes UNKNOWN when no fresh route exists;
- route data remains replaceable by another provider without changing PersonalTrip;
- routing does not imply opening-hours, booking availability or accessibility truth.

**Sequencing:** routing authority -> Day Composer travel projection -> provider adapter -> real Moscow route calls -> browser E2E -> Live City Truth.


## Valhalla Routing Provider Adapter v1 — IMPLEMENTING

Valhalla is the first admitted routing provider for walking-route evidence.

### Role

Valhalla provides route observations only. It does not own:

- PersonalTrip;
- Day Composer ordering;
- user priorities;
- booking state;
- destination catalogue;
- final navigation UI.

Yandex MapKit remains the primary renderer/navigation handoff. OpenTripPlanner remains a conditional future multimodal sidecar.

### Admission

Valhalla is admitted through the common provider authority with:

- provider kind: routing;
- capability: routing;
- credential mode: public-api or credentialed API where applicable;
- route duration schema path;
- route distance schema path;
- capability/schema evidence references.

### Adapter contract

The v1 adapter is walking-only:

`from + to -> pedestrian route request -> raw provider response -> SHA-256 -> normalized CitywideRouteObservation`

The normalized observation records:

- from/to coordinates and canonical IDs;
- mode=walk;
- durationMinutes;
- distanceMeters;
- fetched/observed time;
- expiry;
- source URL;
- provider identity.

The provider response remains external evidence; travel time is not written into PersonalTrip.

### Real route smoke

A manual/runtime smoke command is available:

`npm run routing:valhalla-smoke`

Required:

`VALHALLA_URL=https://<authorised-or-approved-instance>`

Optional route overrides:

- ROUTE_FROM_ID / ROUTE_FROM_LAT / ROUTE_FROM_LON;
- ROUTE_TO_ID / ROUTE_TO_LAT / ROUTE_TO_LON;
- ROUTING_EVIDENCE_OUT.

Default smoke coordinates are Moscow city points used only as request defaults. A smoke PASS requires a real HTTP response from the configured Valhalla instance.

### Evidence

The smoke runner records:

- request body;
- raw response;
- rawResponseSha256;
- provider admission;
- admission result;
- normalized routing feed.

Fixture/unit tests do not count as a real provider route PASS.

### Acceptance

- public API is not mislabeled as public-feed;
- failed provider responses fail closed;
- unsupported units fail closed;
- missing duration fails closed;
- normalized walking duration rounds provider seconds up to whole minutes;
- distance is normalized to meters;
- a real route PASS requires a configured HTTPS provider endpoint;
- no real-provider claim is made from fixtures.

**Sequencing:** adapter contract -> exact-head quality -> real Valhalla smoke -> evidence archive -> Day Composer real travel edge -> browser E2E -> Live City Truth.


## Routing Evidence Replay v1 — IMPLEMENTING

The first real Valhalla smoke is preserved as historical routing evidence and may be replayed inside Day Composer without being promoted to current live truth.

### Real evidence anchor

Source:

`evidence/routing/valhalla-real-smoke-2026-10-08.json`

Observed route:

`pushkin-museum -> bolshoi-theatre`

Measured provider result:

- mode: walk;
- provider time: 1448.271 seconds;
- normalized duration: 25 minutes;
- distance: 1813 metres;
- raw response SHA-256: `4a4a7dbaf85bf4446a59788dd2c74e7db05384c934f3dd6c49409f677e53ef90`.

### Replay boundary

Historical replay is allowed only when:

- trip id explicitly uses the `routing-evidence-replay:` namespace;
- canonical routing endpoint IDs match the evidence pair;
- Day Composer receives the historical projection and explicit replay context.

The same observation projected after its expiry must degrade to `stale` and cannot provide current travel duration.

### UI semantics

Historical replay must render:

- source-backed route duration;
- mode;
- feasibility against the demo schedule;
- provider name and observed timestamp;
- explicit `EVIDENCE REPLAY · SOURCE-BACKED · NOT LIVE` disclosure.

No replay value may be presented as current live navigation.

### Acceptance

- normal PersonalTrip flows do not receive replay evidence implicitly;
- evidence replay does not create another itinerary store;
- route source metadata reaches the Day Composer travel entry;
- browser E2E proves the source-backed travel edge;
- expiry test proves the same evidence becomes unusable as current truth.

**Sequencing:** evidence replay -> browser E2E -> merge -> Live City Truth authority -> first real live city source.


## Live City Truth Authority v1 — IMPLEMENTING

The existing Live Destination authority becomes the canonical citywide source for current operational truth.

### Truth dimensions

For source-backed city entities expose:

- provider/source identity;
- observedAt;
- validFrom when applicable;
- expiresAt;
- freshness: fresh / stale / not-yet-valid;
- operational status;
- opening-hours state;
- event schedule/status;
- booking handoff when independently authorised.

### Opening-hours authority

Providers must explicitly declare the `opening-hours` capability.

Opening hours are represented as bounded absolute time windows in `Europe/Moscow`:

`opensAt -> closesAt`

Projection produces:

- OPEN;
- CLOSED;
- UNKNOWN;
- optional nextOpeningChangeAt.

Stale or not-yet-valid evidence always degrades opening state to UNKNOWN.

### Canonical overlay rule

A live source may attach to an existing destination node through `canonicalDestinationNodeId`.

This avoids duplicating geometry merely to publish current hours/status.

A live entity without a canonical target must provide its own valid geometry.

### Citywide status semantics

The live authority now supports citywide kinds including:

- museum / gallery / exhibition;
- theatre / cinema / concert;
- restaurant / cafe / bar / nightlife;
- park / market / shopping;
- sport / wellness / kids;
- landmarks and other city experiences.

Status sets remain bounded by kind.

### Day Composer

Live truth is projection metadata only.

`PersonalTrip -> Day Composer + live projection`

An item may display:

- freshness;
- operationalStatus;
- openingState;
- next opening change;
- provider/source;
- journeyEligible.

No live truth is written back into PersonalTrip.

### First real live source

The first source adapter targets the official New Tretyakov page:

`https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/`

Pipeline:

`real HTTPS GET -> raw HTML -> SHA-256 -> LiveProviderSnapshot -> official adapter -> LiveDestinationFeed -> projection`

The source page supplies official opening-hours/current-status truth only. Geometry is not attributed to that page unless separately sourced.

### Evidence discipline

The real-source smoke stores:

- raw HTML;
- SHA-256;
- snapshot metadata;
- ingestion record;
- normalized feed;
- projection state.

Fixture tests do not count as a real live-source PASS.

### Acceptance

- stale source cannot remain OPEN/CLOSED;
- opening hours require explicit provider capability;
- malformed or changed source structure fails closed;
- canonical overlays do not require duplicate geometry;
- Day Composer remains a projection;
- a real source PASS requires a real HTTPS fetch and archived evidence.

**Sequencing:** authority -> opening-hours -> Day Composer projection -> real Tretyakov smoke -> evidence archive -> browser E2E -> next live event/status source.


## Live Event / Programme Status Source v1 — IMPLEMENTING

The second real Live City source targets the official Tretyakov Gallery exhibition programme.

Source:

`https://www.tretyakovgallery.ru/exhibitions/`

### Programme status contract

Status must come from explicit source markers, not from inferred dates.

Supported mappings:

- `Отменено` -> cancelled;
- `Архив` -> finished;
- `Сроки проведения изменены` on an active programme card -> rescheduled;
- `Уже идет` / `Скоро будет` / `Скоро закончится` -> scheduled;
- no recognised marker -> unknown / fail closed.

Dates remain programme-window evidence but do not override explicit source status.

### First real target programme

`Алексей Боголюбов. От Невы до Босфора`

Official server-rendered page evidence exposes:

- explicit active programme marker `Уже идет`;
- programme window `29 September 2026 -> 6 June 2027`;
- Tretyakov Gallery venue marker.

The normalized real-source entity is an exhibition with operationalStatus=`scheduled`.

The parser contract also supports explicit `cancelled`, `rescheduled` and `finished` markers, but those states are not claimed as real-provider proof until a server-fetchable official source exposes them.

### Real source pipeline

`HTTPS GET -> raw HTML -> SHA-256 -> LiveProviderSnapshot -> programme adapter -> LiveDestinationFeed -> projection`

### Evidence discipline

The one-shot smoke stores:

- raw programme HTML;
- SHA-256;
- snapshot metadata;
- ingestion record;
- normalized programme entity;
- projected freshness/status/window.

Fixture tests cover all supported statuses but do not count as real-source proof.

### Acceptance

- explicit marker is required;
- cancelled / finished / rescheduled / scheduled remain bounded source statuses;
- stale programme evidence becomes UNKNOWN;
- programme dates cannot manufacture a status;
- Day Composer consumes the source-backed programme projection without mutating PersonalTrip;
- real-source PASS requires archived HTTPS evidence.

**Sequencing:** programme adapter -> real smoke -> evidence archive -> Day Composer source-backed event -> browser E2E -> current live refresh runtime.


## Current Live Refresh Runtime v1 — IMPLEMENTING

This layer turns the already proven real provider sources into rotating current city truth.

### Authority reuse

Do not create a second journey runtime.

Reuse:

- `LiveProviderRefreshPolicy` and snapshot ingestion;
- `mergeLiveDestinationFeeds`;
- `projectLiveDestinationFeed`;
- `DestinationJourneyRuntime`;
- existing Personal Trip / Day Composer projection.

Runtime chain:

`scheduled provider refresh -> raw snapshot + SHA-256 -> provider ingestion -> merged live feed -> current projection -> Day Composer -> disruption -> existing Journey Runtime replan-required`

### Current providers in v1

- Tretyakov New Gallery official venue/opening-hours source;
- Tretyakov official programme/exhibition source.

Both sources are refreshed independently and retain their own snapshot IDs, fetch times and SHA-256 evidence.

### Refresh cadence

The first worker cadence is every 20 minutes.

Reason:

- current entity expiry is 30 minutes;
- expected provider refresh is 15 minutes;
- 20 minutes avoids unnecessary high-frequency traffic while remaining inside the current truth window under normal scheduling.

GitHub scheduled execution is an operational proof/runtime worker, not the final production publication transport.

### Current snapshot contract

The worker writes a current snapshot containing:

- destination ID;
- refreshedAt;
- source snapshot metadata;
- ingestion records;
- merged live feed;
- current projection;
- detected disruptions.

The full raw HTML snapshots remain evidence artifacts.

### Publication boundary

The client consumes a configured HTTPS snapshot URL through:

`EXPO_PUBLIC_LIVE_CITY_SNAPSHOT_URL`

The repository does not hard-code GitHub artifacts or raw GitHub URLs as production runtime dependencies.

A publication service may later be Render, Netlify, Supabase or another approved HTTPS endpoint without changing Day Composer authority.

If no current snapshot endpoint is configured, live truth remains absent rather than fabricated.

### Client freshness rotation

The client must not trust a stored projection indefinitely.

It validates the merged feed and re-projects it against the current clock.

Therefore:

`last successful snapshot + current time -> fresh / stale / unknown`

If network refresh fails, the previous snapshot may remain cached only as source material. Once entity expiry is crossed, OPEN/SCHEDULED automatically degrades to UNKNOWN.

### Day Composer

Normal Personal Trip flows may consume the current live projection.

Explicit historical replay namespaces retain priority for evidence-demo scenarios.

Current live truth remains projection metadata and never mutates PersonalTrip.

### Disruption detection

The current refresh runtime emits source-bound disruptions for:

- closed / temporarily closed -> closed;
- cancelled;
- rescheduled;
- stale.

Each disruption carries provider identity, entity identity and an evidence reference derived from the provider snapshot ID + payload SHA-256.

### Journey Runtime bridge

Matching live-destination blocks are invalidated through the existing `provider-invalidated` event.

Flow:

`live source change -> disruption -> provider-invalidated -> block blocked -> replan-required`

Completed/resolved blocks retain their historical outcome and are not rewritten.

`rescheduled` is now an explicit provider invalidation reason.

### Fail-closed rules

- no source snapshot -> no live claim;
- invalid source payload -> refresh failure, not synthetic fallback;
- expired provider snapshot -> reject ingestion;
- expired entity truth -> stale / UNKNOWN;
- missing publication endpoint -> no current live projection;
- GitHub artifact alone is not production current-state delivery;
- refresh runtime cannot silently move fixed Personal Trip commitments.

### Acceptance

- two real Tretyakov sources refresh in one cycle;
- raw provider payload SHA-256 values are recorded independently;
- merged feed validates before projection;
- current snapshot can be loaded through a replaceable HTTPS endpoint;
- client freshness rotates locally even during publication/network failure;
- Day Composer receives current live truth only from validated snapshot data;
- closed/cancelled/rescheduled/stale can drive the existing Journey Runtime to `replan-required`;
- fixed commitments remain preserved until an explicit accepted replan.

**Sequencing:** real two-source refresh proof -> exact-head quality -> merge -> production current snapshot publication endpoint -> Day Composer current live browser proof -> disruption/replan UX -> verified replacement plan.


## Production Current Snapshot Publication Endpoint v1 — IMPLEMENTING

The current live snapshot must be served from a production-capable HTTPS authority, not from GitHub Actions artifacts.

### Deployment contour

The first production contour is a dedicated Render Node service from the Moscow repository:

`moscow-live-city-authority`

Endpoints:

- `GET /health`
- `GET /ready`
- `GET /live-city/current.json`

The service is intentionally separate from the Expo web renderer and from the YCLIENTS evidence receiver.

### Refresh ownership

The publication service refreshes the same two admitted real sources:

- official New Tretyakov venue/opening-hours source;
- official Tretyakov programme source.

On startup and every 20 minutes:

`source fetch -> SHA-256 -> ingestion -> merge -> current snapshot`

The service retains the last successful snapshot only as source material.

Refresh failure cannot manufacture a new snapshot or change source checksums.

### Readiness

`/health` proves process availability only.

`/ready` re-projects the retained merged feed against the current clock.

It returns ready only while at least one source-backed entity is still fresh.

Therefore an old in-memory snapshot cannot keep the service falsely READY after live truth expires.

### Current JSON

`/live-city/current.json` returns the current snapshot contract:

- schema version;
- destination;
- refreshedAt;
- source snapshot identities and checksums;
- merged feed;
- disruption list.

The client does not trust a serialized projection from the server. It re-projects `mergedFeed` locally against its own current clock.

### Client configuration

Primary build-time config:

`EXPO_PUBLIC_LIVE_CITY_SNAPSHOT_URL`

Optional runtime override:

`globalThis.__MOSCOW_LIVE_CITY_SNAPSHOT_URL__`

The runtime override exists for replaceable deployment configuration and deterministic browser QA. It is subject to the same HTTPS validation as the build-time URL.

### Browser acceptance

A normal PersonalTrip without any replay namespace must be able to consume a current snapshot and render:

`LIVE · FRESH · OPEN`

The browser proof must contain no:

- `EVIDENCE REPLAY`;
- `NOT CURRENT`.

### Fail-closed rules

- publication endpoint must use HTTPS in the client;
- no current snapshot -> endpoint returns 503;
- stale retained truth -> `/ready` returns 503;
- malformed snapshot -> client rejects it;
- current source truth never mutates PersonalTrip;
- historical replay remains a separate explicit namespace;
- Render service URL is configuration, not domain authority.

**Sequencing:** endpoint code -> exact-head quality -> merge -> create Render service -> /health + /ready + current.json live proof -> configure moscow-mobile-preview env -> redeploy exact main -> browser current-truth proof -> disruption UX -> verified replacement plan.


## Render quota fallback — co-located publication v1

Render Hobby workspace is currently at the 25-service limit, so a new dedicated `moscow-live-city-authority` service cannot be created through the active workspace.

### Temporary deployment contour

Until a slot is available, `moscow-mobile-preview` may co-locate:

- Expo web static assets;
- `/health`;
- `/ready`;
- `/live-city/current.json`.

The existing Render start command remains `npm run serve:web`.

The repository changes `serve:web` to run the live-city publication process with static `dist` serving enabled.

This is an operational quota fallback only. The authority contract remains separate and replaceable.

### Client URL

The current snapshot endpoint becomes:

`https://moscow-mobile-preview.onrender.com/live-city/current.json`

and is provided to the Expo build through:

`EXPO_PUBLIC_LIVE_CITY_SNAPSHOT_URL`.

### Exit criterion

When one Render service slot becomes available, restore the target topology:

`moscow-mobile-preview -> UI only`

`moscow-live-city-authority -> live current truth only`

without changing Day Composer or the current snapshot contract.


## Live Disruption -> Replan Required v1 — IMPLEMENTING

Production current truth is already admitted through the two-source OIDC publication contour and ordinary Day Composer browser proof.

This layer converts a current source-backed invalidation into a user-visible operational state without silently rewriting PersonalTrip.

Authority chain:

`published current live truth -> Day Composer item -> disruption case -> existing Journey Runtime provider-invalidated -> replan-required`

Rules:

- only planned items with a canonical destination node and scheduled interval can enter this disruption surface;
- current `closed`, `cancelled`, `rescheduled` or stale truth creates a disruption case;
- the affected item is bound to provider name, source URL, observation timestamp and evidence reference;
- existing Journey Runtime owns the `replan-required` state; this layer does not invent a second runtime;
- unrelated fixed tickets/reservations are projected as immutable commitments that the next replacement proposal must preserve exactly;
- no automatic mutation of PersonalTrip occurs at disruption detection time;
- no replacement is presented as executable until source-backed candidate truth and route feasibility are available;
- user acceptance remains mandatory before any replacement plan changes PersonalTrip.

Browser acceptance for this layer:

`current live closed/rescheduled -> LIVE DISRUPTION -> REPLAN REQUIRED -> affected item -> source -> fixed commitment unchanged`

Next strict transition:

`disruption detection PASS -> source-backed replacement candidates -> route feasibility around fixed commitments -> explicit acceptance -> continuation`.


## Source-backed Replacement Proposal v1 — IMPLEMENTING

This layer starts only after a current live disruption has already entered the existing Journey Runtime as `replan-required`.

Authority chain:

`replan-required -> fresh live candidate -> routing feasibility -> executable proposal -> explicit acceptance -> PersonalTrip replacement`

### Candidate admission

A replacement candidate must:

- come from the current live destination projection;
- be fresh and `journeyEligible=true`;
- have a canonical destination node;
- differ from the affected destination node;
- not already exist as another planned destination in the same day;
- belong to the same experience family as the affected item.

No generative or unsourced alternative is admitted.

### Routing feasibility

The candidate retains the affected item's user-allocated time block.

Required route legs are checked around that block:

- previous scheduled destination -> replacement candidate;
- replacement candidate -> next fixed commitment.

Routing uses the existing Citywide Routing Authority.

Admission states:

- `executable` — all required route legs have fresh verified observations and fit the available windows;
- `routing-unverified` — source-backed candidate exists, but at least one required route leg has no verified current observation;
- `routing-impossible` — a fresh verified route exceeds the available time window.

`tight` remains executable because the verified route still fits, but the UI must expose the tight status and buffer.

### Fixed commitment discipline

Unrelated fixed tickets/reservations remain exact.

Before acceptance, the authority re-checks:

- item identity;
- scheduled start/end;
- confirmed commitment;
- verification mode.

If any preserved fixed commitment changed, acceptance fails.

If the affected item itself is fixed or carries a commitment, this v1 flow is blocked. It requires a separate cancellation/reschedule handling flow instead of silent replacement.

### Explicit acceptance

A proposal may mutate PersonalTrip only when:

- admission is `executable`;
- routing is verified where required;
- PersonalTrip `updatedAt` still matches the disruption/proposal baseline;
- the affected item still matches the disrupted destination and interval;
- fixed commitments remain unchanged.

Acceptance changes only the affected item:

- title;
- kind;
- source -> provider;
- destinationNodeId.

The original user-allocated time block remains unchanged.

The authority emits an acceptance receipt with:

- proposal/disruption IDs;
- source evidence reference;
- route observation IDs;
- before/after affected item state;
- proof that fixed commitments were preserved.

### UI behavior

The replacement card distinguishes:

- `SOURCE + ROUTE / EXECUTABLE`;
- `SOURCE ONLY / ROUTING UNVERIFIED`;
- `ROUTING IMPOSSIBLE`.

The **Accept replacement** action is rendered only for executable proposals.

Browser acceptance must prove that a source-backed candidate without route evidence stays visible but cannot be accepted.

### Current production boundary

The live-city publication contour already supplies current destination truth.

A replaceable current routing projection is still required before production disruptions with fixed commitments can become executable replacements automatically.

Until then, production replacement UI must fail closed at `ROUTING UNVERIFIED`.

**Next strict transition:** replacement authority PASS -> current routing publication/loader -> executable browser acceptance -> continuation.
