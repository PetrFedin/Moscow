# Moscow / Trip Finance v1 — contracts, provenance and product acceptance

**2026-10-22 · Draft feature branch, NOT released**

## Problem and operating principle
Existing Moscow city, Today, ticket wallet, visit history and travel plan share one `PersonalTrip` entity and a durable local journal. However no private expense model is available. The v1 feature must never imply bank transactions or seller prices where none are verified. All budget figures are personally entered and cannot upgrade the truth class of a ticket or reservation.

## Data model
The optional `PersonalTrip.finance` object lives within the authoritative v1 trip snapshot:
- `currency: 'RUB'`; `budgetMinor?` is a per-trip ceiling (kopecks).
- `entries[]`: immutable ID, day, category, title, estimated or actual integer kopecks, optional itinerary `itemId`, created/updated timestamps and literal `source: 'traveler-entered'`.
- Storage remains backward compatible. Old trips without `finance` parse normally. Archives, imports, exports, restore and journal transactions carry the finance field along with the trip; validation rejects malformed and duplicated entries before exposing state to the UI.
- Itinerary links are intentionally historical. If a stop is later deleted, spending records remain recoverable rather than being silently erased; coverage counts only live, matching stop IDs. Newly created links must point to a known item.

## Forecast calculation (no hidden assumptions)
For every financial entry `e`:
- `estimated = sum(e.estimateMinor ?? 0)`;
- `actual = sum(e.actualMinor ?? 0)`;
- `outstanding = sum(e.actualMinor === undefined ? (e.estimateMinor ?? 0) : 0)`;
- **`projected = actual + outstanding`**, since an entered actual replaces, and does not add to, that row's estimate;
- `variance = sum(e.actualMinor - e.estimateMinor)` **only where both numbers exist**;
- `remaining = tripBudget - projected` when a whole-trip budget exists. Negative remaining is an over-limit forecast, NOT a bank overdraft.
- Filtering to one day does not incorrectly apply the whole-trip budget to that day; category totals are derived from precisely the same input rows as the global total.

Example, strictly **test fixture not measured visitor data**: budget 6000.00 RUB; museum planned 2000.00, user-recorded 1500.50; dinner planned 3000.00, no actual → projection 4500.50 RUB; forecast remaining 1499.50 RUB. No supplier payment status is implied.

## UI and internal wiring
- `TripFinanceCard` is part of the same PersonalTripPlanner as the day plan, readiness issues, booking wallet and Passport. It allows a user to set/clear whole-trip budget, create/edit expense with optional itinerary link, separately enter estimated and actual amount, inspect full/day/category forecast, and delete with explicit confirmation.
- Finance mutations run through `persistVisitorAction(next, 'finance')` → `transactTripStorage`. The form is cleared only after a successful verified write; recovery errors preserve input. All summaries are deterministic pure projections and do not write to provider, bank, analytics network or checkout.
- Financial entries do not mutate supplier `commitment` verification, receipts or visits.
- DayComposer changes remove prominent engineering/demo labels (`DAY COMPOSER · V2`, raw `FIXED/FLEX/TRAVEL`) and favor human RU/EN/ZH copy while retaining source-state caveats and schedule invariants.

## Acceptance and release gates
1. **Model and storage:** integer money input; no float/rounding; replacement rather than double-counting; day/category reconciliation; duplicate/tampered state fail-closed; soft references; backward compatibility.
2. **Browser:** personally created budget and two rows, link to specific stop, correct forecast, protected booking status and durable reload; day/all scope and visibly correct empty states.
3. **Visual:** true 375/768/1440 Chromium screenshots of the finance card with real entered test fixtures, no clipped headings or horizontal overflow; film results 25s with SHA association.
4. **Production release:** still HOLD until independent security/privacy and physical device verification. Do not call personal notes proof of actual purchases; no automated refund, charging, banking, or real provider authority in this stage.

**Limits:** Single currency (RUB), local-first journal, no card reconciliation, no VAT documents, no foreign-exchange conversion or merchant price oracle. Plan budget is a cap, not a guaranteed spend. A linked ticket is not evidence of a payment.
