# MOSCOW / future multi-city platform — delivery reconciliation, 2026-10-15

**Status: active draft review; this document records observed GitHub state, not production readiness.**

## 1. What was actually checked (source of truth)

- GitHub repository `PetrFedin/Moscow`, `main` and open pull requests (October 15, 2026).
- **19 open PRs before this fix branch:** #127, #130, #132, #152–158, #166–172, #175, #176. These are cumulative stacked changes, not 19 independently releasable components.
- #175 exact-head `f9055141`: quality GREEN with 570 contract, 37 browser and 3 responsive visual checks. This is draft-branch evidence, NOT verified published product.
- #176 exact-head `e82e3ed4`: quality FAILED **only** at 375/768/1440 visual acceptance. All contract, TS, Web/iOS/Android build and ordinary browser E2E steps were GREEN. Root cause: the newly added locator for `Третьяковская галерея` matched both featured and timeline copies within `travel-day-overview`.
- This stacked fix branch (Draft PR #179) introduces exact stop identity, checks cancelled/held/provider-recorded ticket truth, journals active-trip autosaves, and persists initial trip creation before displaying it. It requires fresh exact-head CI, independently reviewed screenshots and iOS/Android crash testing.
- PR #176/175 currently show no independent review approval. Parent PRs remain Draft. Never infer that main includes these features from a successful test on a branch.

## 2. Gaps, priority, and objective acceptance

| Priority | Stream | Current evidence / gap | Next engineering action | Release proof |
| --- | --- | --- | --- | --- |
| P0 | Broken release gate / integration | #176 last SHA visual FAIL; 19 stacked PRs open; no independent signoff | Apply PR #179 repairs, pass latest CI, create reproducible stacked integration plan | Exact-head quality GREEN, same SHA displayed on web, native visual 375/768/1440 and no detached approvals |
| P0 | Local journey data integrity | Archive/switch/import/delete journal drafted; original autosave was an unguarded overwrite and new trip appeared before durable save | Journal autosave edits, check expected prior state, make create durable first (this fix); run crash-after-each-write tests on real devices | User ticket/ref/accepted replan/notes survive cold restarts; unchanged foreign edits not overwritten; cross-tab atomicity remains **unproven** |
| P0 | Booking truth | Several trip-day labels treated provider-recorded as freshly verified and cancelled bookings as upcoming; fixed in PR #179 | Independent date/status/provenance E2E, hold/cancel/replan truth audit | No cancelled ticket shown as valid, no user-declared converted into provider-confirmed, no fixed commitment silently moved |
| P0 | First screen UX | Today action exists but a large accumulation of advanced panels remains | Mobile audit, collapse advanced panels, accessibility and actual tourist task trials #177 | A traveler can locate next action/fixed ticket in one glance; tested real interactions, not only screenshots |
| P0 | External proof | YCLIENTS and spatial field-verification gates lack integrated independent release evidence | Keep provider and physical-test admission separate; authenticate only real receipts | No fake bookings / availability, Phase-0 verification on physical devices, field provenance |
| P1 | City catalogue #161/#174 | Seven admitted source-backed editorial Moscow places, very limited live coverage | Source-checked 50+ *target* records across categories and districts; media rights proof | Unique ID, dated URL, verified address/geometry, photo commercial rights or no-photo fallback per published place |
| P1 | Ticket / reservation wallet #162 | User-declared tickets and reference fields, imported backup, but no general attachment parsing / real payment guarantees | Local file import PDF/QR/confirmation, secure validation, provider partnerships only after authorization | Zero accidental provider-confirmed upgrades, duplicates handled, cancellation/refund status explicit |
| P1 | Map + routing | Destination Package/Valhalla and replay pieces exist; real live city routing not universally admitted | Connect trip/day to provider-backed actual geometry & time, deep-link fallback, accessibility claims grounded | Measured ETA/source freshness shown; no invented movement metrics |
| P1 | Multi-person journey #163 | No verified account/role/cloud execution across devices | Person/role/consent design + conflict-free shared edits | Multi-device E2E, membership and disclosure control; no accidental history sharing |
| P1 | Passport #160 | Local diary and archive/personal notes working in Draft | Opt-in trip photos, private local rights+retention, search/map with trusted coordinates | Export/delete, user consent, known-place vs manually entered identities remain separate |
| P1 | Multi-city name and architecture #178 | DAYTERA only a proposed internal candidate; no trademark clearance, only Moscow admitted | Trademark/domain legal screening; independently authorize another city/timezone | No rewrite of Moscow keys; correct city boundaries, source data, localized routing |
| P2 | Source-grounded concierge #165 | Read-only proposed, no production verified personal AI itinerary | Limited AI on approved dataset with explicit human acceptance | No independent purchases or unsourced venue/hours claims |
| P2 | AR, 3D, heritage field proof #78–87 and related | Significant specialist project modules, still not proven end-to-end on physical site | Real photo/model rights, on-location positional calibration, device benchmarks | Physical field evidence, performance budgets and external reviewer |
| P2 | Gov/B2B, Destination SDK, contributor network | Long-term master-plan waves, many sections ADOPT rather than implementation | Scope only after consumer pilot outcomes | Real partners/contracts/funded delivery, attribution and lawful data exchange |

**Business truth:** We are NOT objectively ahead of RUSSPASS, Wanderlog, TripIt or 2GIS today. Their catalog, map, booking import, offline, group and content ecosystems are substantially broader. Our specific potential value is precise recovery from disruption while preserving fixed tickets/receipts and accountable history; it is a hypothesis to validate via #177.

## 3. Code changes for this exact pass

1. `tests/visualAcceptance.e2e.spec.ts` now selects the actual planned museum with `testID="trip-stop-visual-venue"`; its name appears more than once by design. This preserves legitimate UX content while making QA deterministic.
2. `src/travel/tripDayPresentation.ts` models `cancelled`, `skipped`, `visit-recorded`, `completed-in-plan`, `reservation-held`, `user-declared-confirmation`, and `provider-confirmation-recorded` explicitly. Cancelled/skipped entries are excluded from upcoming bookings, never erased from history.
3. `src/features/trip/TripJourneyOverview.tsx` renders truth labels and source-state counts, not unverified "booking verified" language. Gives each itinerary stop a stable ID for E2E/visual QA.
4. `src/travel/personalTripTransaction.ts`: transaction operation `edit` is admitted; active autosaves can use the same journal/expected-revision guard as switch/archive/import.
5. `src/features/trip/PersonalTripPlanner.tsx`: initial create becomes journaled and must succeed before the UI shows the trip; edits serialize and verify prior durable active trip, so common stale-tab writes fail closed instead of silently replacing newer completed edits.
6. Tests include `tripDayPresentation.test.ts`, browser cancellation/provenance/initial-create and two-tab concurrency checks, stale-edit rejection and interrupted-edit replay in `personalTripTransaction.test.ts`.
7. Web Locks coordinate cooperating browser tabs on supported origins. This improves cross-tab safety without creating guaranteed multi-process atomic storage.
8. `src/features/trip/BookingWalletCard.tsx` and `TouristTodayCard.tsx` now align provider-recorded language with trip-day truth; the wallet hides cancelled and skipped records, supports 52px actions and accessible text, and has a dedicated three-viewport visual fixture. Cancellations remain in the route history; a hidden upcoming booking is not deleted.
9. `TripJourneyOverview.tsx` now calls the same `personalTripDayItems` projector as the trip editor, so explicitly reordered stops are not silently re-sorted by date/time. Fixed ticket data remains untouched; conflict detection remains a separate gate.

## 2026-10-15 follow-up P0: booked-date authority vs tourist drag-and-drop (Draft PR #180)

- Confirmed baseline PR #179 exact-head `e0620c38` passed 582 contract tests, 40 browser E2E and three responsive visual tests; this is **not** an approved release, actual device proof or independent code review.
- A subsequent code review found `moveTripItem` silently rebasing a ticket/reservation start and end timestamp to a different calendar day when the traveler tapped the ordinary day-moving arrow. A UI itinerary edit **cannot** change the provider's actual ticket or table reservation, including when the receipt was manually entered. Silent rebasing is removed at the **pure scheduler authority**, not only hidden behind the UI.
- New rule: only an unbooked, unvisited, still planned place may change day in the ordinary planner. Any ticket/reservation (confirmed, held or cancelled) is date-anchored, even when user-declared. Old documents remain readable; **a real provider reschedule requires its own verified change workflow**, not fabricated success.
- Another previously unaligned state: when `item.status='planned'` but `commitment.status='cancelled'`, Today could show it as the next action; conflict/free-window calculation and summary could still treat it as active. All now use shared cancellation-aware helpers. Cancelled commitments remain in the itinerary/history with a clear cancelled badge, not in actionable stops or available booking counts.
- The Today next-stop card labels provisional holds as unverified, not fully confirmed. The itinerary editor explains that changing route order never changes the supplier's booked date.
- New tests cover fixed-date immutability, valid flexible moves, held/cancelled bookings, free-window recovery, conflict removal, unified summary and Today projection, and on-reload cancelled-booking browser truth.
- Release gate remains **latest exact-head GREEN**, independent review, scenario screenshots, physical native smoke and proof that external provider changes are real. Until these gates pass, this PR is Draft and production remains unchanged.

## 2026-10-15 P0 continuation: personal booking inquiry ledger (Draft PR #181)

- Previous baseline PR #180 exact-head `cdc7ee89` GREEN: 590 contract PASS, 41 browser E2E PASS and 3 visual viewport PASS; this does not imply a merged or released build.
- Introduced `bookingResolutions` (optional v1 trip field) with strict local event sequence, user-reported contact and reply notes, archival and bounded payloads. The original provider-anchored booking and its confirmation evidence are untouched by every event transition.
- Active Wallet offers a one-tap inquiry entry; cancelled bookings remain available for a separate refund/cancellation discussion in the private assistance panel. Past cases are readable after archive, reload and portable plaintext JSON backup.
- A supplier-message draft is *copyable but never transmitted*. Stored references are displayed as user recorded. Local event timestamps use the admitted destination timezone; no provider-state upgrade is implied by the presence of a note.
- Adversarial parser and backup tests reject fabricated verified refunds, unsupported provenance keys, duplicate IDs, bad chronology, oversized text and wrong booking identity.
- First code-only CI on PR #181 SHA `1dd33685` succeeded with 596 contract PASS / 42 browser PASS / 3 visual PASS (run 38656465212). **This is not the final SHA after UX and documentation edits; final exact-head checks required.**
- Remaining P0 blockers: independent review of PR #179 → #180 → #181 plus ancestor reconciliation; on-device crash/restore and actual screenshot inspection. Remaining P1: real consented provider communication, immutable verified supplier responses, refunds and ticket/document import. Production HOLD.


## 4. Important remaining storage risk

This journal still relies on independent AsyncStorage keys. Co-operating browser tabs now use a named Web Lock when the browser supports it; operations within a native JS runtime remain serialized by an in-memory queue. **Web Locks do not solve unsupported browsers, device loss, hostile storage writes or non-cooperating extensions.** Read-then-compare alone is not atomic; physical iPhone/Android termination, quota and crash tests remain P0 issue #173. Neither recovery from OS storage eviction nor encryption is proven. Do not publicly guarantee zero data loss. Plain-text exported backups remain unencrypted.

## 5. Release order and boundaries

1. Finish exact-head CI and screenshot inspection of PR #179, and independent code review.
2. Address remaining #173 storage/concurrency with native fault injection; keep CI evidence at the exact last commit SHA.
3. Reconcile and integrate stacked PRs in logical order (#157 / #158 / #166 / #167 / #168 / #169 / #170 / #171 / #172 / #175 / #176 / #179). They currently target `main` with cumulative changes: **do not blindly merge each** or duplicate the same code.
4. Controlled preview deploy, 375/768/1440 + physical device QA, provider-locked negative checks and rollback proof.
5. Only then consider a supervised production release, first-city consumer pilot and adoption measures.

No main/production merge or provider access is authorized by this audit. No paid external resources created.

Canonical project authority: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`. Competitive references: `docs/DAYTERA_MARKET_COMPETITOR_UX_AUDIT_2026-10-15.md`.
