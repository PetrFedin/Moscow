# MOSCOW Companion OS — competitive benchmark, product architecture and zero-cost execution (2026-10-12)

Status: PRODUCT TARGET / IMPLEMENTATION ROADMAP, NOT FEATURE-COMPLETION EVIDENCE.
Parent: docs/MOSCOW_COMPLETION_AUDIT_AND_RELEASE_PLAN_2026-10-11.md (Draft PR #155).
Spatial authority: docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md (must not override MOSCOW-INT-00).
Current integration baseline: PR #157, head 1543ef003a67a9976d44eb839b4d0686613e24c6, quality SUCCESS #38179780718. Source PRs #152 and #153 both passed exact-head CI.
Product boundary: Moscow first; architecture should be multi-destination-ready but do not pretend all cities are covered. Zero paid additions by default.

## Mission and distinctive wedge

A personal leisure companion that knows what the person wants to do, what they have already booked, where they are in their day *when the person has consented to share location*, what has changed, and what they actually chose or visited. Make one intent turn into one executable next step.

Continuous loop:
DISCOVER -> WANT -> PLAN -> VERIFY -> BOOK/IMPORT -> GO -> REPLAN (if necessary) -> VISIT -> REMEMBER -> RECOMMEND NEXT.

Differentiating product hypothesis (requires field validation, NOT a claim of world-first features):
- A truthful, executable day rather than a pretty static wish list.
- Acceptance receipts that preserve fixed commitments, explain why a route changed and survive reload.
- Source-backed city-history narrative as an optional part of any outing; historian/editor provenance distinct from exploratory hypotheses.
- Traveler-driven Memory Passport connected to the exact journey and explicit visit evidence.
- Calm situation-aware concierge, respectful privacy and transparent uncertainty, not forced sessions or gamification.

Success is time saved and enjoyable outings, not artificially extended screen time. No dark patterns, compulsive badges, involuntary personalization or sponsored recommendations masquerading as organic results.

## Competitor benchmark — feature facts only, checked 2026-10-12

| Product | Verified primary strength | Moscow adoption | Caution/anti-pattern |
| --- | --- | --- | --- |
| Wanderlog | itinerary + maps, routes, group collaboration, reservations, budgeting, offline and AI | one day timeline, map-linked stops; later group plans, expenses | never bloat first viewport; route optimizer is not evidence of availability |
| TripIt | independent booking confirmation forwarding, documents, trip consolidation | booking wallet with provenance, optional import | no automatic provider-confirmed status from forwarded emails alone |
| Google Maps | lists, directions, local discovery, visual place context | save/discover/map handoff and clear directions | do not attempt to replicate all mapping data on zero cost |
| 2GIS | rich city directory, offline map, navigation | accurate entrance/transport details, offline fallback | respect licenses/data contracts; do not scrape |
| RUSSPASS | trips, tickets, restaurants, navigation, AR game and as of Mar 2026 AI trip builder | Moscow-specific local commerce and family utility later | AI itinerary/AR gamification alone are NOT differentiation; no invented partner inventory |
| GetYourGuide | mobile tickets, instant confirmation, booking support/cancellation per offer | verified booking status + cancellation policies | NEVER present user-declared tickets as confirmed by supplier |
| Klook | activities, tickets, transportation, hotel and voucher workflows | later travel essentials, wallet, provider truth | explicit final booking confirmation and fees before action |
| izi.TRAVEL | GPS/audio storytelling for city/museum, media narratives | walking audio and expert stories | opt-in location/audio and non-intrusive behavior |

Official primary references:
- https://wanderlog.com/ 
- https://www.tripit.com/web/free
- https://blog.google/products-and-platforms/products/maps/google-maps-updates-summer-travel-2024/
- https://help.2gis.com/question/2gis-mobile-apps
- https://www.rustore.ru/catalog/app/ru.russpass.tourist
- https://welcome.moscow/news/v-servise-russpass-poyavilsya-ii-konstruktor-turisticheskikh-marshrutov/
- https://play.google.com/store/apps/details?id=com.getyourguide.android
- https://play.google.com/store/apps/details?id=com.klook
- https://www.izi.travel/en/app

Unrepresentative individual product-feedback signals, not market-wide conclusions:
- https://www.reddit.com/r/wanderlog/comments/1gjia9c (repeated tips, performance)
- https://www.reddit.com/r/wanderlog/comments/1h6qa6j (large-list slowness)
- https://www.reddit.com/r/wanderlog/comments/1aq3kj2/ (privacy concern about inbox scanning)
These yield testable UX risks, not objective proof of competitor product quality.

## Product principles (user-visible)

1. State-driven screen. Pretrip: inspire and plan. On trip: NOW / NEXT / TICKET / CHANGE. After trip: Memories and return opportunities.
2. One dominant action in the first viewport. Keep secondary actions in a bottom sheet/detail page. Never bury urgent cancellations or ticket warnings under disclosures.
3. Human language and genuine photographs with rights and offline fallbacks; source attribution readable. No debug/evidence labels on consumer surfaces.
4. Clear truth status: USER ADDED / PROVIDER VERIFIED / CURRENT AS OF [timestamp] / UNVERIFIED / UNAVAILABLE.
5. No commitment rewrites without explicit confirmation, even when route optimizing or AI proposing options.
6. Permissionless exploration first; sign-in optional for sync/purchases. Maintain RU/EN/ZH where already supported.
7. Fast and offline-resilient daily view. No blocking giant maps while the person just needs their next address or ticket.
8. Venue detail must answer: Why go? What's special? How long? Where? Tickets? Verified today? What else nearby? Accessible? History?
9. Distinguish suggested/estimated from checked/live; do not claim open-now or travel-time from static content alone.
10. Accessible, calm and honest: touch targets >=44px, dynamic font sizes, contrast, VoiceOver/TalkBack, reduced motion, no endless popups.

## Navigation architecture: 5 surfaces, 3 contexts

- Discover: editorial hero, "What do you feel like?", 1-tap themed suggestion and search/filters, map browse.
- Today (My Trip): large Now/Next and live disruption, day timeline, booking wallet and one "continue" action. When no trip: create/import in 2 taps.
- Explore Map: place/map split and layers, navigation handoff; historical timeline optional, not required for basic use.
- Experiences: bookable events, restaurants, museums, guided tours, family ideas. Until real supply, explicit directory/deep-link without fake confirmation.
- My Moscow: saved and visited; story, photos/notes, recommendations based on consented visits; exports and deletion.

For existing five-tab implementation, avoid introducing a sixth new nav tab in P0: stage Experiences via Discover and Today, and keep existing Walk tab until migration meets accessibility and test gates.

Modes:
- planning / live-day / completed-day;
- solo / couple / family / group later;
- weather-dependent recommendations only when a verifiable weather source exists;
- accessibility and budget preferences affect suggestions without unsupported suitability claims.

## Modules and boundaries

1. Destination Content Authority: venue IDs, coordinates, source provenance, rights, localized text, hours with freshness; commercial placements separately labeled. Current reference package remains Varvarka heritage only; do not make restaurant data up.
2. Moment / Discovery Engine: intent + time budget + curated eligible places -> suggestion and honest estimate, with price and availability omitted when unknown. Implement first locally from source-backed pilot route. Not a fake "AI" call.
3. Personal Trip Authority: days, ordered stops, fixed commitments, user preferences, revision, accepted local replacement history.
4. Itinerary Constraint/Route Engine: time windows, capacity/closures, current travel evidence; never optimizes across a locked booking without consent.
5. Booking Wallet / Provider Gateway: imported/user-declared vs provider-confirmed; encrypted/consent-aware secrets, signed webhook, cancellation/fulfilment; external YCLIENTS gate stays blocked without real authorized proof.
6. Journey Runtime: start / pause / continue / replan-required / accepted replacement / mark visit / missed, after-reload continuity and offline safe fallback.
7. Companion Orchestrator: orchestrates tools/authorities, never overrides them, always shows reason, scope, source freshness, next viable action. A language model, if used later, may interpret intents but never invent places/inventory or commit bookings.
8. Memory Passport: voluntary check-in and note/photo, user-controlled history and deletion, evidence class; location never by itself equals visited.
9. History/Time Machine: sources, certainty, visual overlays and audio; AR Phase 0 remains separately gated.
10. Analytics & Experimentation: event version, consent, error recovery, funnel and task success; exclude personal ticket QR and precise geodata by default.

Shared identity/references: DestinationId, EntityId, TripId, DayId, ItemId, CommitmentId, VisitId, AcceptanceReceiptId, ContentVersion, DataProvenance and UserConsentScope. No broad monolithic state machine replacing independent authorities. Version adapters and migration tests mandatory.

## First implementation wave (P0, free)

P0.0 Verify #157 exact SHA GREEN (already true for 1543ef00) and retain Draft until real visual proof.
P0.1 "My moment" discovery on first view. Show a small number of actual curated Varvarka walks from source-backed data (15/30/45 minutes) using existing touristPlanner, with explicit *editorial estimate* and explicit destination scope. One click selects a proposal, next action explicitly starts/resumes; active walk must not be silently overwritten.
P0.2 Today hero visually prioritized; saved ticket reachable without scrolling through diagnostics. Primary CTA must change with state: create, continue, navigate, or confirm replacement.
P0.3 Trip receipt summary and next fixed commitment remain visible after reload; verify actual paths in Browser E2E.
P0.4 Visual QA with screenshots captured from Playwright in GitHub Actions (375px/768px/desktop); raw artifacts with PR SHA, with protected masks on any ticket/PII. Follow with physical-device walkthrough, no falsely declared "visual pass".
P0.5 Build state-preserving visit notes (short text only), clear user/declaration status, offline and reload tests. Photos only after rights/privacy/storage/export/delete design and implementation.
P0.6 Deploy exact admitted main SHA and verify health, saved trip, live provider and rollback independently.

## Growth phases

P1 — Citywide catalog, search, districts, filters, editorial photo rights registry, near-you with opt-in location; genuine open-hours freshness, wheelchair suitability supported by venue data.
P1 — Tickets: manual -> deep link -> real partner sandbox -> provider confirmed only with evidence; price/fees & cancellation and disabled "book" until contract.
P1 — Group trip: invite, comment, preference votes, deterministic revision conflicts; fixed bookings owned per participant.
P1 — Opt-in account, backup/recovery and cross-device sync without loss of locally accepted receipts.
P2 — Expert city content, audio tours, provenance-linked archive/time machine, 3D/AR ONLY after independent field gate; creator/co-curator business after rights and moderation.
P2 — Budget, split costs and accessibility/travel profiles, assisted travel and family navigation.
P3 — Expand beyond Moscow only after local density, quality, data partner economics and pilot outcomes meet acceptance criteria.

## Suggested P0 UX contract: one coherent day

PRETRIP: inspirational home -> select 30-minute historic experience -> preview actual stops and editorial time estimate -> start walk.
LIVE: Today shows verified next stop; ticket pinned; unsupported "open now" never shown as fact.
DISRUPTION: closure evidence -> route-verified alternate -> review -> explicit accept -> preserve theatre ticket -> local receipt.
CONTINUE: after reload show accepted route and next theatre with correct time; stop->user marks visited -> Memory Passport; no GPS-auto visit.
POSTTRIP: optional "remember" -> attach private note -> recommend a distinct, source-backed nearby experience; no repetitive push spam.
FAILURE: no source -> honest unavailable, safe retry, manual fallback; offline -> existing plan/ticket remains usable if local store is healthy.

## Acceptance targets (proposed goals, NOT measured product results)

- >=90% of first-time test participants can begin a real curated route without help in <=2 taps from Discover.
- >=90% can find the next fixed ticket in <=2 taps from any "Today" state.
- 100% of automated accepted-replacement fixtures preserve exact fixed ticket fields and local receipt on reload.
- 0 "provider confirmed" claims without signed/provider evidence, 0 false open-now claims.
- Accessibility: 375px/mobile, 768px/tablet, desktop; keyboard, high font scale; no hidden blocking errors; WCAG-aligned target sizes.
- Offline: existing plan and manual ticket accessible; changes reconciled and clearly attributed when connectivity returns.
- Qualitative usability: 5+ moderated sessions per target profile (solo, group, family, accessibility); do not label an interface "best on market" until supported by independent research.

## Zero-cost architecture discipline

- Reuse Expo/React Native, existing local-first persistence and Playwright/GitHub Actions without adding paid infrastructure.
- Build read-only demos and stub provider adapters without creating billable traffic or presenting mocks as live.
- Map/route/media APIs have license & quota review gates. Open source is not the same as zero hosting cost.
- Optional generative AI MUST have a zero-fee execution path and verified data source. Text/UX can start deterministic.
- No automatic third-party inbox scanning, background location recording or photo uploads before consent and control.
- Explicit environment/credit verification before adopting booking or cloud database providers. Never pay without authorization.

## Traceability

Implementation requires PR links, exact SHA CI, representative screenshot artifacts, UX signoff, provider truth evidence, rollback and clear status from "planned" through "production proven".
