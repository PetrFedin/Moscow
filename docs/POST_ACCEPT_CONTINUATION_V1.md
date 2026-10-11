# Post-Accept Continuation v1

Status: implementation candidate, not production admitted.

## Scope
The existing accepted replacement receipt is source-backed and contains before/after, source evidence, route observations, and fixed-commitment protection. The existing PersonalTrip keeps visits and day items. This branch now additionally stores locally accepted replacement receipts in the same PersonalTrip snapshot.

This wave adds a read-only exact-revision continuation projection. No new booking authority and no synthetic provider receipts.

## Contract
1. Accept only a receipt whose acceptedAt matches the current trip revision.
2. Verify the affected item matches the accepted replacement exactly.
3. Identify the next scheduled item without changing a confirmed booking.
4. Return remaining day item IDs and confirmed commitment IDs.
5. Fail closed if the trip has changed since acceptance.
6. Acceptance writes the receipt into the optional `replacementReceipts` array of the same `moscow:v1:personal-trip` snapshot; the existing schemaVersion remains 1 and legacy records without receipts still load. Parse rejects malformed collections, malformed receipts and duplicate proposal IDs.
9. Receipt includes the original destination, accepted alternative, observation evidence IDs, affected item, reason, source provider, source URL, and accepted time. These are local historical records; they are NOT a tamper-evident signed audit log.
10. The UI lists recent accepted changes and locates the next fixed ticket from the current trip; it does not rewrite or independently confirm a user-declared ticket.
11. Because the same local device stores the trip and history, cross-device sync, crash-atomic writes and cryptographic audit are NOT included in this increment.
7. Display user-confirmed visits separately from provider-confirmed attendance; do not infer presence from itinerary alone.
8. Media notes and photos require explicit privacy/storage policy and working native/web picker before release.

## Admission
- Exact-head quality and mobile tests.
- Unit proof for unchanged fixed ticket, stale revision, missed replacement, and next event.
- UI proof: receipt -> accepted replacement -> next fixed commitment -> reload -> historical receipt still present -> visit can be marked independently.
- Production deployment and live proof are separate gates.
- Canonical integration plan remains docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md; field pilot and YCLIENTS proof remain blocked independently.

## Costs and release sequencing
No paid infrastructure introduced. The history uses existing AsyncStorage/local-first data. PR #152 must pass all contract, typecheck and web E2E at exact SHA. PR #153 is the separate tourist-first redesign and passed quality for commit 627bff0c; reconcile these branches in a separate tested integration before merging or publication. Render preview remains on older deployed commit 8402484, not exact main. Visual review on mobile, tablet and desktop remains open.
