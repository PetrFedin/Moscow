# MOSCOW — Product completion audit and ordered delivery plan
Status: REVIEW PROPOSAL — evidence as of 2026-10-11
Base revision: main 13d8fbc76ba11e6912be7489c7be24ff66c6409d
Canonical integration authority: docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md

## Evidence policy
Only code presence, CI checks, real external source observations, device screenshots and properly sourced field records can support a claim of completion. Distinguish: planned / code present / test green on exact SHA / live deployed exact SHA / field or provider verified / product accepted. A successful build is not mobile, provider, or user-pilot proof. This document does not override existing safety and admission gates.

## Verified audit snapshot
- main head 13d8fbc; quality run 38091874925 succeeded.
- PR #152 post-accept continuation, head 2d025cdd, failed quality #38093411227 due to importing an undeclared vitest runner in tests/postAcceptContinuation.test.ts. Repair commit c80002ad switches to node:test and node:assert; its CI must be checked at exact head before merge.
- PR #153 tourist-first interface, head 8eafed98, failed quality #38168445297: 19 browser E2E failures, 5 passing; unit contracts, typecheck and web/ios/android exports passed. Existing tests assume previously always-visible panels while the proposed UX puts planning/heritage and trip diagnostics behind disclosure. Repair tests for explicit disclosure interactions and add tests preserving accessibility and real disruption alerts.
- PR #154 institutional proposals passed CI #38165898496, docs only, remains draft.
- Render moscow-mobile-preview autoDeploy is enabled from main. Its most recent listed live deployment was 840248491, NOT main 13d8fbc: exact-main deployment must be reconciled and health/ready/user flows proven before any production claim.
- Original spatial MOSCOW-INT-00 Romanov / Old English Court / supervised-user real evidence remains blocked. Provider #74/#73 and signing remain gated on real provider evidence. Neither block prevents improving citywide itinerary UX.
- Source: GitHub PR/Actions, Render service/deploy metadata, canonical master plan and Personal Trip OS.

## Product north star
Discover -> inspect place -> add to multi-day trip -> book/import verified or user-declared commitment -> navigate with truthful routing -> visit -> handle disruption and explicitly accept a replacement -> resume without disturbing fixed tickets -> record notes/photos/visit -> view personal Moscow passport -> next recommendations.
Historical Time Machine, field-valid AR and B2B/B2G must remain distinct authority lanes above shared destination data.

## Delivery order, ownership, dependencies, acceptance and rollback

### P0 / A. Exact-head release hygiene (first)
Scope: CI regression on #152 and #153; snapshot the deploy SHA; reproduce failing locators and inspect Playwright artifacts. Do not skip, delete or loosen business assertions. Stable tests must open now-collapsed sections through accessible controls and independently verify that genuine P0 alerts remain visible.
Dependencies: GitHub Actions, Playwright, Render.
Done: exact SHA GREEN, visual tests and evidence linked, deployment commit reconciled, rollback identified.
Rollback: keep draft unmerged, main unaffected.

### P0 / B. Tourist-first Discover, Map and navigation
Deliver a photo-led first screen with rights-checked local fallback, large single trip CTA, district/theme editorial cards, accessible five-tab navigation, coherent saved/visited state, unmistakable progress and empty/error/offline states.
Dependencies: destination package, experience persistence, saved locations, onOpenPlace navigation, RU/EN/ZH strings.
Acceptance: unauthenticated visitor reaches trip in <=2 deliberate interactions, place detail and route are reachable, keyboard/touch/375px/768px/desktop usable, no untranslated diagnostic status first fold. Do not claim source-media licence until reviewed.

### P0 / C. Personal Trip v2 and Today home
Show "Now / Next / Day timeline / Ticket / Alternative" with card imagery; move evidence counters to expandable diagnostics, but show booking collision and disrupted itinerary as prominent alerts even when expanded details are closed. Build one in-trip timeline, map handoff and saved-place add, multi-day move/reorder, time windows, editable preferences, explicit confirmation of edits.
Dependencies: PersonalTrip, Scheduler, TouristToday, DayComposer, BookingWallet and route adapter.
Acceptance: create trip, add museum plus fixed theatre ticket, reload and preserve both; change flexible schedule; fixed commitment remains unchanged without consent.

### P0 / D. Real disruption and accepted continuation
Current live-city change -> replan-required alert -> source-backed candidates -> current route proof -> explicit acceptance -> durable Acceptance Receipt -> visible replacement and next fixed commitment -> continue itinerary -> add visit. Design immutable receipt ID, exact trip revision and before/after source references, timestamp and idempotency key. No stale-route acceptance, and never change fixed ticket.
Dependencies: Live City, canonical geometry, current routing, replacement engine, persisted personal-trip revisions. PR #152 read-only projection is a starting point, not whole feature.
Acceptance: browser E2E with open/closed provider fixtures AND separate real endpoint evidence; acceptance survives reload; stale receipts rejected; duplicates do not double-apply; history shows why/when the plan changed.

### P0 / E. Visit evidence, Notes, Photos and Passport
User-driven check-in, optional caption/photo, verified vs self-declared distinction; upload only with explicit storage/privacy consent, media ownership, retention and deletion design; allow export and keep visit ledger append/reconcile-safe. Never mark visited solely on proximity.
Dependencies: visit ledger, passport, persistence and secure media storage.
Acceptance: route stop->visit->photo/note->history->next recommendations; offline queue, duplicate checks, delete/export and permissions QA.

### P0 / F. Real mobile and release admission
iOS Safari / Android Chrome / desktop (browser), actual supported native device for AR, accessibility/reduced motion, network offline/reconnect, cold start, navigation stack, screen rotation, package versions, server truth and data migration. Use seeded and non-seeded profile cases; record video/screenshots and reproducible test fixtures.
Acceptance: a fully repeatable end-to-end tourist day, exact release SHA, no broken controls and explicit NO-GO on severe crashes, inaccessible tickets, corrupted history or false availability. Preserve main branch until all gates pass.

### P1 / G. Ticket and reservation bridge
Manual entry -> QR/attachment privacy -> calendar/share import (rights and user consent) -> supported provider deep link/return -> state machine for provider-confirmed when authenticated proof exists. Evaluate restaurant/theatre/museum providers individually by actual access, contract, test company, API capability and pricing.
Dependencies: provider adapters, secret storage, lawful processor agreements, booking wallet.
Acceptance: successful provider sandbox operation, webhook signature and duplicate/event-order defense, cancellation/reschedule, final status receipt; fallback manual remains explicitly unverified. Provider signing gate only after real PASS.

### P1 / H. Route intelligence and live truth
Provider freshness, timeout and fallbacks, geometry attribution and exact endpoints, accessible routing facts, walk/transit time bounds, open-hours/event status source metadata; optional OR-Tools/OTP only if verified data and zero-fee infrastructure constraints permit.
Acceptance: no invented open-now or ETA; routing claims carry source+timestamp+expiry, fail closed when stale, fixed bookings never silently move.

### P1 / I. Content and media quality at city scale
Curated high-quality POIs across museums, theatres, restaurants, neighbourhoods and architecture. Each card: media rights, venue/coordinates, accessible description, verified sources, language, publication state, freshness, hours-data provenance. Editorial review/correction workflow and broken-link checks.
Acceptance: reproducible publish, removed/closed entries not falsely recommended, clear content confidence and consistent cross-surface names. Do not scale field-dependent AR packages until Phase 0.

### P1 / J. Identity, sync and backups
Retain anonymous local-first experience; introduce optional account and cross-device sync only with conflict strategy, explicit consent, migration from moscow:v1:personal-trip, key and backup/restore test, access control, erase/export privacy rights.
Acceptance: offline edits + two-device conflict exercise, backup and restore proof, no ticket QR leaks in analytics and no loss of accepted receipts.

### P1 / K. Spatial heritage proof in parallel
ROMANOV field anchor metrics + survey provenance + repeatability and performance on physical devices -> Old English Court second-object package and repeatability -> supervised visitor pilot -> review and publish approved Destination Package v2. Use sensor-quality fallback, source/confidence labels, glTF validation and archival rights.
Acceptance: MOSCOW-INT-00 real evidence PASS, not mocked or merely code-present. Only then expand spatial ingestion / signed offline manifests and later city-scale 3D.

### P2 / L. Commercial, municipal and partner product
Before city partnership claims: sample pilot execution, operations SLA, verified technical/security/privacy/legal requirements, government meeting 12-step route, resume+presenter view, one-page Pilot Brief, data room and honest acceptance pack. Partner CMS/API/concierge/white-label are subsequent controlled layers, not P0 tourist blockers.
Acceptance: actual meeting rehearsal and documented external-owner feedback, no simulated institutional approval or ROI.

### P2 / M. Analytics and product performance
Consent-aware events for discovery->trip->save->start->ticket add->disruption->accept->visit->return; record failure types and release SHA, anonymized aggregates, build-level dashboards. Avoid precise traces by default. Track user success and discoverability rather than counts of technical panels.
Acceptance: repeatable funnel definitions, privacy tests and verified field/browser event payloads.

## Cross-layer dependency matrix
| User surface | Domain authority | Source/providers | Storage/evidence | Mandatory test |
|---|---|---|---|---|
| Discover/place | DestinationPackage, place registry | editorial provenance | published package/cache | discover->detail, stale/rights |
| Map/nearby | geometry/routing + device permissions | map/Valhalla as available | route proof snapshot | permission denied/offline |
| My Trip | PersonalTrip, Scheduler, Today | user and destination data | local-first migration, later optional sync | create/edit/reload/conflict |
| Ticket Wallet | commitment verification | manual/provider receipt | protected reference/QR | unverifiable remains user-declared |
| Replan | Live City -> disruption -> replacement | live source + current route | acceptance receipt + immutable history | stale & idempotency & fixed ticket |
| Walk/visit | JourneyRuntime / Visit Ledger | source-backed stops | consented visit/photo/notes | pause/resume/history |
| Time Machine | TemporalScene / Spatial authority | archives/field review | signed spatial package later | disclosure/AR fallback |
| City meeting | institutional evidence/decision | verified partners | dossier/acceptance package | 12-step demo, no false PASS |

## Definitive release gates
G0: clean exact HEAD CI; no skipped contract assertions.
G1: 375px, tablet, desktop and real mobile visual interaction proof.
G2: golden user path from discovery through multi-day accepted itinerary and history after reload.
G3: availability/routing/booking truth discipline incl stale/unverified states.
G4: data integrity migrations, crash and offline recovery, tickets and privacy.
G5: real provider and field gates separately acknowledged with independent evidence.
G6: exact running deployed SHA, health/ready, smoke paths and rollback. Never equate a green PR with a live release.

## Near-term PR order
1. #152 node:test repair -> exact HEAD GREEN -> review. Do not merge without acceptance receipt architecture review.
2. #153 replace old always-visible test assumptions with explicit disclosure actions; preserve critical alerts outside disclosure; add navigation and viewport QA -> exact HEAD GREEN.
3. Production deployment reconciliation: observed Render live commit 8402484 vs GitHub main 13d8fbc; investigate auto-deploy behavior and do not infer the main is live.
4. PersonalTrip progressive UI polish and visible current disruption.
5. Persisted receipt/history PR with migration and replay.
6. Post-accept continuation UI and visit notes/photos PR.
7. YCLIENTS real authorized provider gate and field Phase 0 in independent workstreams.

## Cost discipline
Prefer open-source tooling and existing free services. Verify Render limits and provider/API/media licences before adoption. Free-tier feasibility is a hypothesis until tested; do not initiate billable services or imports without approval.

## Supporting records
- https://github.com/PetrFedin/Moscow/pull/152
- https://github.com/PetrFedin/Moscow/pull/153
- https://github.com/PetrFedin/Moscow/pull/154
- https://github.com/PetrFedin/Moscow/actions/runs/38093411227
- https://github.com/PetrFedin/Moscow/actions/runs/38168445297
- docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md
- docs/PERSONAL_TRIP_OS.md
- docs/TOURIST_FIRST_UX_REDESIGN_2026-10-11.md (PR #153)
