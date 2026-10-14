# Moscow Passport 2.0 — all-trips journal filters and identified places
Date: 2026-10-13
Status: **DRAFT IMPLEMENTATION, NOT RELEASED**. Parent PR #170 (backup + initial history), which is stacked on PR #169.

## User-first outcome
A visitor can open a single personal history across current and previously archived Moscow trips, search memories by title/trip/note, filter by semantic experience category or inclusive calendar range, and browse visits grouped by day. This is private local-first history, not externally confirmed venue attendance.

## Changes
- `src/travel/moscowTravelHistory.ts`: one pure history projection; active trip supersedes an archived revision of the same trip ID.
- All visit records remain distinct even when a venue is revisited. `visitCount` is the number of local visit records.
- `knownPlaceCount` counts distinct source-admitted canonical destination or curated catalog IDs only. `repeatKnownPlaceVisitCount` is the number of records beyond the first per identified ID.
- Anonymous or manually named places never get merged by title/address. Unknown or unadmitted destination IDs do not establish identity.
- `filterMoscowTravelHistory()` searches title/trip/note and filters explicit category/inclusive ISO day range. Invalid and reversed dates fail closed.
- `groupMoscowHistoryByDay()` provides newest-first day sections without losing repeat visits.
- `src/features/trip/MoscowTravelHistoryCard.tsx`: search, category chips, date fields, result count, reset and 15-record incremental pagination. RU/EN/ZH copy; private journal remains behind explicit expand.
- `src/travel/moscowPassport.ts`: complete citywide taxonomy mapping, including gallery, exhibition, cinema, concert, cafe, restaurant, park and more.
- Unit tests + browser acceptance added for filters and category consistency.

## Evidence and privacy
- User-confirmed, route-completed, proximity and provider-receipt-origin markers are separately displayed.
- This UI never upgrades a manually entered claim or imported receipt to verified physical attendance.
- No new location tracking, background telemetry, upload, photo data, paid provider or cloud database.
- The backup format remains plaintext local copy/paste, not encrypted or server-synced.
- Identified venue count is conservative: no ID means no dedup; a future reviewed alias map may explicitly link known identifiers.
- Records are not a tourism attendance census; counts reflect user-owned notes and preexisting evidence states.

## Release acceptance
1. PR #170 exact-head quality GREEN **confirmed** at `bc41a21b`; this does not substitute for new branch verification.
2. New Passport branch must pass its own exact-head CI: Node contract tests, TypeScript, web, iOS and Android export.
3. Playwright E2E: switch to Trip, open Passport history, filter food, search a private note, filter a single day, reject invalid date, reset.
4. Visual inspection 375/768/1440, then native phone and tablet tests with long Russian names, dynamic font and reduced motion.
5. Reconcile PR #157, #158, #166–#171 in dependency order, independent review and rollback.
6. Archive/import storage quota and interrupted-write tests remain P0 before calling multi-device import reliable.
7. Keep spatial field proof `MOSCOW-INT-00` and YCLIENTS provider PASS locked independently.

## Next product implementation
- Visitor-facing map of identified visited places, with no fabricated geometry for manual places.
- Useful 'not seen yet' recommendations from official-source directory with explicit availability unknown.
- Privacy-controlled visit photos and local export/import file handoff, only after consent and retention design.

Master authority: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`.
