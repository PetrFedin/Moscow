# Moscow / DAYTERA — Booking Exception Continuation v1

Date: 2026-10-15. Status: **DRAFT, NOT RELEASED**. Stacked PR #181 on PR #180.
DAYTERA is still an **uncleared internal name**; the public product remains Moscow.

## Product problem

A traveler may already own a museum/theatre ticket or table reservation when their plan changes. A local itinerary adjustment does **not** change a supplier booking. The system must preserve both the original commitment and the user's attempt to resolve a disruption. Unlike a provider API, a personal note must never be presented as official confirmation.

## Implemented in this PR

- `src/travel/bookingResolution.ts`: bounded append-only local history attached to an **existing trip item with a commitment**. Topics: change date, cancellation/refund, venue unavailable, other.
- Events: opened, **contact self-reported**, **reply self-reported**, archived. First event must be opened; archived is terminal. Unique case/event IDs, chronology, one open case per booking, short note/event count limits and strict field whitelist enforced.
- `src/travel/personalTrip.ts`: optional `bookingResolutions` field, backward-compatible v1 parser and full deep-copy of events. Existing ticket, verification, dates, reference and provider receipt cannot be updated by any contact-log method.
- `BookingWalletCard` links directly to the assistant for an active ticket. `BookingResolutionCard` can also select a cancelled/held booking and reopen **a new case only after archiving an older one**, while preserving readable past case history.
- Original stored HTTPS ticket link opens only when the traveler clicks it. It is **not** asserted to be a support endpoint. Optional supplier message draft is displayed locally and must be copied and sent manually. No outbound API, email, SMS, payment or refund call.
- Timestamps are stored as ISO UTC and displayed in the registered destination timezone. Any supplier response is explicitly labeled as reported by the traveler, not independently confirmed.
- Original plan / archive / manually exported **plaintext JSON backup** retain private inquiry notes. Interface warns not to enter bank data or secrets; backups are not encrypted.

## Workflow / acceptance

1. User has a ticket or reservation. They can open a case from the Wallet, or from the generic assistant even when the booking was cancelled.
2. Choose a topic and create a local record. The booking is unchanged.
3. Optionally view a draft request and copy it manually. If the user actually contacted the supplier, they separately mark their own attempt.
4. Optionally enter what they believe the supplier replied. No status upgrade, no receipt replacement and no refund claim.
5. Archive the local case. The full event trail stays accessible after app restart and portable backup.
6. The traveler may continue their day; an actual supplier-approved change is a **separate authenticated future workflow**.

## Proof and non-proof

Tests:
- `tests/bookingResolution.test.ts`: append-only truth, deep copy, archival, invalid payload rejection, oversized notes, lost reference prevention, legacy roundtrip and backup.
- `tests/personalTrip.e2e.spec.ts`: request from Wallet → self-reported contact → message draft → note → archive → reload → booking untouched → cancelled reservation inquiry.
- `tests/visualAcceptance.e2e.spec.ts`: assistant entry at 375/768/1440, no horizontal document overflow.

Initial pre-polish SHA `1dd33685` achieved GitHub Actions GREEN, 596 contract PASS, 42 browser PASS, 3 responsive visual PASS, run 38656465212. The final SHA after timezone/template and documentation edits **requires fresh exact-head CI** before release admission.

NOT VERIFIED: provider contact delivery, supplier reply authenticity, changing/returning actual bookings, refund settlement, external booking inventory, native device crash/restore, user testing, independent review, production publication. A test capture is not manual screenshot signoff.

## Next P0/P1 work

- Exact-head CI, screenshot inspection and independent code + privacy review of PR #181 and ancestors; reconcile stacked PRs before any release.
- Physical iOS/Android crash/kill/storage-full tests and backward-compatible portable backup restore; do not promise zero data loss.
- Real provider integration only after explicit account/consent/legal authority, idempotent provider requests, signed/verifiable responses and scoped cancellation/refund terms. Provider acceptance must not be inferred from `reply-self-reported`.
- Add real incoming ticket/PDF/QR intake with verified source/permission and duplicate matching in a separate admitted PR.
- Measure traveler task completion vs accessible competitive baselines through issue #177; do not claim leadership based on mock sessions.
- The main consumer journey stays: Today → fixed commitment → safe disruption handling → accepted route → recorded actual visit → private trip diary.

No production/main changes or paid resources were created by this milestone.
