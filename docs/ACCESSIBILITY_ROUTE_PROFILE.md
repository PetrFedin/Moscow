# Accessibility Route Profile v1

Issue: #100.

Canonical source: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` → Accessibility Route Profile.

## Goal

Allow Moscow to reason about accessibility without inventing it from generic map geometry, old imagery, geodesic distance or unsourced venue assumptions.

The core rule is:

`user intent + evidence-bound accessibility profile -> decision`

not:

`user intent + guessed geometry -> accessibility claim`.

## Claim states

Every operational accessibility fact is one of:

- `verified`;
- `unknown`;
- `stale`;
- `conflicting`.

`unknown` is a valid first-class state and is preferred over unsupported certainty.

## Evidence boundary

A non-unknown claim requires:

- source or evidence reference;
- authority/reviewer/provider;
- verified timestamp;
- optional freshness deadline.

A `verified` claim whose `validUntil` has passed is evaluated as stale at runtime.

A conflicting claim requires at least two source/evidence references.

No current Moscow accessibility facts are introduced by this Phase 1 contract.

## Supported profile features

The generic contract can represent:

- step-free status;
- stairs;
- steep slope;
- surface;
- entrance accessibility;
- lift;
- ramp;
- rest point;
- accessible toilet;
- temporary obstruction.

Phase 1 route eligibility uses the `step-free` feature only.

## Step-free route decision

User intent:

- `none`;
- `preferred`;
- `required`.

Decision states:

- `not-required`;
- `verified-step-free`;
- `verified-barrier`;
- `needs-accessibility-authority`;
- `preferred-with-unknowns`.

For `required` intent:

- any verified barrier -> `verified-barrier`;
- any missing / unknown / stale / conflicting required subject -> `needs-accessibility-authority`;
- only if every required subject has current verified step-free evidence -> `verified-step-free`.

For `preferred` intent, unknown/stale/conflicting data remains visible as `preferred-with-unknowns`; it is never silently converted to a verified accessible route.

## Routing boundary

- Moscow remains route/itinerary authority.
- Valhalla/OpenTripPlanner/other routers may later propose candidates.
- Router geometry does not prove accessibility.
- Straight-line/geodesic estimates cannot assert accessibility.
- Street-level imagery may support review orientation, but stale imagery cannot independently confirm current access.
- User preference does not create a venue/route fact.

## Repository authority

- contract: `src/travel/accessibilityRouteProfile.ts`;
- tests: `tests/accessibilityRouteProfile.test.ts`;
- documentation: this file.

## Next integration

After the contract is green:

1. persist trip accessibility intent in Personal Trip;
2. expose `none / preferred / required` in trip setup/editing;
3. attach verified accessibility profiles to curated route/stop/entrance subjects;
4. surface `unknown/stale/conflicting` in route UI;
5. only then use accessibility metadata as an itinerary optimisation constraint.

No provider/field gate is bypassed by this contract.
