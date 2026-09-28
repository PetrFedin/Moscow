# Moscow live provider strategy

Research snapshot: 2026-09-28.

## Decision

Do not scrape undocumented private endpoints and do not treat a static city directory as live operational truth.

Use two different source classes.

### 1. RUSSPASS / formal tourism-platform integration

Role in the target architecture:

- current events;
- tourism inventory intended for visitor discovery;
- ticket / booking handoff where formally supported;
- operational changes when the agreed feed exposes them.

Why this is the strategic target:

- RUSSPASS is already a Moscow tourism product surface rather than a generic directory;
- Moscow public materials describe a Moscow events surface where a visitor can move from event discovery to ticket purchase;
- RUSSPASS materials describe integration with Afisha and a large multi-category travel inventory;
- this makes it a better target for #42 than inventing a separate city events/booking catalog.

Current limitation:

**No stable public RUSSPASS API contract for this use case has been verified in the project.**

Therefore:

- do not reverse-engineer private endpoints;
- do not commit guessed URLs;
- do not claim RUSSPASS integration exists;
- request a formal feed/API/sandbox or agreed deep-link contract.

Public reference pages used for the integration decision:

- https://www.mos.ru/upload/documents/files/8545/Monitoringsostoyaniyarinkainformacionnihonlain-resyrsovgorodaMoskviza2025god.pdf
- https://cms-business.russpass.ru/media/documents/2120892900_1746239235.pdf
- https://igraivmoskvu.russpass.ru/

## 2. Moscow Open Data

Role in the target architecture:

- official baseline inventory;
- reference attributes;
- city-owned registries;
- source-backed place existence and static characteristics where an appropriate dataset exists.

Potential first useful category:

- `Общественное питание в Москве`
- https://data.mos.ru/opendata/7710881420-obshchestvennoe-pitanie-v-moskve

Developer documentation entry point:

- https://data.mos.ru/developers/documentation

Important boundary:

A row in an open-data register does **not** by itself prove:

- open now;
- current table availability;
- current booking availability;
- current price;
- remaining inventory.

For such providers the adapter should normally declare:

`capabilities: ['inventory']`

and emit:

`operationalStatus: 'unknown'`.

It must not promote directory data into live status.

## Provider capabilities

The Live Destination Authority separates legal/provider identity from claim authority.

Supported capability classes:

- `inventory`;
- `event-schedule`;
- `operational-status`;
- `booking-handoff`.

A provider may assert only the claims covered by its declared capability set.

Examples:

### Static official register

```text
official + inventory
→ entity exists
→ coordinates/reference attributes
→ operationalStatus=unknown
→ no booking
```

### Formal event feed

```text
official/partner
+ inventory
+ event-schedule
+ operational-status
→ scheduled/cancelled/rescheduled
→ still no booking unless another provider has booking-handoff authority
```

### Ticket provider

```text
booking-provider
+ booking-handoff
→ verified deep link
→ independent verifiedAt/expiresAt
```

## Data access request for RUSSPASS / Moscow

Before a production adapter is written, request a written answer for the items below.

### Identity

- stable provider ID;
- stable event/place/product ID;
- relationship between event, venue and product/ticket IDs;
- rules for deleted/merged records.

### Change semantics

- created time;
- modified time;
- published time;
- start/end;
- cancelled;
- rescheduled;
- sold-out;
- temporarily unavailable;
- deleted/unpublished.

### Freshness

- expected update cadence;
- maximum publication delay;
- whether webhooks exist;
- polling/rate limits;
- cache rules;
- how long a last-known record may be retained.

### Localization

- Russian;
- English;
- Chinese;
- fallback rules;
- whether translated title/description has its own update/version semantics.

### Booking

- canonical public deep link;
- ticket vs reservation vs request;
- whether the link itself expires;
- whether sign-in is required;
- attribution requirements;
- permitted tracking parameters;
- whether availability can be represented;
- whether prices may be cached/published and for how long.

### Rights and attribution

- permission to display title/image/description;
- image rights/derivatives;
- required provider attribution;
- logo use;
- source link;
- retention after record expiry;
- redistribution restrictions.

### Technical

- authentication;
- sandbox;
- schemas;
- pagination;
- incremental sync;
- rate limits;
- response codes;
- retry semantics;
- SLA/support contact;
- production endpoint change policy.

## Ingestion authority

The repository now expects:

`provider adapter → raw snapshot metadata → payload SHA-256 → refresh policy → normalization → LiveDestinationFeed validation → public projection`.

The public output does not carry the raw provider payload.

Each ingestion record preserves:

- adapter ID;
- provider ID;
- snapshot ID;
- source URL;
- payload SHA-256;
- fetchedAt;
- optional sourceUpdatedAt;
- normalizedAt;
- snapshot freshness;
- normalized entity count;
- warnings.

## Refresh behavior

Each provider adapter owns a versioned refresh policy:

- expected refresh interval;
- hard maximum snapshot age;
- retry interval.

A snapshot can be:

- `fresh`;
- `refresh-due`;
- `expired`;
- `future`.

`expired` and `future` snapshots are rejected before normalization.

`refresh-due` remains auditable but does not extend any entity `expiresAt`.

If the provider becomes unavailable, a stored last-known feed naturally degrades to stale through its original expiry. The system must never extend freshness merely because refresh failed.

## What we should not build yet

Do not build #42 around:

- scraped RUSSPASS HTML;
- undocumented RUSSPASS internal JSON;
- guessed event URLs;
- static fake restaurants;
- demo prices;
- invented seat availability.

A government-facing platform is stronger when it visibly refuses unsupported live claims.

## First production integration decision

Preferred sequence:

1. use the new authority contract to prepare the formal RUSSPASS/Moscow data request;
2. in parallel verify a Moscow Open Data inventory dataset and API access for a low-risk reference adapter;
3. keep the reference adapter `inventory-only`;
4. implement the RUSSPASS/event/booking adapter only after a formal contract/feed is supplied;
5. prove freshness expiry and cancellation with recorded provider fixtures;
6. only then connect live entities to Moscow Destination Journey (#42).
