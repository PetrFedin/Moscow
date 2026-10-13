# Moscow Next Discoveries — plan from lived history
Date: 2026-10-13
Status: DRAFT IMPLEMENTATION, NOT RELEASED.
Stacked dependencies: PR #171 (Passport 2.0) <- PR #170 (portable backup) <- PR #169 (local multi-trip archive).

## Intended tourist journey
Open an existing Moscow trip -> choose the desired day -> discover source-backed places not yet in the current plan or reliably identified as visited in local history -> pick a culture/food/park category -> open the official source -> add a venue to the selected day. The plan continues through its ordinary Day Composer and saved history. Ticket purchase, reservation, opening status and routing are separate evidence-authorized activities, never implied by insertion.

## Implemented authority
- `src/travel/moscowNextDiscoveries.ts`: pure deterministic selection of `curatedMoscowPlaces`. Identity exclusion uses only catalog IDs linked to archived or active visit records; current active trip's planned/completed catalog IDs are also excluded. Cancelled/skipped plan items remain eligible.
- Manual/free-text visits with similar names are NOT used to eliminate a source-backed place. This avoids falsely equating different venues. Because unlinked manual visits are not deduplicated, "not recorded" is not "never visited".
- User chooses `Разное / Культура / Рестораны / Парки`. Previous category counts influence deterministic editorial order, but are NOT interpreted as a verified preference or inferred personal characteristic.
- The first page includes variety across categories. Expanded state exposes additional eligible cards from the same small directory.
- `src/features/trip/MoscowNextDiscoveriesCard.tsx`: responsive RU/EN/ZH cards with curated title, district/address, official URL, source check date and explicit unknown real-time facts. Add actions target the selected trip day.
- Existing `addCuratedMoscowPlaceToTrip` remains the only mutation authority. This creates a source-backed planned venue with no automatic ticket, booking, schedule or paid provider action.
- `tests/moscowNextDiscoveries.test.ts`: archive-visit exclusion, active-plan exclusion, unknown-identity transparency, multi-category diversification, mutation/no booking and fail-closed inputs.
- `tests/personalTrip.e2e.spec.ts`: switch trip day, choose food, add an identified venue, survive reload and verify no commitment.
- `tests/visualAcceptance.e2e.spec.ts`: 375/768/1440 viewport captures for discovery header, source, filters and actionable card.

## Data and source boundary
The initial pool is exactly the currently admitted seven `curatedMoscowPlaces` entries. Sources and address validation dates are those stored in the existing directory; they are not refreshed by this feature. No additional venue is invented or silently admitted. An official directory entry does NOT prove current opening hours, ticket availability, reservation status, price, current entrance, walkability or accessibility.

This recommendation rail neither changes the recorded verification class of historical visits nor promotes a plain import to a provider receipt. It does not collect raw locations, transmit private notes or create any new infrastructure.

## Cross-surface consistency and safety follow-up
- PersonalTripPlanner now combines accepted canonical destination IDs from all local trips with existing walk visited IDs. TouristToday and the historic route's unseen rail use the combined list, avoiding a previously visited heritage node being advertised again as new.
- `addCuratedMoscowPlaceToTrip` deduplicates curated stops only by their canonical catalog ID, not by free-text title. This prevents two unrelated venues with similar names being collapsed. Same catalog venue remains restricted once per active day.
- Suggestion insertion uses a functional React state update guarded by trip identity and selected day, preventing rapid taps on different cards from overwriting each other's state.
- P0 local crash-safe archive and import acceptance is tracked in issue #173.
- P1 expansion of the official-source, rights-safe Moscow directory is tracked in issue #174.

## Release gates
1. Exact-head CI on the new PR: contracts, typecheck, all three build exports, browser E2E and three viewport screenshots.
2. Manual screenshots inspection: no text clipping, horizontally overflowing chips or hidden action buttons.
3. Inject duplicate click / storage write failure to ensure the user's planned day survives.
4. Independent review and integration from stacked PRs in dependency order. No blind merging.
5. Published SHA, mobile device acceptance and rollback instructions before any production claim.

## Next candidate increments
- Day-aware `What next` matching to free time ONLY when durations/routes are independently supported.
- New verified official directory entries with source, address and rights evidence rather than crowdsourced unverified commercial claims.
- A privacy-safe "seen map" only for locations with verified coordinates and source references; manual venues without geometry remain list-only.
- Native file save/recovery and explicit user-authorized optional encrypted sync.
