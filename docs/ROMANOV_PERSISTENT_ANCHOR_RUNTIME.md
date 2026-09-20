# Romanov Chambers — persistent anchor field runtime

Status: **runtime host/resolve authority implemented in code; no real cloud anchor or physical cross-device resolve has been claimed**.

## Spatial rule

AR world coordinates are session-local. They must never be copied from one phone to another or trusted after a new AR session starts.

The shared authorities are:

- the current Romanov model pack and metric authority;
- the approved facade control-point survey;
- measured field evidence tied to that survey;
- a provider cloud-anchor location frame after hosting.

Each physical phone creates its own local AR anchor and its own session-local calibration.

## Field campaign

1. On the authority device, complete and approve the five-point facade survey.
2. Export the approved survey campaign from **Evidence**.
3. Import that exact survey campaign on every test phone.
4. On each phone, create a new local AR anchor for the current session.
5. Align the model and save calibration. The save binds the calibration to that local anchor and increments its local version.
6. Capture all five measured facade residuals at 5 m, 10 m and 15 m without changing calibration between those three sessions.
7. Export the measured session bundle for that physical device.
8. Import all device bundles on the authority device.
9. The matrix passes only when the same survey has a complete 5/10/15 set on at least:
   - 2 physical iOS devices;
   - 2 physical Android devices.

Different devices are expected to have different AR world XYZ values and may have different local calibration version numbers.

A single physical device cannot combine 5/10/15 measurements from different local calibration placements, even when two placements happen to share the same local version number.

## Calibration verification

The calibration that will be hosted must itself be one of the measured placements in the cross-device matrix. A green matrix cannot be used to bless a new, unmeasured manual alignment.

Recommended ordering:

1. Import the completed bundles from the other field devices onto the authority/hosting device.
2. On the authority/hosting device, create the local AR anchor that will be hosted.
3. Save one session-local calibration against that anchor.
4. Without changing calibration or restarting the AR session, capture the complete five-point measured set at 5 m, 10 m and 15 m.
5. Save those three PASS sessions under the same physical-device label.
6. Once this placement also completes the required 2 iOS + 2 Android matrix, open **Anchor**.
7. Promote this exact measured placement to verified.
8. Host the cloud anchor from the same still-active local AR session.

Verification is blocked if:

- the calibration is not bound to the current local AR anchor;
- the current physical-device label/platform does not own the measured placement;
- any of 5/10/15 m is missing for this exact placement;
- the overall 2 iOS + 2 Android matrix is incomplete.

A fresh calibration created after the field matrix passes does **not** inherit verification. Persisted pre-cloud calibration coordinates after a restart are only draft parameters and are not treated as a current physical placement.

## Native provider build

Regular builds stay fail-closed with:

`EXPO_PUBLIC_SPATIAL_ANCHOR_PROVIDER=none`

A field build can use either:

### ReactVision

- `EXPO_PUBLIC_SPATIAL_ANCHOR_PROVIDER=reactvision`
- `VIRO_RV_API_KEY`
- `VIRO_RV_PROJECT_ID`
- optional `VIRO_RV_ENDPOINT`

### ARCore

- `EXPO_PUBLIC_SPATIAL_ANCHOR_PROVIDER=arcore`
- `VIRO_GOOGLE_CLOUD_API_KEY`

TTL is controlled by:

`EXPO_PUBLIC_SPATIAL_ANCHOR_TTL_DAYS`

The app clamps TTL to 1..365 days. Provider/account limits still apply.

## Host → continuity → independent resolve

1. With a verified current-session calibration, host the current local AR anchor.
2. The provider returns a cloud anchor id.
3. The model is stored in the cloud-anchor **location frame**, not in the first phone's AR world XYZ.
4. The hosting device resolves/localizes the same cloud anchor.
5. Host continuity must pass both internal P0 thresholds:
   - position residual <= 35 cm;
   - orientation residual <= 2 degrees.
6. Export the versioned persistent-anchor proof package.
7. Import it on a different physical field device built with the same provider.
8. The AR scene localizes the cloud anchor and renders the model in the same anchor-relative frame.
9. Resolve on the hosting device itself does not count as independent verification.
10. After successful resolve on a different device, the proof becomes `verified`.
11. Export the verified proof back to the authority device and import it there.
12. Only then can the Romanov release gate consider persistent-anchor proof complete.

## Portal authority

The portal is a child of the same Romanov model / cloud-anchor frame.

The production release gate remains closed unless all of the following are true:

- approved survey;
- cross-device measured field matrix;
- verified current metric scale;
- verified host-frame continuity;
- independent persistent-anchor resolve;
- verified persistent-anchor proof.

The interior behind the portal remains a demo layer until separately historically verified.

## Integrity limitations

The field-campaign, field-session and persistent-anchor JSON packages are versioned and recalculated on import.

They reject, among other things:

- mixed surveys;
- mixed local calibration placements within one device bundle, including same-version geometry collisions;
- mixed physical device labels;
- duplicate facade control points;
- stale model/metric authority;
- tampered mean/max residual calculations;
- non-independent anchor self-verification.

They are **not** cryptographically signed and are **not** hardware-backed attestation. A person with file-edit access can still construct a synthetic JSON document. For a production external audit, add signed evidence envelopes / device attestation as a separate authority layer.

## Still unproven physically

No code change can close these items by itself:

- actual Varvarka XYZ/WGS84 facade survey;
- 12 measured 5/10/15 sessions across the 4-device minimum matrix;
- a real provider cloud anchor id;
- host continuity measurements outdoors;
- independent resolve on another physical device;
- portal walk-through field QA;
- Quest physical QA.

Until those exist, project status remains **production candidate**, not field-verified.
