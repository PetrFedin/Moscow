# Post-Accept Continuation v1

Status: implementation candidate, not production admitted.

## Scope
The existing accepted replacement receipt is source-backed and contains before/after, source evidence, route observations, and fixed-commitment protection. The existing PersonalTrip keeps visits and day items, but acceptance receipts are currently returned to the UI callback and then discarded.

This wave adds a read-only exact-revision continuation projection. No new booking authority and no synthetic provider receipts.

## Contract
1. Accept only a receipt whose acceptedAt matches the current trip revision.
2. Verify the affected item matches the accepted replacement exactly.
3. Identify the next scheduled item without changing a confirmed booking.
4. Return remaining day item IDs and confirmed commitment IDs.
5. Fail closed if the trip has changed since acceptance.
6. Persist acceptance receipts and history only in a subsequent audited migration: current PersonalTrip schemaVersion is 1; no implicit schema bump.
7. Display user-confirmed visits separately from provider-confirmed attendance; do not infer presence from itinerary alone.
8. Media notes and photos require explicit privacy/storage policy and working native/web picker before release.

## Admission
- Exact-head quality and mobile tests.
- Unit proof for unchanged fixed ticket, stale revision, missed replacement, and next event.
- UI proof: receipt -> active replacement -> next fixed commitment -> manually marked visit.
- Production deployment and live proof are separate gates.
- Canonical integration plan remains docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md; field pilot and YCLIENTS proof remain blocked independently.
