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
6. Tests include `tripDayPresentation.test.ts`, additional browser cancellation/provenance/initial-create checks, stale-active edit and interrupted-edit replay in `personalTripTransaction.test.ts`.

## 4. Important remaining storage risk

This journal still relies on independent AsyncStorage keys. It serializes transactions inside **one JS runtime**, not across all browser tabs or across devices. Read-then-compare is not cross-tab compare-and-swap; two tabs can interleave between observation and mutation. Neither recovery from OS storage eviction nor encryption is proven. Do not publicly guarantee zero data loss. Resolve issue #173 with either tested Web Locks/coordination for the browser and safe fallback, or an atomic single-authority database; ensure physical iPhone/Android kill, quota and restart tests. Plain-text exported backup is not encrypted.

## 5. Release order and boundaries

1. Finish exact-head CI and screenshot inspection of PR #179, and independent code review.
2. Address remaining #173 storage/concurrency with native fault injection; keep CI evidence at the exact last commit SHA.
3. Reconcile and integrate stacked PRs in logical order (#157 / #158 / #166 / #167 / #168 / #169 / #170 / #171 / #172 / #175 / #176 / #179). They currently target `main` with cumulative changes: **do not blindly merge each** or duplicate the same code.
4. Controlled preview deploy, 375/768/1440 + physical device QA, provider-locked negative checks and rollback proof.
5. Only then consider a supervised production release, first-city consumer pilot and adoption measures.

No main/production merge or provider access is authorized by this audit. No paid external resources created.

Canonical project authority: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`. Competitive references: `docs/DAYTERA_MARKET_COMPETITOR_UX_AUDIT_2026-10-15.md`.
