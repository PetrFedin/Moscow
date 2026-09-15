# Romanov P0 — field survey and persistent anchor release gate

Status: **production candidate / not field-certified**

This document defines the minimum evidence required before the Romanov Chambers scene can move from `production-candidate` to `field-verified spatial scene`.

## 1. Separation of concerns

Three independent technical gates must not be mixed:

1. **Map / navigation** — Yandex MapKit. Requires the project owner's MapKit API key.
2. **Metric AR alignment** — measured facade control points + local calibration + residual measurements.
3. **Persistent cross-device anchor** — a cloud-anchor provider configured only after the field matrix passes.

A valid MapKit key does **not** make the AR anchor persistent. A successful manual alignment does **not** make the scene cross-device persistent.

## 2. Five control points

The current five points are deliberately stored without measured coordinates until a survey or verified measured drawing supplies them:

1. left corner of the main masonry volume — alignment;
2. right corner of the main masonry volume — alignment;
3. stable facade window opening — alignment;
4. plinth / undercroft reference line — quality check;
5. stable roof reference edge — quality check.

For every point the field packet must contain:

- model XYZ in meters;
- WGS84 latitude / longitude and, when available, altitude;
- measurement method;
- declared horizontal accuracy;
- declared vertical accuracy;
- measurement date;
- responsible measurer;
- evidence reference (photo, drawing, survey file, or protocol);
- status `measured` or `verified`.

No approximate coordinates should be promoted into the production record.

## 3. Survey methods

The data model accepts:

- total station;
- GNSS RTK;
- laser-distance survey;
- photogrammetry;
- verified architectural drawing;
- other, with an explicit note.

The method is recorded rather than inferred. The app does not claim a survey accuracy that the instrument/operator has not provided.

## 4. Calibration pass

The AR operator calibrates X / Y / Z / yaw / scale against the measured geometry. The calibration profile remains local until it has passed the field matrix.

Current internal MVP residual gate:

- mean residual <= 35 cm;
- maximum residual <= 60 cm;
- all five control points must be scored.

These are internal pilot release thresholds, not generic ARKit/ARCore accuracy claims.

## 5. Cross-device field matrix

For **each physical test device**, record PASS at:

- 5 m;
- 10 m;
- 15 m.

The first P0 persistent-anchor gate requires:

- at least 2 distinct iOS devices with complete 5/10/15 m PASS matrices;
- at least 2 distinct Android devices with complete 5/10/15 m PASS matrices.

Each test session stores the physical device label, OS/platform, OS version, app build, calibration profile, per-control-point residuals, mean residual, max residual, and PASS/RECALIBRATE verdict.

## 6. Persistent anchor lifecycle

The code treats a persistent anchor as a versioned record:

`candidate -> hosted -> resolved -> verified -> retired`

A persistent anchor is not eligible to be hosted until all of the following are true:

- the cross-device field matrix passes;
- the calibration profile has `verifiedAt`;
- a supported cloud-anchor provider is explicitly configured.

A hosted anchor must later be resolved on another session/device and verified before it can be treated as the production anchor.

## 7. Provider configuration

The installed ViroReact line supports provider values:

- `none`;
- `arcore`;
- `reactvision`.

Current `app.json` intentionally keeps the provider set to `none` because no provider credentials have been supplied yet.

For the ReactVision backend the Expo plugin supports `rvApiKey` and `rvProjectId`. For ARCore the Viro plugin supports the ARCore provider path. Provider credentials/configuration should be supplied through build/deployment configuration and must not be committed as secrets into the repository.

Do not switch the provider merely to make the UI look complete. The provider should be enabled only for an actual host/resolve test after the field gate is green.

## 8. MapKit key

Yandex MapKit remains a separate owner-supplied dependency. The key should be provided through deployment/build configuration and never committed into Git.

Map readiness and spatial-anchor readiness must be shown as separate states in the product/admin diagnostics.

## 9. Release states

### `production-candidate`

Allowed while any of these remain incomplete:

- measured control-point packet;
- approved survey packet;
- complete cross-device field matrix;
- verified calibration;
- persistent anchor host/resolve verification.

### `field-verified spatial scene`

May be assigned only when:

- all five control points are measured and verified;
- the survey packet is approved;
- residual tests pass on the required device matrix;
- calibration is versioned and verified;
- the production anchor is hosted, resolved on an independent session/device, and verified;
- the public model remains restricted to `documented` and approved `reconstructed` geometry.

## 10. What the field team must bring back

The field visit is successful only if it returns with data, not just screenshots:

- completed five-point survey packet;
- evidence photo/reference for every point;
- one approved calibration profile;
- test sessions for each device and distance;
- exported TSV sessions;
- device/build inventory;
- anchor host result;
- anchor resolve result from an independent session/device;
- notes on lighting, occlusion, pedestrian traffic, vegetation, and any unstable facade features.

Only after this package exists should the Romanov scene be described externally as field verified.
