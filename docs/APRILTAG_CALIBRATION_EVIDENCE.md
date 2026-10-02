# AprilTag-assisted Calibration Evidence

Canonical source: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` → Additional wave — anchor calibration, temporal scenes and accessibility routing.

Issue: #96.

## Scope

Phase 1 adds an evidence and validation contract only.

It does **not** claim that the current Expo/Viro application already contains an AprilTag detector. The official AprilTag project is a C library; a real mobile detector must be connected through an explicit adapter after a supported native/authoring path is proven.

## Authority chain

Existing Romanov release authority remains unchanged:

`survey/control points → session-local calibration → measured residuals → cross-device field matrix → calibration verification → persistent-anchor proof`.

AprilTag evidence is auxiliary:

`known marker authority → detector observation → normalized common frame → translation/rotation error → reviewer decision`.

An accepted AprilTag record is calibration evidence, **not** a field PASS.

## Marker authority

Every marker requires:

- marker-set ID/version;
- family + tag ID;
- measured physical size in meters;
- survey packet reference;
- expected pose in an explicit site frame;
- source evidence reference.

The physical size is authority data. A detector-provided size cannot silently override it.

## Detector boundary

`AprilTagDetectorAdapter` is intentionally an interface.

A future backend must normalize raw detector output into an explicit target frame and declare:

- detector ID/version;
- family/tag ID;
- physical-size input;
- normalized pose;
- detection timestamp;
- device/build;
- bounded confidence class;
- evidence reference.

Raw camera frames are not part of this contract and are not retained by default.

## Derived error integrity

The project independently recomputes:

- translation error in centimetres;
- rotation angular distance in degrees.

A stored record is invalid if either derived value is altered later.

Expected and observed poses must use the same explicit frame before errors are compared. Camera-local output cannot be compared directly with a survey/site pose.

## Review

Records begin as `pending`.

A reviewer may mark them `accepted` or `rejected` with reviewer identity and timestamp. Review does not modify:

- survey points;
- `RomanovFieldSession.passed`;
- MOSCOW-INT-00 status;
- persistent-anchor verification.

## Next implementation gate

Only after a viable detector path is confirmed should Moscow add:

- tag capture/detection UI;
- marker-set selection;
- calibration refinement suggestions;
- evidence export into the Romanov field archive.

The detector integration must use a real supported implementation; no fabricated React Native detector API is permitted.
