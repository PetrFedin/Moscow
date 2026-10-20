# MOSCOW — Competitive capability audit and product integration roadmap
**Audited:** 2026-10-20  
**Scope:** Moscow traveler app + optional vendor-side RestoDirect/StudioBook partners  
**Status:** evidence-backed planning / Draft PR, NOT released  
**Principle:** Compare real supplier claims and actual source-tree functions, never infer connected APIs or greater objective product performance.

## 1. Product differentiation / non-negotiable
Moscow is an independent, local-first **city experience operating system**:
**discover → evaluate → schedule → check booking truth → visit → private memory → next experience**.

There are two distinct domains:
- **Consumer travel state:** user-owned plan, imported bookings, itinerary timing, memory. This may be saved without a supplier.
- **Supplier transaction state:** authentic inventory, accepted order/booking, price, paid/refunded, ticket. This must come from an authorized provider/merchant and cryptographically or contractually attributable evidence. A traveler clicking a website, importing an ICS or entering a confirmation number is NEVER proof of supplier acceptance.

No competitor has been exhaustively audited: the inventory below is limited to **verified, publicly documented functions**, and does not claim their absence elsewhere. Further UI or mobile testing may revise the scorecard.

## 2. Competitor feature-to-product matrix

| Product | Evidence-backed functions | Moscow position as of this PR | Build/retain/extend | Evidence |
|---|---|---|---|---|
| RUSSPASS (RU) | Trip plan, museum tickets, hotel/excursion/table booking, regional navigation, updated My Plans | Local itinerary, sourced place catalog and independent visitor history; NO authentic supplier booking | P1/P2 partner inventory and first-class ticket wallet. Never pretend our limited pilot replaces nationwide catalog | https://play.google.com/store/apps/details?id=ru.russpass.tourist ; https://www.rustore.ru/catalog/app/ru.russpass.tourist |
| Яндекс Афиша (RU) | Ticket purchase, named events, refund requests, reschedule/cancellation support | User-declared tickets, local inquiry notebook; NO payment/refund actions | Event occurrence identity, changes/cancellation evidence, explicit refunds provider channel, original seller and fee breakdown | https://yandex.ru/support/afisha/ru/theatre-return ; https://yandex.ru/support/afisha/ru/cancellations.html |
| 2ГИС (RU) | Place favorites, user collections, collection descriptions, saved notes, directions | Saved places and visit notes, curated catalog | Collection-to-itinerary link, personal public/private list ACL, source-aware place deduplication | https://help.2gis.ru/question/izbrannoe-v-2gis-chto-takoe-i-kak-polzovatsya |
| Tripster (RU) | Guide-owned date/time availability, private and group products, instant booking, capacity and closure | Generic local activity planning; NO connected excursion stock | Group size/class, guide approval, guest meeting point (released only with supplier permission), expiry, cancellations | https://experience.tripster.ru/help_center/guides/experience_edit/schedule/ ; https://experience.tripster.ru/help-center/travelers/ |
| Timepad (RU) | Event organizer registration, paid/free tickets, attendee categories, limits, discount codes, entry scanning | Personal event/ticket records; no sale or scan authority | Registration/deep links, venue event seat capacity; scanned attendance only with organizer authorization | https://for-business.timepad.ru/ |
| YCLIENTS (RU) | Services by specialist and time, availability controls, staff booking settings, configurable prepayment, staff waitlist | StudioBook is a design candidate only; venue appointment may be entered personally | Only through approved vendor APIs. Staff/service/slot version, waitlist state, prepayment expiration and consent | https://support.yclients.ru/676 ; https://support.yclients.ru/960 ; https://support.yclients.ru/577 |
| TastyIgniter / RestoDirect (global/open source) | Menu, ordering, restaurant reservations and API extension options; inspect actual version/extensions before selection | No restaurant POS/menu API, external link and user-declared table only | Tenant-isolated backend adapter, menu version, table capacity, kitchen acceptance, KKT and reconciliation, not full iiko replacement | https://github.com/tastyigniter/TastyIgniter ; https://tastyigniter.com/docs/extensions/api |
| Wanderlog (global) | Collaborative real-time itinerary, budgeting and split expenses, travel reservations, checklists, guides, offline access, map and route optimization | Locally saved trip and history, single-user and no verified cross-device collaboration or budgeting | P1 privacy-preserving expenses + checklist + readable export, P2 shared itinerary with ACL and conflict-free merges | https://wanderlog.com/ ; https://wanderlog.com/help/about-us |
| TripIt (global) | Forward email confirmations, authorized Inbox Sync, manual plan types, calendar sharing and attachments | ICS paste/import only, private local plan; email and cross-account sync NOT built | P1 file/ICS/PDF/manual import with user review, P2 opt-in inbox authorization and no silent booking upgrades | https://help.tripit.com/en/support/solutions/articles/103000063275-adding-travel-plans-to-tripit ; https://www.tripit.com/web/free |
| OpenTable (global) | Provider-owned waitlist, dining experiences, prepay and ancillary offers (restaurant-side) | User-entered time and party, no held tables or partner communication | P2 supplier-owned waitlist, no-show/terms, up-front charge evidence, notification hooks | https://www.opentable.com/restaurant-solutions/products/features/owner-app/ |
| TheFork (global) | Actual restaurant time slots, bookable offers, eligible rewards (Yums) | No real slots, loyalty, rewards or cashbacks | P3 verified benefits only by signed merchant program; never imply available discounts | https://www.thefork.com/yums |
| Booking/discovery verticals (GetYourGuide, Tiqets, Klook, Fever, ticketed venues) | Common product class: tours, timed-entry tickets and event vouchers; feature-specific rights/availability require individual verification | Consumer-side manual records only | Venue/event/occurrence/seat class, supplier version, cancellation rules, proof, mobile ticket gate. No scraped stock | Provider contract and per-feature technical docs are a precondition; do NOT mark as implemented |

Note: entries in this matrix are not comprehensive feature sets or a laboratory UI comparison. The distinction between **documented**, **built in Draft**, **connected**, and **acceptance-tested** is mandatory.

## 3. Current verified code capabilities (not a public launch claim)

| Internal module | Evidence path | State | Limitation |
|---|---|---|---|
| Personal trip, day planning | `src/travel/personalTrip.ts` and `src/features/trip/PersonalTripPlanner.tsx` | Draft code, parent PR #191 CI GREEN | Only locally authoritative |
| Fixed booked time and conflict detector | `src/travel/tripScheduler.ts` | Contract E2E existing | Time-to-transfer not externally verified |
| Local durable revision journal and recovery | `src/travel/personalTripTransaction.ts` | Existing regression coverage | No cross-device atomic transaction |
| User declaration vs provider confirmation | `src/travel/tripDayPresentation.ts`, `src/travel/serviceBookingBridge.ts` | Code and tests | No provider-signed booking receipts |
| Source-controlled venue directory | `src/travel/curatedMoscowPlaces.ts` | 7 curated POIs | Missing event inventory and dynamic opening hours |
| Own venue time and ticket form | `src/features/trip/VenueServiceIntakeCard.tsx` | Draft UI, PR #191 CI GREEN | Does not hold any restaurant table |
| Tickets/wallet, dispute notes | `src/features/trip/BookingWalletCard.tsx`, `src/travel/bookingResolution.ts` | Code and tests | Local contact notes only, not real customer support |
| Visitor history and journal | `src/features/trip/MoscowPassportCard.tsx` | Code + E2E | User-confirmed rather than physical attendance |
| ICS import | `src/travel/calendarInviteImport.ts` | Contract + browser coverage | Not inbox, seller or payment proof |
| Trip readiness / pre-trip checks | `src/travel/tripReadiness.ts`, `src/features/trip/TripReadinessCard.tsx` | **New Draft implementation; exact-head CI pending** | Only flags local issues, does not certify readiness |

## 4. Priority backlog — preserve the strengths, close gaps

### P0 — correctness / UX, implement without new supplier contracts
- **MOS-P0-01** Local readiness panel for selected day AND whole trip, issue provenance, cross-midnight booked overlap and personal-plan time collision. Exit: screenshot at 375/768/1440, 2 bookings conflict test, no false provider truth, no crash on reload.
- **MOS-P0-02** Distinguish empty local plans from successful supplier reservations. Exit: no generated references, stamps, QR, emails or confirmed states without provider evidence.
- **MOS-P0-03** Protect saved draft on quota failure and concurrency. Exit: an injected journal failure never reports success or clears the user form; explicit retry safe; no auto double-commit.
- **MOS-P0-04** Verify booked time, name and official source link from canonical registry; no duplicate entry across Discover → Plan → Visit. Exit: stable item ID and Passport link, recoverable archive.
- **MOS-P0-05** Evidence pack from real browser with SHA, screenshots 375/768/1440, 25-second MP4 and visible interactions. Exit: artifact manifests + watched clips.

### P1 — high-utility offline experiences (candidate; NOT yet implemented)
- Consent-based local attachments for genuine ticket/PDF/photo receipts with data minimization, private export and deletion. Never display user QR publicly.
- Personal budget and group expense allocation. **Do not silently ingest card/bank/retailer information**. Separate estimate vs actual expense and purchase status; show user-editable amounts in currency with provenance.
- Named collections, interests and seasonality, source freshness and admission evidence for real attractions.
- Local checklist (ticket, opening hours, travel buffer, accessibility, meeting point, refund terms) and optional reminders with opt-in. **Do not generate notifications without user action**.
- Responsive compact card layout (375/768/1440), distinguish local offline information from live supplier signals.
- Booking import from approved user-selected files with preview, redaction and strict provider-verification boundary. No autonomous email scanning.

### P2 — authentic supplier ecosystem (blocked on API agreements and legal assessment)
- RestoDirect tenant vendor tables/menu/order status: `restaurant ID ↔ location ID ↔ menu revision ↔ basket ↔ order acceptance ↔ kitchen ↔ receipt`. Only payment processor and KKT return authoritative financial status.
- Museums/cinema/theatre: `venue → event → occurrence → ticket category/seat → supplier hold → payment authorization → seller-signed ticket → check-in`.
- StudioBook: `service → specialist → working calendar → resource slot/version → hold expiry → confirmed appointment → cancellation`.
- Full provider webhooks: signed, idempotent, timestamp-bound, audited, replay-safe; avoid accepting raw webhook bodies as supplier proof.
- Original-seller customer support and refunds: money cannot be edited by the platform without new explicit order revision and user consent. Refund initiated and recorded by authorized merchant.
- If API is unavailable, use source-controlled external link ONLY. No misleading mocked checkout.

### P3 — expansion once P0-P2 survive tests
- Consent-based collaborative planning with roles, private/public visibility, optimistic concurrency, shareable exports and per-member edit audit.
- Multi-city via destination-specific source registry, timezone, opening-hours authority, local ticket regulations, identity and routing evidence.
- Personalized recommendation and accessibility/child/family preferences. Only recommend services based on declared availability; unknown should be unknown.
- Aggregated merchant analytics only from permitted transaction events; never disclose personal diary or imported reservations by default.

## 5. Navigation, UI and information hierarchy
1. **Discover:** attractive, sourced places; filters; no empty-category fake events.
2. **Place detail:** address and photo rights, verified source link, opening hours *only with freshness*.
3. **Add to plan:** day/time, party, original seller/link, local vs supplier status. One consistent action surface per vertical.
4. **Today:** actual clock, booked commitments, walking-time trust labels and visible disruptions.
5. **Readiness:** conflict vs review vs missing details, scope day/all days, navigation to booking inquiry. No fabricated status score.
6. **Wallet:** original order proof and merchant identity, cancellation and support terms; encrypted local file access when developed.
7. **Visit Passport:** user check-in, notes, photos, private history, archive, opt-in sharing.
8. **Vendor mode (future):** isolated tenant with orders, inventory, employees and finances; never entangle consumer data with merchant records.

## 6. Release gates, test scenarios and measurable UX verification

Run against an exact SHA, not inherited GREEN from a parent:
- Contract: booking status does not upgrade itself, the entire trip survives reload, no duplicate catalog entry, local schedule conflicts are deterministic, booking inquiry notes never update real seller state.
- E2E: two overlapping declared tickets, overnight restaurant vs next-day concert, previous day archive/restore, invalid time or party size, aborted write/retry, no empty category fabricated event, inbound URL cannot leak a private order reference.
- Visual: all primary screens in 375 / 768 / 1440, non-clipped labels and correct accessible touch targets; inspect REAL screenshot output, not only green E2E status.
- Security/privacy: authenticated provider server adapter, HTTPS canonical hostname restrictions, no API token in client bundle, explicit user consent and retention.
- Financial: every penny tied to provider order revision + consent + payment and refund reconciliation before production.
- Physical acceptance: iOS/Android devices and keyboard screen readers; crash recovery and genuine offline behavior.

Suggested product indicators **(measurement definitions; NOT measured values)**:
- Plan completion = number of newly created itineraries with at least one saved stop / eligible trip creation.
- Booking truth mismatch = count of supplier-declared state mismatches / bookings with independent supplier reconciliation; do not compute without external evidence.
- Durable-save failure rate = failed committed mutations / attempted durable mutations.
- Successful repair = users who resolved a local conflict after explicit edit / users who opened that conflict.
- Visit diary use = check-in with explicit user evidence / active saved-stop sessions.

## 7. Policy, rights and integration boundaries
- Russian merchants: review 54-FZ/receipt integration and seller/agent role before real payment, 152-FZ and data localization as applicable, applicable consumer rights and cancellation rules. Legal counsel review required for actual transaction processing.
- Provider, municipality, venue and museum APIs require authorized access and contracts. Do not scrape credentials, fake availability or generate "ticket" QR codes without verified issuer acceptance.
- Editorial media: only store image assets with rights and provenance; screenshot evidence of the product must note **test/demo data**, exact SHA, capture time and platform.
- No new paid service/plan or production credentials in this phase.
- Production = HOLD until CI + independent security + provider admission + device QA.

## 8. Primary public sources (checked 2026-10-20)
- RUSSPASS official listings: https://play.google.com/store/apps/details?id=ru.russpass.tourist ; https://www.rustore.ru/catalog/app/ru.russpass.tourist
- Yandex Afisha: https://yandex.ru/support/afisha/ru/theatre-return ; https://yandex.ru/support/afisha/ru/cancellations.html
- 2GIS: https://help.2gis.ru/question/izbrannoe-v-2gis-chto-takoe-i-kak-polzovatsya
- Tripster: https://experience.tripster.ru/help_center/guides/experience_edit/schedule/
- Timepad: https://for-business.timepad.ru/
- YCLIENTS: https://support.yclients.ru/676 ; https://support.yclients.ru/960 ; https://support.yclients.ru/577
- Wanderlog: https://wanderlog.com/ ; https://wanderlog.com/help/about-us
- TripIt: https://help.tripit.com/en/support/solutions/articles/103000063275-adding-travel-plans-to-tripit
- OpenTable: https://www.opentable.com/restaurant-solutions/products/features/owner-app/
- TheFork: https://www.thefork.com/yums
- TastyIgniter: https://github.com/tastyigniter/TastyIgniter ; https://tastyigniter.com/docs/extensions/api

**Verification limit:** Features documented by official product pages are real marketing or help claims; no conclusion here proves their correctness in current production, API partner eligibility or superiority of Moscow. Lab UX comparison is a separate task.
