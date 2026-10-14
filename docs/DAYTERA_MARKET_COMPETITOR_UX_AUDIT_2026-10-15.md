# DAYTERA (working name) — Russian & international market and UI audit
Review date: 2026-10-15. **Research / design proposal, NOT a shipped brand or feature.**

## Scope and method

This is a **selected competitive landscape**, not a mathematically exhaustive census of all global travel applications. The shortlist is chosen by substitutability in five jobs: find a place, plan a day, buy/import a commitment, recover from change, and remember actual visits. For each competitor, cite the vendor's own feature pages or official distribution listing. A publicly undocumented function is **unknown**, not "competitor does not have it". Public marketing statements are not independent quality certifications. Moscow status is read from branch `feat/moscow-crash-safe-trip-storage-20261014` PR #175 and the master plan — NOT from production.

Legend: **Documented** = explicitly in cited source; **Draft in Moscow** = source or tests in open PRs only; **Gap** = code not evidenced as end-to-end working; **To verify** = independent manual QA or provider proof required.

## A. Russian market

| Service | Documented capabilities / strongest case | Where our draft trails | What to adopt |
| --- | --- | --- | --- |
| [RUSSPASS](https://www.rustore.ru/catalog/app/ru.russpass.tourist) | End-to-end Russian multi-region discovery, trip plans, museum/excursion tickets, hotel and restaurant reservation, navigation, AR quest, loyalty. Official iOS release notes also describe "Мои планы", venue catalogue and restaurant booking. | Major gap in verified national coverage, transaction inventory, app polish and real commerce. | Place/event/restaurant catalogue, official-ticket handoff, photo cards, regional model, trust labels. Compete by live trip execution and explicit replan receipt, *only after real browser/provider evidence*. |
| [2ГИС / Гид](https://dostavili.2gis.ru/public/index/public/0726/guide/) | City and district browsing, curated and AI lists, food/parks/culture, map + routes; offline tourist guides in multiple cities. | Gap in coverage, coordinates, venue photos and offline navigation. | Discover by district/occasion; rich card/photomarkers; delegate navigation to proven mapping rather than rebuild cartographic parity. |
| [Яндекс Карты](https://yandex.ru/support/m-maps/ru/save-places) | Search/map/navigation, collections of places, comments; offline transit/walking/auto/cycle navigation officially updated Sept 2026. | Gap in search/route reliability, offline maps, business density and user lists. | Map/list synchronized selections and external navigation; do not promise traffic/routing data unless sourced. |
| [Яндекс Путешествия](https://travel.yandex.ru/trains/) | Booking hotels, apartments, transport and consolidated "Мои поездки" with tickets/bookings. | No transactional inventory/returns at this quality or volume. | Real booking receipts, change/cancellation states and wallet UX; initially import or supplier handoff. |
| [Tripster](https://experience.tripster.ru/about/) | Author-led city experiences, guide identity, reviews, programme descriptions, guided tours; many cities and booking flows. | No comparable qualified supplier marketplace or review corpus. | Experience quality/provenance, small-group and self-guided formats, professional guided content. |
| [Sputnik8](https://www.sputnik8.com/ru/faq) | Live tour choice, dates, guide Q&A, booking confirmation and user account. | No real provider confirmations. | Distinguish offered/held/confirmed/cancelled and clarify meeting point, participant count, refunds. |
| [Ostrovok / Tutu / other vertical OTAs](https://ostrovok.ru/) | Important distribution/booking alternatives; this pass does not independently verify each current capability. | Unknown / requires separate evidence. | Distribution partner candidates; do not mark as feature absence without checking provider contracts. |

2026 TripIt product evidence: https://www.tripit.com/web/pro/pricing (alerts/alternatives) and https://www.tripit.com/web/blog/news-culture/automate-travel-plans-tripit-pro-apple-intelligence (April 2026 document-to-plan). These capabilities cannot be dismissed as absent in competitive claims.\n\nSource anchors: RUSSPASS https://www.rustore.ru/catalog/app/ru.russpass.tourist and https://apps.apple.com/ru/app/id1510365749; 2GIS https://dostavili.2gis.ru/public/index/public/0726/guide/ and https://help.2gis.ru/question/putevoditeli-po-gorodam-chto-takoe-i-kak-polzovatsya; Yandex Maps https://yandex.ru/company/news/16-09-2026-01; Tripster https://experience.tripster.ru/application/; Sputnik8 https://www.sputnik8.com/ru/faq .

## B. International market

| Service | Verified public capabilities / competitive strength | Gap for us | Action |
| --- | --- | --- | --- |
| [Wanderlog](https://wanderlog.com/) | Strong baseline: daily itinerary+map, route optimisation, group live editing, offline trip, booking imports, expenses, checklists, hotel/flight status and guides. | Nearly every consumer convenience outside the local Moscow passport/replan trail. | Day-and-map combined surface, easy add to day, drag/reorder, calendar visibility, genuine offline itinerary, group planning. Avoid trying to beat it with a basic planner clone. |
| [TripIt](https://www.tripit.com/web/pro/pricing) | Confirmation-email importer, itinerary and documents, offline access, disruption alerts and alternative options in Pro; 2026 iOS Pro adds Apple Intelligence photo/PDF-to-plan processing. | Missing reliable input of ticket documents and comparable alerts. | Permissioned inbox/file/share import, preserving original receipt evidence and verifying before upgrading status. TripIt **already supports disruption responses**; our potential advantage is an auditable, fixed-commitment-aware accepted replan — to be tested, not assumed. |
| [Polarsteps](https://www.polarsteps.com/) | Storytelling, visual map travel tracker, photos/videos, privacy audience and travel book; post-trip emotional engagement. | Passport lacks local photo album, visually rich maps and trip story recap. | Private photo-first diary (opt-in), manually chosen audience, personal trip retrospective. |
| [Mindtrip](https://mindtrip.ai/) | Conversational planning, personalized memory of travel style, in-product booking claims and monitoring of changes. | No comparable assistant, long-term preferences, connected bookings. | Only read-only, cited, constraint-aware trip copilot *after* venue authority and confirmation evidence are credible. |
| [Roadtrippers](https://roadtrippers.com/about/features/) | Scenic itinerary and places along long-distance routes; customized detours, collaborative planning and synced devices. | Multi-city/multi-leg itineraries, verified coordinates, route flexibility. | Destination-neutral route legs, location radius, official POI admission; later, road-trip extension. |
| [GetYourGuide](https://www.getyourguide.com/) / [Viator](https://www.viator.com/) | Large activity ticket marketplaces; specific current product flows need independent validation before claiming their features. | Provider inventory, live purchase and refunds absent. | Assess partner availability and deeplinks/confirmation imports first. |
| [Klook](https://www.klook.com/en-GB/blog/how-to-book-with-klook/) | Voucher redemption, booking wallet and offline mobile e-vouchers. | No production e-ticket redemption/QR proof pipeline. | Wallet design and explicit booking vs order-summary distinctions. |
| [Tiqets](https://www.tiqets.com/) | Vertical museum/attraction purchasing; this pass does not prove specific app features. | Integrated museum checkout missing. | Potential partner mapping, not a required custom checkout now. |
| [Tripadvisor](https://www.tripadvisor.com/) / [Airbnb](https://www.airbnb.com/) | Inspiration, reviews and travel products; detailed live app capability assessment pending. | Large photo/review and booking network. | Learn editorial hierarchy; do not ingest copyrighted content without licences. |

**Crucial correction to positioning:** Polarsteps already mixes planning with trip memories, Wanderlog joins itinerary and bookings, TripIt Pro already alerts on disruptions and offers alternatives, and RUSSPASS is already a broad regional platform. "Everything in one app" and "plan + remember" are NOT novel advantages. An integrated *exception-to-replan-to-continued-execution trail with preserved immutable booking commitments* could differentiate us, but it is a **product hypothesis**, not a demonstrated superiority. No competitor absence can be claimed without structured feature-by-feature testing.

## C. What Moscow code actually has (as of PR #175 Draft)

| Capability | Evidence | Release classification |
| --- | --- | --- |
| Current day, next stop, planned time, booked ticket/restaurant note, user check-in | TouristTodayCard, TodayStopActions, PersonalTripPlanner | Draft; exact-head tests on PR #175 green, not public release |
| Local multi-trip archive, import/export JSON, recovery journal | PR #169–175, 570 contract + 37 E2E + 3 visual checks green on f9055141 | Draft; no native device fault injection or multi-tab lock |
| Visit diary, personal notes, food vs culture, known-place identity and suggestions | PR #171–172 | Draft; limited editorial pool (7 Moscow places) |
| Provider source / user-declared tickets, replan acceptance receipts | Booking wallet & day replacement modules | Partially modelled; connected provider production proof blocked |
| Historical AR / 3D Moscow world | Legacy heritage experience | Specialized differentiator, not parity with modern map/booking coverage |
| Real multisite inventory, native checkout, weather/routing current proof, cross-device account sync | No broad authoritative prod evidence | Not admitted / do not claim ready |
| Other cities | Product proposal only | Not available; future descriptor+city gates necessary |

Sources in code: `src/features/trip/TouristTodayCard.tsx`, `src/features/trip/PersonalTripPlanner.tsx`, `src/travel/personalTripTransaction.ts`, `src/travel/moscowNextDiscoveries.ts`, `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`.

## D. Visual teardown / design decisions

This is based on officially published screenshots, stores and vendor sites, **not** a logged-in exhaustive Mobbin screen export. Mobbin's full screen library is accessible on licensed accounts: https://mobbin.com/mcp. We have no verified Mobbin premium access here. Screens may change.

| Reference | Pattern worth reusing | Decision for our product | Reject |
| --- | --- | --- | --- |
| Wanderlog itinerary https://wanderlog.com/plan-a-trip | Date chips + legible day timeline + map & list paired | Itinerary as compact date-based timeline, single visible primary action per stop; desktop split map/day | Crowded tiny annotations; too many equal-priority CTAs |
| 2GIS guide https://dostavili.2gis.ru/public/index/public/0726/guide/ | District & occasion browsing, expressive place photography, map as navigation | Destination landing: collections "1st visit / With children / Food / Evening / Heritage", source-verified media | Rebuilding search/geocoding/navigation from scratch |
| RUSSPASS https://www.rustore.ru/catalog/app/ru.russpass.tourist | Strong regional editorial catalogue, booking surface, simple cards | Venue cards with place type, district, source, booking availability state (UNKNOWN as distinct status) | Invented pricing, fake availability, invented ratings |
| Polarsteps https://www.polarsteps.com/ | Visual route + memories + photo story | Trip Passport photo diary and map, only opt-in and with retention controls | Tracking by default or falsely verified GPS trails |
| TripIt https://www.tripit.com/en-uk/web/how-it-works | Reservation-first trip summary, confidence and time in one place | Wallet above the fold if next booked item is fixed | Importing email without consent; claiming source-verified purchases |
| Mindtrip https://mindtrip.ai/ | Conversational inspiration can populate actionable itinerary | Constrained copilot: only suggest admissible places with citations, no silent edits | Black-box autonomous booking or "AI knows availability" claims |

**Information architecture proposed**
- Tab 1 **Сегодня / Today**: status of current trip + upcoming fixed booking + next recommended executable action. One dominant CTA; important disruption and consent above discovery.
- Tab 2 **Найти / Explore**: high-quality editorial collections, search, map, district, category.
- Tab 3 **Мой план / My Trip**: dates, stops, timetable, commitments, group state.
- Tab 4 **Мои места / Passport**: visits, photos, personal notes, journeys, saved places.
- Map as an accessible cross-surface mode, NOT a fifth opaque backend dashboard.

**Visual system proposal**
- Primary ink dark evergreen `#183C34`; cream content `#FFF9EE`; bright interactive cream `#FFF8E9`; warm gold supporting metadata `#EAD4AA`. Avoid universal dark-on-dark card grids.
- Minimum ordinary text ~13–14 px; body 15–16 px where reading matters, 17–22 px stop titles. Decorative 8–10px content must be raised. Minimum tappable surfaces 44–52 px.
- User-facing labels "Отмечено вами" / "Сведения от источника" / "Подтверждение провайдера" are separate evidence statuses. Never use green trust badge for unconfirmed local notes.
- Use 16:9/4:3 destination and POI photos **only after commercial usage rights checks**. A large authentic place photo + overlay label beats monochrome placeholder cards. Until licensed images, editorial type and vector-safe illustration.
- Reduce to one next action; use expandable advanced tools. Product must no longer feel like a debug console made of rows and switches.
- Reduced motion, dynamic type, accessible screen reader labels; mobile screenshots at 375/768/1440 and manual visual inspection of actual viewport scroll.

## E. Priority order (hypothesis-based; release gates are mandatory, not optional)

| Priority | Why now | Deliverable | Acceptance |
| --- | --- | --- | --- |
| P0 | Avoid user data loss | #175 journal; #173 multi-tab/storage fault work; independent review of PR #157→#175 chain | Exact-head green + native reload/fault injection + no loss of fixed tickets/receipts |
| P0 | "What do I do now?" needs to be delightful | Today redesigned for next action, bigger typography, explicit trust states, one CTA | User completes path today→ticket→arrival/check-in→next without ambiguous controls; 375/768/1440 real screenshots |
| P0 | Destination generic identity | Brand candidate kept out of public UI; pilot registry, per-city timezone; no implicit Moscow fallback | Contract tests; current Moscow routes unchanged; unknown destination blocks |
| P1 | Can't compete with 7 venue cards | 50+ **target**, not achieved, qualified Moscow POIs with source, address and licensed media | Source + rights + date at every published place; provenance and de-dup |
| P1 | Competitors excel at booking import | User-consented booking wallet ingestion (manual/file/email) | Match booking and source proof correctly; hard negative cases / duplicate import |
| P1 | User journeys are shared | Multi-person itinerary, roles and conflict UX | Offline/online conflict policy, E2E permissions |
| P1 | Better travel usefulness | Realistic plan constraints and verified route handoff | Fixed commitments immutable; travel times from authorised map APIs only |
| P1 | Emotional retention | Passport photos, favorite memories, private trip recap | Opt-in, export/delete, no background track claim |
| P2 | Differentiation | Historic city layers and guided insight near relevant stops | Credible evidence chain, performant and nonintrusive |
| P2 | Multi-city scaling | Add one second-city package only after city admission gates | City registry, timezone, source coverage, local regulatory and booking policy |
| P2 | Sustainable monetization | Freemium / booking referral / B2B destination packages | Revenue economics validated with real pilot cohort, not assumptions |

## F. Objective advantage framework (to test, NOT market as fact)

**Hypothesis:** travelers value fewer missed bookings and faster recovery from real-world schedule disruptions more than another inspiration feed.

Proof plan:
1. Recruit 10–15 consented usability testers (planned target, not observed) to perform 6 tasks on competitor baseline where accessible and our app.
2. Tasks: first-place discovery; import a confirmed theatre ticket; reorder other activities around fixed time; encounter closure; accept an evidenced alternative; revisit trip journal after 1 week.
3. Metrics: completion rate, time-to-next-action, errors, lost/rescheduled fixed bookings (must be zero), identity mistakes, confidence explanation score, 7/30-day history reuse.
4. Blindly apply criteria across products; user demographic/data are collected only with consent; no competitor claims based on theoretical feature absence.
5. Gate the market claim "better than X" until statistically meaningful external results. The current draft does not support such a claim.

## G. Brand review

**DAYTERA** / «Дейтера» is a **working internal name** only. Idea: a new day + a place on earth, works without naming a city and can become `DAYTERA · Moscow`, `DAYTERA · Kazan`, `DAYTERA · Istanbul`. Pros: pronounceable RU/EN, not city-locked, supports day-based brand. Cons: similar-sounding DATERA and existing legal entity «ДЕЙТЕРА» surfaced in initial search. **No claim of uniqueness, trademark clearance or free domains can be made.** The actual product remains Moscow. Other alternatives considered: VIAORA, VAYORA, ROAMERA, TRAVERA; searches surfaced existing uses, so not recommended.

Pre-launch legal gate: exact and phonetic variants in https://searchplatform.rospatent.gov.ru/trademarks, https://www.euipo.europa.eu/en/trade-marks/before-applying/availability, https://www.uspto.gov/trademarks/search, classes 9/39/41/42 plus relevant travel commerce; domain and social identity checks; legal sign-off. Do **not** buy domains or replace brand until approved.

## H. Risks / non-goals

- No hidden remote sharing of travel location, photos, contacts or private booking details.
- No authoritative confirmation of live venue status unless its real provider proof exists.
- No imagery copied from competitors or unauthorized third parties.
- No claim that Moscow is already multi-city, or that the draft PR functionality is live.
- No payment, expensive provider, or deployment created by this audit.
- The strongest competitor "absence" claims remain unverified until controlled hands-on testing.

**Source note:** Official pages above were accessed in the October 2026 pass; publisher product pages can be promotional. Numeric counts and ratings deliberately omitted from competitive scoring because they are volatile and not normalized.
