# Moscow Companion Today — actionable next stop (2026-10-13)

Status: IMPLEMENTED IN DRAFT BRANCH, NOT PRODUCTION ADMITTED.

Parent: #167 at exact GREEN SHA e9193d01753028a75d45b126334fd22003b63fb6.
Purpose: close the UX gap between a free-form selected stop and a fixed booking. Maintain genuine data provenance and visit integrity.

## Behavior added
1. Today authority chooses an unscheduled, user-selected stop as a **possible** next activity even if there is a later fixed ticket. Explicitly does not claim travel feasibility or live admission.
2. Companion Today renders the next fixed ticket/reservation and an independent next-visit idea, rather than hiding one under an either/or branch.
3. The candidate stop shows an address, sourced from the canonical curated venue or user-declared commitment, and links to an **external map address search**. This does not prove travel time, routing, opening hours or the correct entrance.
4. The existing official source / historical-place action stays accessible.
5. A personal visit check-in requires two deliberate actions (select -> confirm), with cancellation. The authoritative `recordTripVisit` operation changes a planned stop to completed and persists a `user-confirmed` visit; it does **not** upgrade a ticket to provider-confirmed or validate physical presence by geolocation.
6. Full reload must retain check-in, save source references and preserve unmodified fixed commitments.

## Negative contract
- No auto-check-in from opening a story, GPS proximity or map directions.
- No assertion of venue opening, ticket capacity, restaurant tables, verified walk minutes, or paid booking.
- No overwrite of a fixed ticket on selecting or marking a discretionary stop.
- No storing GPS in the visit record; photo uploads remain behind the separate privacy/storage gate.

## Release tests
- Unit: untimed curated stop plus 19:00 theatre ticket -> both returned; check-in leaves ticket unchanged.
- Browser: choose place -> plan -> test-fixture user-declared ticket -> reload -> see both blocks -> cancel visit -> no visit -> confirm -> user-confirmed visit persisted -> fixed ticket unchanged after reload.
- Visual: phone 375px, tablet 768px, desktop 1440px; capture actual Today with next place and ticket, not just an empty plan.
- CI and exact SHA gate, independent screenshot review, platform devices and published SHA check remain mandatory.
- Production, Render, main and paid providers are deliberately excluded from this draft.

## Known issues and next wave
- The header hero photograph occasionally fails on tablet when loaded from a remote Wikimedia CDN; do not claim visual release until an explicitly licensed, checked-in local optimized image and offline fallback are QA tested.
- Destination catalogue has only seven editorial records, without authoritative entrance coordinates or real-time availability.
- True mobile map routing, schedule changes and provider booking remain behind separate integration and privacy gates.
- The profile/multi-trip state still uses local-only persistence; implement controlled export, backup and revision-aware account sync before promising continuity across devices.
