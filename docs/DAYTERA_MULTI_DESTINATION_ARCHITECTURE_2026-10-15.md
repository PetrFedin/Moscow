# DAYTERA — cross-city architecture contract (proposal, 2026-10-15)

Status: DRAFT DESIGN, no second-city implementation or commercial rebrand. Code basis: `src/product/travelProductIdentity.ts`. Name DAYTERA remains unapproved and unverified legally.

## Core product model (city-agnostic)

TravelerIdentity -> Journey -> DestinationLeg[] -> JourneyDay[] -> Stop[] -> Commitment[] -> ExecutionEvent[] -> VisitMemory[].

- A `Journey` can include multiple city legs, days and changes without flattening all venues to Moscow.
- `DestinationLeg` must include verified `destinationId`, IANA timezone, visit-date range, country, locale, data-access/provenance policy.
- `Stop` references a **namespaced** location: `<destinationId>:<provider>:<place-id>`; free text remains unlinked and must NEVER be merged by similar title.
- `Commitment` represents user-supplied or independently provider-confirmed reservation; the verification state remains explicit and no unverified receipt may auto-upgrade to provider-confirmed.
- `ExecutionEvent` (visited/cancelled/disrupted/replanned) retains source, timestamp, consented evidence and the accepted state transition; a locked ticket never silently moves.
- `VisitMemory` is user-controlled and permits note, optional photo and privacy state. No passive GPS tracking or public sharing by default.

## Per-destination authority contract

Every city extension requires:
1. `CityMetadata`: stable id, ISO country code, IANA timezone, display names, native public-transit/local mobility notes.
2. `PlaceDirectory`: admitted unique IDs, verified address/coordinates, dated source URL, opening-hours freshness, accessible entrances and rights-cleared photo references.
3. `BookingProviderRegistry`: capabilities (read-only / deep-link / reservation / purchase / cancel / refunds), consent, currency and lawful proof policy; UNKNOWN is a first-class response.
4. `RoutingAuthority`: declared modes, accessible route caveats, timestamp and geometry provenance. Partner map handoff preferred until own evidence accepted.
5. `LocalRules`: privacy, retention, tax/consumer refund obligations, language/currency and unsupported-payment warnings.
6. `HeritageMediaPackage` (optional): historical content, evidence and usage rights. It must not block the mainstream itinerary.

The initial implementation may authorize **only Moscow**. `requireAdmittedDestination('saint-petersburg')` must fail until independent checks admit it.

## Migration from Moscow v1

- Existing `destinationId='moscow'` is retained; do not rewrite or lose legacy Trip IDs.
- `moscow:v1:personal-trip`, `moscow:v1:personal-trip-archive` and the recovery journal remain readable. Never rename keys in-place; build tested, idempotent dual-read migration when the second city is actually admitted.
- `personalTripBackup` currently explicitly rejects non-Moscow destinations. Preserve that validation now; introduce a distinct `multi-city-backup/v2` parser with opt-in migration and cryptographic/privacy design before future rollout.
- `MoscowTravelHistory`, `MoscowNextDiscoveries`, `TouristTodayCard` and the heritage package remain Moscow-specific components until safely wrapped/adapted. A generic name alone does not make them multinational.
- Reserve namespaces `destination/region/provider/place`; never infer identity from title/address alone.
- Travel timestamps are stored unambiguously and displayed using the **destination's timezone**, not device timezone or a hardcoded Moscow offset.
- One-page design tokens and public navigation may be shared; source-backed city data, provider capabilities and cultural packages cannot be assumed interchangeable.

## Zero-fabrication city onboarding gate

A destination cannot show as launch-ready without verified (a) city metadata/timezone, (b) source-backed and media-rights-cleared POI starter set, (c) route/deeplink or verified mobility limitation, (d) explicit booking compatibility/no-booking state, (e) offline/crash recovery UX test, (f) accessible phone/tablet/desktop QA, (g) privacy/retention and legal sign-off, (h) independently reviewed evidence and approved deployment. Unknown remains UNKNOWN. Do not fake vendor inventory, ticket pricing, review ratings or current opening state.

## Exit criteria for the *first* extra city (future, no city selected)

- Existing Moscow trip data and imported backups survive migration and restart unmodified.
- A traveler can have two city legs with distinct IANA timezones without a wrong-day or lost-ticket event.
- User-generated note and third-party booking references stay in the correct city and privacy scope.
- Search/recommendations never mix same-name POIs from different cities.
- A city without provider admission does not offer live payment, booking or reservation confirmation controls.
- Cross-city itinerary and leg-switch, compact Today and Passport all pass iOS/Android/web browser tests and independent UX acceptance.

## Recommendation

Stabilize and ship one extraordinary Moscow experience first. A second city should be an **adapter qualification test** of this common trip lifecycle, not a rushed content fork of Moscow. Multi-city readiness becomes credible only after measured performance and source authority in the second destination.
