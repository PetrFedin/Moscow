# Romanov Chambers — measured AR alignment error

Status: **measurement authority implemented; no physical facade measurement has been claimed yet**.

## Why this exists

A typed number such as "12 cm" is not evidence of AR alignment accuracy.

The production gate now accepts a control-point residual only when it is derived from:

1. the verified model-space control point from an approved Romanov survey packet;
2. the exact saved calibration version;
3. an AR world-space hit on the real facade;
4. the AR camera world-space position at capture time;
5. the selected 5 / 10 / 15 m field bucket;
6. a release-grade hit type (DepthPoint, ExistingPlaneUsingExtent, or ExistingPlane);
7. the current metric authority and current facade control-point authority.

The scalar residual is calculated from the 3D Euclidean distance between the expected model point in AR world space and the observed facade hit.

## Field capture protocol

For each physical device and each distance bucket:

1. Load the approved survey packet.
2. Load/save the intended calibration. Saving creates a new calibration version.
3. Stand at the target distance.
4. Wait for AR tracking state TRACKING_NORMAL.
5. Select one registered facade control point.
6. Place the center reticle on the same physical architectural feature.
7. Capture the AR residual.
8. Repeat for all five points.
9. Save the measured session even if it fails the numeric threshold; failed evidence is still useful for audit and recalibration.
10. Repeat at 5, 10 and 15 m.

Any later calibration save creates a new version and makes earlier sessions ineligible for release.

## Current internal P0 acceptance threshold

- mean residual <= 35 cm;
- maximum residual <= 60 cm;
- five release-eligible measured control points per session;
- PASS at 5 / 10 / 15 m on each qualifying physical device;
- at least 2 iOS and 2 Android devices.

These thresholds are an internal product gate, not a general claim about ARKit, ARCore or surveying accuracy.

## Distance integrity

The recorded camera-to-hit distance must remain reasonably consistent with the selected field bucket:

- tolerance is 20% of the bucket;
- minimum tolerance is 1 m.

A 5 m session cannot therefore be recorded from an obviously different distance and still count toward release.

## What remains unproven

Code authority is not field proof.

The following still require a real Varvarka survey/test:

- physical XYZ/WGS84 coordinates for all five facade points;
- evidence reference for every measured point;
- survey approval;
- measured residual sessions on the required device matrix;
- recalibration based on observed errors;
- persistent-anchor hosting and independent resolve;
- verified portal;
- Quest/VR physical proof.