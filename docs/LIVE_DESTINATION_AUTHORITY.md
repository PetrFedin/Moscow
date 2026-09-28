# Live Destination Authority v1

## Purpose

Live Destination Authority is the operational-data layer for the travel platform.

It is deliberately separate from the static `DestinationPackage`.

The static package answers:

- what exists;
- why the place matters;
- which route/editorial object is published;
- which sources and rights support the content.

The live authority answers:

- what is happening now;
- whether the operational record is still fresh;
- whether an event is scheduled/cancelled/rescheduled;
- whether a place is currently open/closed where the provider supports that status;
- whether a verified booking/ticket/reservation handoff may be shown.

## Core chain

`provider → provider entity → observation → expiry → operational status → booking handoff → runtime projection`

No live state is inferred from old content or editorial copy.

## Provider identity

Every feed must declare its providers.

A provider carries:

- stable provider ID;
- provider name;
- relationship: official / city-service / partner / booking-provider;
- explicit claim capabilities;
- HTTPS source URL;
- RU / EN / ZH attribution.

Provider relationship and provider authority are separate.

Supported capabilities:

- `inventory`;
- `event-schedule`;
- `operational-status`;
- `booking-handoff`.

For example, an official city directory may have only `inventory`. That makes it authoritative for the existence/reference record, but it still cannot assert `open now`.

Attribution remains visible in the runtime projection.

## Live entity identity

Every record carries both:

- our stable live entity ID;
- the provider's own entity ID.

The pair `providerId + providerEntityId` must be unique inside a feed.

This prevents the same provider record from entering the application twice under two local IDs.

## Freshness

Every entity carries:

- `observedAt`;
- optional `validFrom`;
- mandatory `expiresAt`.

Projection states:

- `fresh`;
- `not-yet-valid`;
- `stale`.

If data is stale or not yet valid:

- current operational status becomes `unknown`;
- booking handoff is removed;
- the entity is not journey-eligible.

The application must never continue showing a stale `open`, `scheduled` or booking state as current truth.

## Operational status

v1 supports:

- open;
- closed;
- temporarily-closed;
- scheduled;
- cancelled;
- rescheduled;
- sold-out;
- finished;
- unknown.

Statuses are constrained by entity kind.

For example, a food venue cannot be `rescheduled`; an event can.

## Event time

An event requires a provider-supplied `startsAt`.

An optional `endsAt` must be later than `startsAt`.

A date in editorial content is not live event authority.

## Booking handoff

A booking handoff is shown only when:

- its provider exists in the provider registry;
- URL is HTTPS;
- action is explicit;
- `verifiedAt` is valid;
- `expiresAt` is valid;
- the handoff is fresh at projection time;
- the parent live entity itself is fresh.

The live layer does not claim that a click guarantees inventory.

## Prices and availability

Live Destination Authority v1 intentionally does not publish:

- price;
- “from” price;
- seat count;
- ticket count;
- remaining inventory;
- availability quantity.

Those fields are rejected if inserted into the v1 feed.

They require a separate provider-specific commercial/availability authority before they can become product truth.

## Editorial vs commercial

Live operational relevance and paid placement are separate authorities.

The live feed rejects sponsorship/rank-boost fields.

Commercial placements continue to live in the explicit disclosed `commercialPlacements` layer of `DestinationPackage`.

A sponsor cannot become more “relevant” merely by appearing in the live operational feed.

## Languages

Public live entities require:

- Russian;
- English;
- Chinese.

Russian remains the primary/default editorial language.

Provider attribution is also required in RU / EN / ZH.

## Journey eligibility

v1 marks an entity journey-eligible only when:

- data is fresh; and
- status is operational for the current moment.

Current eligible statuses:

- open;
- scheduled;
- rescheduled.

Cancelled, sold-out, finished, closed, temporarily-closed, unknown and stale records are not journey-eligible.

This is only the live operational gate.

Actual route calculation remains a separate routing authority and is not synthesized from coordinates.

## Moscow reference state

The current Moscow `DestinationPackage` contains only source-backed heritage inventory.

No restaurant, event, hotel, availability or booking record is added until a real provider feed is connected.

Therefore the existence of this contract must not be described as “live Moscow data is connected”.

## What #41 still needs after this contract

1. choose first real provider/feed;
2. define ingestion adapter;
3. store/provider-cache raw observation with audit metadata;
4. generate validated `LiveDestinationFeed`;
5. define refresh cadence from provider semantics;
6. define failure/retry behavior;
7. display provider attribution and stale state in UI;
8. connect booking handoff;
9. prove no stale status survives expiry;
10. only then use live entities in #42 Moscow Destination Journey.


## Provider ingestion and audit

Provider adapters do not write directly into public journey state.

The ingestion chain is:

`raw provider response → snapshot envelope → checksum/audit → refresh policy → adapter normalization → LiveDestinationFeed validation → public projection`.

A snapshot records:

- provider ID;
- snapshot ID;
- HTTPS source URL;
- fetched time;
- optional provider-updated time;
- SHA-256 of the raw payload.

The public normalized feed does not contain the raw payload.

### Refresh policy

Each adapter declares:

- expected refresh interval;
- hard maximum snapshot age;
- retry interval.

Snapshot status:

- fresh;
- refresh-due;
- expired;
- future.

Expired and future snapshots are rejected.

Refresh-due data may normalize with an explicit warning, but normalization never extends an entity's own `expiresAt`.

Provider outage therefore cannot turn last-known data into indefinitely current data.

### Multi-provider merge

Validated feeds may be merged only when they target the same destination.

Provider IDs must remain unique across the merged feeds.

The merged result is validated again through Live Destination Authority before it can be projected.
