# MOSCOW-INT-00 — Field Proof Gate

Canonical plan: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`.

## Why this gate exists

The integration master plan explicitly prohibits scaling before spatial truth and repeatability are proven. This gate makes that rule executable.

Phase 0 passes only when all five independent evidence families are present:

1. Romanov Chambers physical field experience;
2. Romanov measured physical spatial accuracy;
3. Old English Court second-object repeatability with its own authority/evidence;
4. supervised visitor pilot;
5. government technical-pilot evidence package.

## Current state

Current repository truth is **BLOCKED**.

- Romanov: tooling and validators exist, but there is no real `evidence/romanov/...` field archive in the repository.
- Physical accuracy: cannot be inferred without the Romanov physical evidence package.
- Old English Court: still at spatial intake; production asset, object-specific metric/control-point authority and field proof are not present.
- Visitor pilot: protocol/tooling exists; no reviewed 20–50 participant evidence package is present.
- Government package: project-side technical pilot artifacts are structurally available, but they do not substitute for the missing physical/user evidence.

## Scaling lock

While Phase 0 is blocked:

- `MOSCOW-INT-01...09` remain locked;
- mass ingestion is forbidden;
- city-scale spatial rollout is forbidden;
- Yandex MapKit remains the renderer;
- YCLIENTS/provider proof remains an independent external-provider track and cannot unlock spatial scaling.

## CLI

Run:

`npm run integration:status`

The command prints the current roadmap and exits non-zero while Phase 0 is blocked. That non-zero result is intentional and must not be added to the normal CI quality workflow until real Phase 0 evidence is expected to exist in CI.

## Next physical evidence

The next value-producing work is field evidence, not another framework:

1. execute Romanov field day and build the real P0 evidence archive;
2. obtain/create Old English Court production asset and object-specific authorities, then repeat the field-release process;
3. execute supervised 20–50 participant pilot;
4. review/attach the resulting evidence to the government package.

Only after this gate passes does `MOSCOW-INT-01 Destination Package v2` become the next available implementation phase.
