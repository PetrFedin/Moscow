# Romanov Chambers — metric authority

Status: **metric coordinate authority implemented / physical dimensions still provisional until survey**.

## What is authoritative now

The Romanov spatial pipeline has one versioned metric identity:

- authority: `romanov-metric-authority-v1`;
- model pack: `romanov-v1`;
- one model unit = one metre;
- research coordinates use `x / depth / height`;
- Viro runtime coordinates use `x / height / depth`.

Survey packets, field sessions, calibration profiles and persistent anchors are bound to this authority.

## Why the binding matters

A residual measurement is valid only for the exact model/metric authority that was tested. If the model pack or metric authority changes, previous sessions remain available for audit but no longer count toward the field matrix or verified portal release.

This prevents a green field result for an older geometry version from being silently reused after the model changes.

## Scale rule

Manual scale remains available while the production candidate is being aligned and investigated.

However, a field-verified calibration must stay within ±2% of scale 1.00.

If a larger scale correction is required, the model geometry must be corrected/rebuilt. A large calibration multiplier must not be used to disguise incorrect dimensions.

This ±2% value is an internal Moscow release tolerance, not a claim about surveying or AR platform accuracy.

## Verification invalidation

Changing X, Y, Z, yaw or scale invalidates any prior calibration verification.

Re-saving calibration binds it to the current metric authority but does not restore a previous `verifiedAt` value. Verification has to pass again through the measured survey + cross-device field gate.

## What is still not proven

This authority proves coordinate semantics and version integrity. It does **not** prove that the current production-candidate envelope has the correct physical dimensions.

That requires:

1. measured/verified facade control points;
2. reconciliation of the GLB geometry with the survey or verified measured drawing;
3. 5 / 10 / 15 m residual sessions;
4. the required iOS/Android device matrix;
5. independent persistent-anchor resolve.

Until those exist, the model remains a production candidate and the verified portal must stay locked.
