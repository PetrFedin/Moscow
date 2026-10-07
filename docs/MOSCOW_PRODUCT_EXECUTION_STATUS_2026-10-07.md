# Moscow Product Execution Status

**Date:** 2026-10-07  
**Authority:** `MOSCOW_EXECUTION_ROADMAP_2026-10-07.md`

## Wave 1 — Traveler core consolidation

Status: **IN PROGRESS / PLAN + MEMORY FOUNDATION IMPLEMENTED**

Already present:
- one-day / multi-day Plan authority (internal type remains PersonalTrip);
- fixed/manual commitments;
- ticket/reservation wallet semantics;
- Today authority;
- schedule conflicts;
- free windows;
- adaptive replan;
- visit recording;
- persistent My Moscow memory independent of the active Plan;
- revisit vs new-for-me continuation;
- idempotent visit synchronization across multiple plans;
- RU/EN/ZH;
- persistent light/dark theme authority;
- responsive phone / tablet / desktop shell;
- simplified Plan / Today / My Moscow product language.

Still to harden:
- make Today the default returning-user landing policy after plan activation;
- add saved-for-later memory independent of active Plan;
- add completed-plan archive/recap without coupling My Moscow to plan lifetime;
- complete add-to-trip from non-Explore discovery surfaces;
- remove remaining legacy Varvarka-first labels/data dependencies from generic flows;
- complete full cross-language Golden Path.

## Wave 2 — Broad City Discovery & Event Engine

Status: **ACTIVE / DECISION ENGINE IMPLEMENTED**

Completed:
- primary navigation: Today / Moscow / Trip / Wallet / My Moscow;
- Today and Wallet promoted to first-class surfaces;
- Trip OS visits surfaced in My Moscow;
- browser E2E for Explore → Trip → Today → Wallet → Visit → My Moscow;
- Explore → pending add → Trip placement authority;
- day/time selection from event time or free windows;
- conflict detection before insertion;
- optional user-declared ticket/reservation → Wallet;
- user-confirmed visit → completed item / trip history;
- canonical broad city discovery kinds;
- event timing and recurrence authority;
- open-now / starts-30 / starts-60 / starts-120 filters;
- free-window fit;
- novelty;
- category/district breadth;
- organic ranking;
- separate sponsored inventory;
- explicit demo/provider truth;
- multi-district synthetic catalogue;
- Opening Hours Authority: open / closing-soon / closed / unknown;
- Price & Budget Fit: free / budget / mid / premium;
- Family & Age Fit including adult-only rules;
- Accessibility Fit with required-step-free fail-closed behavior;
- Travel Friction adapter boundary and demo travel estimates;
- total-time / experience-share calculation;
- weather suitability boundary;
- explainable positive reasons / cautions / blockers;
- contextual collections: Tonight / Weekend / Rainy day / Free / New district / Family / After theatre / Continue evening;
- Explore Decision Engine UI with context controls and explanation badges;
- City Pulse load-balancing demo.

Next:
- integrate recurring event occurrences directly into Explore date surfaces;
- canonical venue identity binding for discovery items;
- opening-hours overnight intervals and holiday exceptions;
- authoritative weather adapter boundary;
- travel-time provider adapter contract;
- collection-aware add-to-trip defaults;
- broaden browser E2E across RU / EN / ZH;
- remove remaining legacy Varvarka-first dependencies from generic traveler flows.

**Wave 2 exit target:** a tourist can use a broad Moscow catalogue to choose a contextually suitable option, understand why it fits, add it safely into the trip, execute it, and preserve the visit in My Moscow without fabricated live-provider truth.

## Wave 3 — Ratings & Trust

Status: NOT STARTED.

## Wave 4 — Partner Console

Status: PARTIAL FOUNDATIONS EXIST in marketplace/partner authorities; UX consolidation pending.

## Wave 5 — City Tourism Intelligence

Status: STRONG ANALYTICAL FOUNDATIONS EXIST; needs tourism-product consolidation rather than more governance modules.

## Wave 6 — Event Development Loop

Status: PARTIAL authority foundation; end-to-end product loop pending.

## Wave 7 — Integrations

Status: adapter boundaries exist; real providers remain optional and require authorised access.

## Wave 8 — Government sales hardening

Status: investor/government guided route exists; must be updated around broad citywide product rather than legacy pilot geography.

## Wave 9 — Controlled live pilot

Status: DEFERRED until the reference MVP is commercially and product-complete.

## Wave 10 — Scale

Status: FUTURE.


## Product correction implemented — Plan + persistent My Moscow

The current traveler model is now:

`Plan → Today → Visit → My Moscow → Revisit / New for me → New plan`

Implemented:
- active Plan remains editable and disposable;
- My Moscow is stored separately from the active Plan;
- clearing the current Plan does not clear visit memory;
- repeated synchronization of the same visit is idempotent;
- a genuinely new visit to the same place increments repeat count;
- discovery items preserve stable identity into memory when available;
- My Moscow exposes visit history, revisit actions and new-for-me ideas;
- browser Golden Path now validates memory persistence after starting a new Plan;
- dark/light theme authority persists user choice;
- core traveler surfaces use shared theme tokens.

This directly adopts the relevant direction from `GITHUB_TECH_RADAR_AND_CITY_PRODUCT.md`:
Personal Itinerary Authority → Plan Reconciliation / Visited History → Day Replan → next free day / repeat visit.

The older heritage field-pilot sequence remains valid only for spatial-accuracy claims and does not control the broad traveler MVP.
