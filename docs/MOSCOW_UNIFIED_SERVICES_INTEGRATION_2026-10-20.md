# Moscow — Unified Venue Services & Booking Bridge
**Date:** 2026-10-20  
**Branch:** feat/moscow-unified-venue-booking-intake-20261020  
**Status:** DRAFT / RELEASE HOLD. No external booking service has been activated.

## Product purpose

Unify visitor activity across restaurants, cafes, bars, museums, galleries, exhibitions,
theatres, cinemas, concerts, events, studios, tours and activities. Each service appears
in the **same travel workflow**, rather than launching seven incompatible booking UIs:

Discovery → official venue and supplier information → choose day/time/participants →
plan OR declare an already-existing reservation → durable personal-trip entry →
fixed-commitment scheduler + Today + Wallet → visitor-confirmed check-in → Passport/journal.

**Admitted at this stage:** offline/local-only planning, user-declared bookings,
read-only official-site handoff, authoritative 7-place source-backed Moscow pilot,
venue-type capability registry, explicit empty categories and failure-injection tests.

**Not admitted:** live supplier availability, seat/table inventory, kitchen order,
payment/charge/refund, ticket issuance, signed QR, supplier-confirmed booking state,
PMS/POS synchronization, invoicing, cross-device synchronisation, messaging or 2nd city.

## Current architecture and files

- `src/travel/serviceBookingBridge.ts` — destination-specific services and admit-only
  official source handoffs; maps existing curated venues to the canonical PersonalTrip model.
- `src/features/trip/VenueServiceIntakeCard.tsx` — controlled venue service form, explicit
  mode distinction, source link and durable-save acknowledgement.
- `src/features/trip/PersonalTripPlanner.tsx` — persists through the existing
  `transactTripStorage` journal / read-back checks. Booking wallet, Today and Passport
  receive the SAME item, not a second mutable booking store.
- `src/features/destination/CuratedMoscowDirectory.tsx` — category filters; no
  fabricated venue records when a category has not been independently admitted.
- `src/travel/personalTrip.ts` — optional `plannedPartySize` for non-booked plans;
  booked party size is owned by `commitment.partySize` instead.

### User-declared status semantics

- `plan`: no supplier commitment, no payment/booking number, optional planned party count.
- `self-reported`: user says they already hold a ticket/reservation. Stored as
  `commitment.status='confirmed'` AND `verification='user-declared'`, never
  `verification='provider-confirmed'`. "Confirmed" is only the person's own declaration,
  not evidence of an external transaction.
- Official link: opens only a source-controlled HTTPS URL; never includes entered order
  references, user notes, session tokens or customer profiles in the URL.
- `provider-confirmed`: remains inaccessible to this bridge. Needs authenticated supplier
  truth, evidence provenance, immutable receipts and verified status transition.

### Supported venue capabilities; NOT connected providers

| Category | Service class | Candidate adapter (offline planning only) |
|---|---|---|
| Restaurant, cafe, bar | Dining, table reservations, future direct orders | RestoDirect / TastyIgniter |
| Museum, gallery, exhibition, theatre, cinema, concert, event | Timed entry and tickets | Authorized ticket provider |
| Excursion / activities | Timed event / group capacity | Authorized provider after admission |
| Studio / appointment | Worker + service + slot | StudioBook concept, implementation undecided |
| Park | Personal itinerary only | No reservation unless a separate validated paid event |

The 7 existing official-source venue cards remain intact. New service category filters
without verified candidates show honest empty states; they do NOT fake schedules or pricing.

## RestoDirect interface (future; not deployed)

TastyIgniter 4.x application source is MIT-licensed:
https://github.com/tastyigniter/TastyIgniter/blob/4.x/LICENSE.md
Official API extension documentation:
https://tastyigniter.com/docs/extensions/api
Reservation extension documentation:
https://tastyigniter.com/docs/master/extensions/reservation

TastyIgniter's API extension exposes menu, order and reservation resources and uses
Laravel Sanctum authentication. This is a *candidate backend*, not proof that an
individual restaurant has installed/configured it, has available tables, or accepts
integrations.

Future flow:
`VenueId → Tenant/LocationId mapping → read-only menu/capacity → user selects slot →
 server-side consented booking draft → provider booking accepted → provider reference +
 evidence/version → immutable audit event → Wallet/Trip update`.
For orders: `menu-version → cart snapshot → final consented price and allergens →
 kitchen acceptance → payment/fiscal flow (after legal admission) → status/receipt`.
Do not add customer-supplied seat counts to restaurant availability without supplier
capacity confirmation. The user can cancel an unsubmitted local draft; any real order
change/refund must be obtained from the provider.

## StudioBook interface (future; not deployed)

This name denotes a project concept, not a verified connected software repository.
Before integration select and audit an actual booking engine, licensing, authentication,
webhook and API capabilities. Required provider-owned entities:
`Studio → Service → Specialist → WorkingCalendar → SlotVersion → Reservation →
 Attendance/Cancel/Refund`.
Reject double-slot allocations and stale slot versions server-side.
Never show provisional slot search as a confirmed appointment.

## Ticket / museum / theatre / cinema integration gate

Providers must supply an authorized inventory / event authority:
`venueId, hallId, eventId, occurrenceId, admission type, timezone, price,
 seat zone/seat when applicable, availabilityTimestamp, holdExpiry, providerOrderId`.
For tickets, seat selection and payment must be locked to supplier version and expiry.
No duplicate confirmations, fabricated barcodes/QR or payment claims; provider webhook
evidence must be authenticated, idempotent and stored with immutable revision history.

## Production data model (DESIGN ONLY)

```text
CatalogVenue(id, category, sourceEvidence, rights, publishedRevision)
ServiceOffering(providerId, providerServiceId, venueId, currency, priceVersion)
AvailabilitySnapshot(provider, offeringId, timeRange, capturedAt, expiresAt)
BookingIntent(id, travelerId, offeringId, partySize, slot, consentVersion)
ProviderBooking(providerId, providerReference, status, verifiedAt, evidenceHash)
OrderRevision(orderId, revision, priceBreakdown, serviceTerms, consentAt)
PaymentAttempt(orderId, providerPaymentId, idempotencyKey, status, amount)
FiscalReceipt(orderId, receiptRef, supplierLegalEntity, refundRelation)
BookingEvidenceEvent(id, bookingId, priorStatus, nextStatus, source, receivedAt)
TripItem(bookingIdOrLocalPlan, dayDate, scheduledStartAt, scheduledEndAt)
VisitPassport(visitId, tripItemId, travelerDeclared, note, optionalPhoto)
```

Payment/booking identifiers must be unique within tenant+provider scope.
Out-of-order webhooks must not roll back status. Redelivery must be idempotent.
A price increase requires an explicit new revision and user consent before charge.
Offline auto-retry is allowed only for safe reads, NOT for charging a card or submitting
a booking without idempotency and supplier reconciliation.

## Security, legal and zero-cost guardrails

- Booking secrets and staff credentials stay server-side; no public Expo/API bundle tokens.
- Purpose-limited customer consent for identity, contact, dietary needs and booking transfers.
  Keep private travel notes and past visits local unless separately consented.
- Map legal roles: the venue/issuer sells the service, Moscow may be an intermediary.
  Money flows and actual seller obligations require separate contracts/legal review.
- For Russian settlement, assess 54-FZ KKT, fiscal receipts, refund receipting,
  consumer-protection rules and merchant-of-record responsibilities before accepting payment.
  Official FNS guidance: https://www.nalog.gov.ru/rn08/news/activities_fts/16644575/
- Evaluate 152-FZ, purpose of processing, retention, operator/processor responsibility,
  Russian personal-data localization where applicable, and deletion/export.
- Never present unavailable supplier functions as enabled. Do not use scraped/private APIs,
  partner accounts or unapproved keys.
- No new paid hosting, transactional SMS, paid map/API, e-commerce provider subscription
  or live payment activation without a separate zero-cost feasibility and approval gate.

## Acceptance stages

**P0 (implemented as Draft, exact-head validation pending):**
source-controlled service capability registry; clear plan vs user-declared status; official
external handoff; typed venue/participants/time; durable persistence; Passport/Wallet reuse;
duplicate-slot guard; live browser E2E; explicit empty catalog categories.

**P1 (blocked pending real partner/provider admission):**
authenticated read-only live availability for one approved restaurant and one museum/event;
verified schedule freshness; live price and conditions; booking inquiry and evidence log.

**P2 (blocked pending contracts, data privacy and legal/payment):**
actual table/seat/appointment booking, cancellation/refund, fiscal receipts, provider-signed
confirmation, offline ticket wallet, kitchen/order UI for RestoDirect and specialist calendar
for StudioBook; optional Telegram Mini App for venue-owned orders.

**P3:** venue back office, consented merchant analytics, commissions/attribution,
multi-city inventory and rights-managed event discovery. No launch claims without real pilots.

### Release decision

Stay HOLD until exact SHA CI, independent code/security/privacy review, 375/768/1440
screenshots, real browser acceptance, crash/recovery on physical mobile devices, and
explicit partner/provider evidence. This draft changes neither main nor production.
