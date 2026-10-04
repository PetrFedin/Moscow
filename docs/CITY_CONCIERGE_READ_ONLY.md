# City Concierge — Read-only Phase 1

Issue: #128.

Canonical source: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` → Premium commercial wave — governed AI City Concierge.

## Goal

Create the first safe commercial Concierge layer above Personal Trip OS without pretending that an external AI model, live provider or city feed is configured.

Phase 1 is intentionally read-only:

`bounded question -> typed intent -> existing Moscow authority -> grounded facts -> visible source state`.

No itinerary mutation, booking call or hidden replan occurs.

## Why this comes first

The Master Plan sequencing is:

`Personal Itinerary + source authority + provider boundaries -> read-only concierge -> plan proposals -> replan -> approved booking/action tools`.

The first slice proves the most important product behavior before adding model autonomy: Moscow can answer a visitor from known trip truth and can refuse to invent changing external facts.

## Read-only intents

Phase 1 supports:

- trip overview;
- today's known plan;
- next confirmed ticket/reservation;
- current/next calendar free window;
- visited history;
- visible trip preferences and constraints.

A deterministic RU/EN/ZH phrase router maps a small set of natural-language questions to these typed intents.

Unsupported prompts stay unsupported.

This router is not presented as a general-purpose AI model. A future LLM/agent adapter may call the same typed authority.

## Grounding model

Every returned fact carries:

- authority;
- verification state;
- optional source/evidence reference.

Current authority classes include:

- `personal-trip`;
- `destination-package`;
- `provider-receipt`;
- `visit-evidence`;
- `local-schedule`;
- `user-preference`;
- `system-default`.

### Commitments

A user-declared ticket/reservation stays:

`personal-trip + user-declared`.

It never becomes provider-confirmed merely because the Concierge repeats it.

A provider-confirmed commitment can surface:

`provider-receipt + provider-confirmed + receiptEvidenceRef`.

### Visits

Visit grounding preserves the original evidence class:

- user-confirmed;
- route-completed;
- provider-receipt;
- proximity.

### Preferences

Explicit stored preferences are labelled user preferences.

Unchanged defaults are labelled system defaults and are not presented as user-approved choices.

## External/live truth boundary

Phase 1 does not answer unsupported current facts such as:

- opening hours;
- closure;
- live ticket availability;
- price;
- live booking availability;
- weather;
- current accessibility condition.

If a prompt asks for these and no configured authority is present, answer state is:

`unsupported-live-fact / external-live-fact-not-authorized`.

No fallback model guess is allowed.

## Free-time boundary

A free window is derived only from:

- Personal Trip scheduled intervals;
- fixed commitments;
- day bounds;
- reserved preference windows such as lunch.

It is labelled local schedule derivation.

It never asserts:

- routing feasibility;
- opening-hours feasibility;
- accessibility feasibility;
- weather suitability;
- live availability.

Those booleans remain false in every Phase 1 answer.

## Read-only guarantee

`CityConciergeAnswer.boundaries` fixes:

- `readOnly=true`;
- `providerActionAllowed=false`;
- `routingVerified=false`;
- `openingHoursVerified=false`;
- `accessibilityVerified=false`;
- `weatherVerified=false`;
- `liveAvailabilityVerified=false`.

The answer path imports no mutation/replan/provider action function.

Tests snapshot the trip before/after answers to prove no mutation.

## Privacy / memory boundary

Phase 1 does not persist free-form Concierge conversation.

It uses the existing local Personal Trip state for the current answer only.

It does not infer sensitive traits from:

- visited places;
- questions;
- preferences.

A later memory layer must be separately governed.

## UI

`CityConciergeCard` is embedded in My Trip and provides:

- RU/EN/ZH quick questions;
- bounded text prompt;
- read-only disclosure;
- live-data warning;
- source/verification line under each fact;
- explicit provider-receipt vs user-declared distinction;
- schedule-only caveat for free windows.

The rest of My Trip works independently of Concierge.

## Repository authority

- typed router/answer contract: `src/travel/cityConcierge.ts`;
- visitor surface: `src/features/trip/CityConciergeCard.tsx`;
- integration: `src/features/trip/PersonalTripPlanner.tsx`;
- contract tests: `tests/cityConcierge.test.ts`;
- browser E2E: `tests/personalTrip.e2e.spec.ts`;
- runbook: this file.

## Next sequence

Only after this read-only layer is stable:

1. conversational constraint capture into visible editable trip preferences;
2. explainable plan proposals with structured diffs;
3. explicit acceptance;
4. existing Day Replan authority;
5. configured live providers;
6. approved booking/action tools.

No provider action should be added merely to make the Concierge feel more autonomous.
