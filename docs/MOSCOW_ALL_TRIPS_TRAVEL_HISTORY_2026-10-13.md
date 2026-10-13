# Moscow — all-trips local travel history, 2026-10-13

Status: draft code in PR #170; **not shipped**, no new paid infrastructure.

## Product
The trip screen now projects a single local history from current PersonalTrip plus the previously stored local multi-trip archive. It exposes visit totals, food visits and the most recent 30 visit entries. Each entry retains its original date, trip title, private note and evidence class. Archived trip entries can be reopened through the existing guarded trip-switch path. Counts are records, **not unique venues or externally verified attendances**.

## Source and precedence
- `src/travel/moscowTravelHistory.ts`: pure read-only projector.
- `src/features/trip/MoscowTravelHistoryCard.tsx`: progressive disclosure, RU/EN/ZH.
- `tests/moscowTravelHistory.test.ts`: two-trip aggregation, active revision precedence and immutability.
- Active trip with the same ID supersedes an older archived snapshot; the result does not fabricate duplicate visits.
- `user-confirmed`, `route-completed`, `proximity` and `provider-receipt` labels remain distinct.
- Importing plain JSON does not independently authenticate any provider receipt: existing record fields are not new proof.

## Release blockers
- Existing PR #170 CI failed on one test because the forged `provider-confirmed` booking lacked both provider and receipt evidence, while the assertion expected only the second validation error. The test now explicitly checks both missing-provider and missing-receipt cases.
- Re-run exact-head CI, inspect Playwright UX and screenshots at 375/768/1440, test physical device.
- Fault-inject archive writes and concurrent trip switching before declaring backup reliability.
- Reconcile stacked PRs #157 -> #158 -> #166 -> #167 -> #168 -> #169 -> #170; no blind merge to main.
- Investigate transactional archive + active-trip handoff before claiming crash-safe switch.
- Keep the canonical spatial Phase-0 and external-provider PASS gates independent; this consumer UX does not unlock either.

## Next product increments
1. Native file import/export with explicit local consent; optional vetted encryption and recovery design.
2. Search/filter cross-trip visits by category and date, plus deduplicated **venues** separated from **visits**.
3. Optional per-visit photo with permission, rights, device retention and deletion/portability policy.
4. Cross-device account sync only after explicit user opt-in, conflict handling and funded/approved backend.

Canonical references:
- `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`
- `docs/MOSCOW_TRIP_BACKUP_PRIVACY_AND_IMPORT_2026-10-13.md`
- `docs/MOSCOW_LOCAL_MULTI_TRIP_ARCHIVE_2026-10-13.md`
