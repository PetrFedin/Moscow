# Pilot Day Command Centre

## Mission

Run the field/user/provider pilot as a controlled operation with explicit owners, evidence capture and stop-the-line rules.

## Before start — GO check

Required:

- Pre-Pilot Gate = `GO_FOR_CONTROLLED_PILOT`;
- owner assignment complete;
- site/access confirmed;
- frozen build recorded;
- current survey/calibration/metric authority;
- field-session plan validated;
- visitor-wave manifest validated;
- evidence archive root created;
- security/privacy/legal review routes known;
- provider access path known;
- acceptance matrix version fixed;
- Sensor Quality Gate included in field build;
- privacy-safe observability plan recorded.

## Command-centre roles

Minimum live contacts:

- Pilot manager
- Field lead
- Mobile/build lead
- Site access owner
- Research/observer lead
- Integration/provider lead
- Escalation contact for security/privacy

Legal/finance may be on-call rather than physically present unless the agreed procedure requires otherwise.

## Stop-the-line: spatial

STOP if:

- wrong/stale survey;
- wrong calibration placement;
- metric authority mismatch;
- device/build identity missing;
- unmeasured control point;
- required field condition missing;
- evidence path cannot be persisted;
- Sensor Quality Gate reports insufficient for the attempted anchored workflow;
- operator is tempted to relabel degraded/manual alignment as precise.

## Stop-the-line: visitor research

STOP if:

- participant consent/recruitment process differs from approved procedure;
- PII is entered into app analytics or observer JSON;
- observer begins coaching;
- wrong content/build version is used without documenting deviation;
- study manifest slot cannot be reconciled.

## Stop-the-line: provider

STOP if:

- credentials/company authority is unclear;
- test may affect an unauthorised real customer;
- raw response/webhook cannot be archived;
- provider entity/receipt IDs do not match expected authority;
- synthetic/manual receipt would be required to continue.

## Stop-the-line: integrity

STOP if:

- evidence must be manually edited to pass validation;
- required raw evidence is lost;
- timestamp/device/build attribution is unknown;
- reviewer cannot reproduce the evidence chain.

## Operational diagnostics from master plan

### Sensor Quality Gate — required runtime safety
Use current states:
- precise
- degraded
- insufficient

It decides whether the runtime may attempt precise/manual/fallback experience. It does not mark field PASS.

### Sentry — optional-to-enable, required-to-decide
Before field day, explicitly decide:
- enabled with reviewed DSN/config; or
- disabled with documented reason.

If enabled, use privacy-safe bounded diagnostics only. No precise routes, camera frames or PII.

### AprilTag — optional auxiliary calibration
If used:
- use known marker authority;
- record detector/version/device/build;
- keep record pending until reviewer decision;
- never use it to set `RomanovFieldSession.passed`.

### Street-level reference imagery — optional pre-field hypothesis
If used:
- record provider/image ID/capture date;
- treat as context only;
- direct field verification wins on current operational state.

## End-of-day close

1. Stop data collection.
2. Confirm every planned session/slot state.
3. Copy evidence to durable archive.
4. Compute hashes where required.
5. Run validators.
6. Record blockers separately from failures.
7. Do not announce PASS from field impressions.
8. Schedule formal evidence review.
9. Reconcile economics/time logs before participants/team disperse.
10. Produce command-centre close note with deviations and unresolved dependencies.
