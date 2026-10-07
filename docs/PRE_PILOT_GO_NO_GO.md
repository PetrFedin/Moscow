# Pre-Pilot Go / No-Go Gate

Authority: `src/government/prePilotGoNoGo.ts`.

## Default

**NO_GO**

The gate opens only for a bounded controlled pilot. It does not authorize scaling, procurement, publication or provider production rollout.

## Required inputs

- complete owner-assignment manifest;
- valid Romanov field-session plan;
- valid 20–50 participant visitor-wave manifest;
- site-access reference;
- frozen-build reference;
- acceptance-matrix reference;
- provider-access path reference;
- security/privacy review route;
- legal/rights review route;
- operations/SLA review route;
- field observability plan reference;
- Sensor Quality Gate included;
- privacy boundary confirmed.

## Master-plan additions

### AprilTag
Allowed values:
- `not-used`
- `auxiliary-only`

It must never be treated as a field PASS authority.

### Street-level reference
Allowed values:
- `not-used`
- `pre-field-hypothesis-only`

It cannot confirm current site state.

### Signed Destination Package
For Phase 0 the required status is:

`deferred-phase-1`

This enforces the master-plan sequencing: signed offline package manifests belong to Destination Package v2 after Phase 0.

## Result

- any blocker → `NO_GO`
- zero blockers → `GO_FOR_CONTROLLED_PILOT`

This result means only that the planned controlled activity may start under the agreed procedures.
